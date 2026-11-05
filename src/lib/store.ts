import { useSyncExternalStore } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, increment, onSnapshot, setDoc, updateDoc, writeBatch,
  type DocumentReference, type Unsubscribe, type WriteBatch,
} from 'firebase/firestore';
import type { AppData, Erro, HistoricoItem, Materia, Origem, Prioridade, SyncStatus } from './types';
import { MATERIAS_INICIAIS } from './constants';
import { normalizar, novoId } from './utils';
import { auth, configurado, db } from './firebase';

/*
 * Modelo no Firestore (tudo privado por usuária, ver firestore.rules):
 *   usuarios/{uid}                     { criadoEm, email }
 *   usuarios/{uid}/materias/{materiaId} { nome, topicos[], ordem }
 *   usuarios/{uid}/erros/{erroId}       { ...Erro }
 * Cada alteração grava só os campos alterados, então edições em aparelhos
 * diferentes em campos diferentes não se sobrescrevem.
 */

export interface Usuario { uid: string; nome: string; email: string; foto: string | null }

export interface Estado extends AppData {
  auth: 'carregando' | 'deslogado' | 'logado';
  usuario: Usuario | null;
  /** true depois da primeira leitura (cache ou servidor) */
  carregado: boolean;
  sync: SyncStatus;
  syncMsg: string;
  ultimaSync: number | null;
}

const vazio = (): AppData => ({ erros: [], materias: [] });

let estado: Estado = {
  ...vazio(), auth: configurado ? 'carregando' : 'deslogado', usuario: null, carregado: false,
  sync: 'conectando', syncMsg: 'Conectando…', ultimaSync: null,
};
const ouvintes = new Set<() => void>();

function emitir(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach((f) => f());
}

export function useEstado(): Estado {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => estado);
}
export const getEstado = () => estado;

/* ---------- Cópia local (localStorage) para abertura instantânea ---------- */
const chaveLocal = (uid: string) => `caderno-erros:dados:${uid}`;
function salvarLocal() {
  if (!estado.usuario || !estado.carregado) return;
  try { localStorage.setItem(chaveLocal(estado.usuario.uid), JSON.stringify({ erros: estado.erros, materias: estado.materias })); } catch { /* opcional */ }
}
function lerLocal(uid: string): AppData | null {
  try {
    const p = JSON.parse(localStorage.getItem(chaveLocal(uid)) ?? 'null') as AppData | null;
    return p && Array.isArray(p.erros) && Array.isArray(p.materias) ? p : null;
  } catch { return null; }
}
export function limparCopiaLocal() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('caderno-erros:dados:')).forEach((k) => localStorage.removeItem(k));
  } catch { /* sem storage */ }
}

/* ---------- Referências ---------- */
function uid(): string {
  if (!estado.usuario) throw new Error('Sem usuária conectada');
  return estado.usuario.uid;
}
const refErro = (id: string) => doc(db!, 'usuarios', uid(), 'erros', id);
const refMateria = (id: string) => doc(db!, 'usuarios', uid(), 'materias', id);

/* ---------- Status de sincronização ---------- */
const meta = { erros: { pend: false, cache: true }, materias: { pend: false, cache: true } };
let falhaEscrita: string | null = null;

function atualizarStatus() {
  if (falhaEscrita) { emitir({ sync: 'erro', syncMsg: falhaEscrita }); return; }
  const pend = meta.erros.pend || meta.materias.pend;
  const cache = meta.erros.cache || meta.materias.cache;
  const online = typeof navigator === 'undefined' || navigator.onLine;
  if (!online) emitir({ sync: 'offline', syncMsg: pend ? 'Sem internet. As alterações estão salvas neste aparelho e serão enviadas quando a conexão voltar.' : 'Sem internet. Mostrando os dados salvos neste aparelho.' });
  else if (pend) emitir({ sync: 'enviando', syncMsg: 'Salvando na nuvem…' });
  else if (cache) emitir({ sync: 'conectando', syncMsg: 'Conectando à nuvem…' });
  else emitir({ sync: 'sincronizado', syncMsg: 'Tudo salvo na nuvem', ultimaSync: Date.now() });
}

/** Grava em segundo plano: a interface não espera a rede (o cache offline confirma na hora). */
function enviar(p: Promise<unknown>) {
  p.catch((e: { code?: string }) => {
    falhaEscrita = e?.code === 'permission-denied'
      ? 'A nuvem recusou a gravação (sem permissão). Saia e entre de novo com sua conta.'
      : e?.code === 'resource-exhausted'
        ? 'Limite diário do plano gratuito atingido. As alterações seguem neste aparelho e serão enviadas amanhã.'
        : e?.code === 'not-found'
          ? 'Um registro alterado aqui já tinha sido excluído em outro aparelho.'
          : 'Falha ao salvar na nuvem. Recarregue a página.';
    atualizarStatus();
    setTimeout(() => { falhaEscrita = null; atualizarStatus(); }, 8000);
  });
}

async function emLotes(ops: ((b: WriteBatch) => void)[]) {
  for (let i = 0; i < ops.length; i += 450) {
    const b = writeBatch(db!);
    ops.slice(i, i + 450).forEach((op) => op(b));
    await b.commit();
  }
}

/* ---------- Ciclo de vida: login e assinaturas ---------- */
let assinaturas: Unsubscribe[] = [];

function pararAssinaturas() {
  assinaturas.forEach((u) => u());
  assinaturas = [];
}

async function garantirPerfil(u: User) {
  const ref = doc(db!, 'usuarios', u.uid) as DocumentReference;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return;
  } catch {
    return; // offline sem cache: tenta na próxima abertura
  }
  // primeira vez desta conta: cria o perfil e as matérias iniciais
  await emLotes([
    (b) => b.set(ref, { criadoEm: new Date().toISOString(), email: u.email ?? '' }),
    ...MATERIAS_INICIAIS.map((m, i) => (b: WriteBatch) => b.set(doc(db!, 'usuarios', u.uid, 'materias', m.id), { nome: m.nome, topicos: m.topicos, ordem: i })),
  ]);
}

function assinar(u: User) {
  pararAssinaturas();
  meta.erros = { pend: false, cache: true };
  meta.materias = { pend: false, cache: true };
  let errosOk = false;
  let materiasOk = false;

  const falha = (e: { code?: string }) => {
    emitir({ sync: 'erro', syncMsg: e.code === 'permission-denied' ? 'Sem permissão para ler os dados. Confira as regras do Firestore.' : 'A sincronização parou. Recarregue a página.' });
  };

  assinaturas.push(onSnapshot(collection(db!, 'usuarios', u.uid, 'erros'), { includeMetadataChanges: true }, (snap) => {
    meta.erros = { pend: snap.metadata.hasPendingWrites, cache: snap.metadata.fromCache };
    const erros = snap.docs.map((d) => {
      const e = d.data() as Erro;
      return { ...e, id: d.id, origem: e.origem ?? null, historico: e.historico ?? [], revisoes: e.revisoes ?? 0, comoEvitar: e.comoEvitar ?? '', referencia: e.referencia ?? '' };
    }).sort((a, b) => a.atualizadoEm - b.atualizadoEm);
    errosOk = true;
    emitir({ erros, carregado: estado.carregado || (errosOk && materiasOk) });
    salvarLocal();
    atualizarStatus();
  }, falha));

  assinaturas.push(onSnapshot(collection(db!, 'usuarios', u.uid, 'materias'), { includeMetadataChanges: true }, (snap) => {
    meta.materias = { pend: snap.metadata.hasPendingWrites, cache: snap.metadata.fromCache };
    const materias = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as { nome: string; topicos?: string[]; ordem?: number }) }))
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome, 'pt-BR'))
      .map(({ id, nome, topicos }) => ({ id, nome, topicos: topicos ?? [] }));
    materiasOk = true;
    emitir({ materias, carregado: estado.carregado || (errosOk && materiasOk) });
    salvarLocal();
    atualizarStatus();
  }, falha));

  void garantirPerfil(u);
}

export function iniciarSync() {
  if (!auth) return;
  const reavaliar = () => estado.usuario && atualizarStatus();
  window.addEventListener('online', reavaliar);
  window.addEventListener('offline', reavaliar);

  onAuthStateChanged(auth, (u) => {
    if (!u) {
      pararAssinaturas();
      emitir({ ...vazio(), auth: 'deslogado', usuario: null, carregado: false });
      return;
    }
    const local = lerLocal(u.uid);
    emitir({
      auth: 'logado',
      usuario: { uid: u.uid, nome: u.displayName ?? '', email: u.email ?? '', foto: u.photoURL },
      ...(local ?? vazio()),
      carregado: !!local,
      sync: 'conectando', syncMsg: 'Conectando à nuvem…',
    });
    assinar(u);
  });
}

/* ---------- Ações ---------- */
const agora = () => new Date().toISOString();

export type NovoErro = Omit<Erro, 'id' | 'atualizadoEm' | 'revisoes' | 'historico' | 'ultimaRevisao'>;

/** Atualiza o estado na hora; o Firestore confirma pelo listener. */
function otimista(parcial: Partial<AppData>) {
  emitir(parcial);
  salvarLocal();
}

function topicoNovo(materiaId: string, topico: string): boolean {
  const m = estado.materias.find((x) => x.id === materiaId);
  return !!m && !m.topicos.some((t) => normalizar(t) === normalizar(topico));
}

function comTopico(materiaId: string, topico: string): Materia[] {
  return estado.materias.map((m) => (m.id === materiaId && topicoNovo(materiaId, topico) ? { ...m, topicos: [...m.topicos, topico] } : m));
}

export const acoes = {
  adicionarErro(dados: NovoErro): Erro {
    const erro: Erro = { ...dados, id: novoId(), atualizadoEm: Date.now(), revisoes: 0, historico: [{ em: agora(), campo: 'criado', para: dados.prioridade }] };
    const novoTop = topicoNovo(dados.materiaId, dados.topico);
    otimista({ erros: [...estado.erros, erro], materias: comTopico(dados.materiaId, dados.topico) });
    enviar(setDoc(refErro(erro.id), erro));
    if (novoTop) enviar(updateDoc(refMateria(dados.materiaId), { topicos: arrayUnion(dados.topico) }));
    return erro;
  },

  editarErro(id: string, dados: NovoErro) {
    const atual = estado.erros.find((e) => e.id === id);
    if (!atual) return;
    const hist: HistoricoItem[] = [];
    if (atual.prioridade !== dados.prioridade) hist.push({ em: agora(), campo: 'prioridade', de: atual.prioridade, para: dados.prioridade });
    if (atual.origem !== dados.origem) hist.push({ em: agora(), campo: 'origem', de: atual.origem, para: dados.origem });
    hist.push({ em: agora(), campo: 'edicao' });
    const mudados: Record<string, unknown> = {};
    (Object.keys(dados) as (keyof NovoErro)[]).forEach((k) => { if (atual[k] !== dados[k]) mudados[k] = dados[k]; });
    const novoTop = topicoNovo(dados.materiaId, dados.topico);
    otimista({
      erros: estado.erros.map((e) => (e.id === id ? { ...e, ...dados, historico: [...e.historico, ...hist], atualizadoEm: Date.now() } : e)),
      materias: comTopico(dados.materiaId, dados.topico),
    });
    enviar(updateDoc(refErro(id), { ...mudados, atualizadoEm: Date.now(), historico: arrayUnion(...hist) }));
    if (novoTop) enviar(updateDoc(refMateria(dados.materiaId), { topicos: arrayUnion(dados.topico) }));
  },

  definirPrioridade(id: string, p: Prioridade) {
    const atual = estado.erros.find((e) => e.id === id);
    if (!atual || atual.prioridade === p) return;
    const h: HistoricoItem = { em: agora(), campo: 'prioridade', de: atual.prioridade, para: p };
    otimista({ erros: estado.erros.map((e) => (e.id === id ? { ...e, prioridade: p, atualizadoEm: Date.now(), historico: [...e.historico, h] } : e)) });
    enviar(updateDoc(refErro(id), { prioridade: p, atualizadoEm: Date.now(), historico: arrayUnion(h) }));
  },

  definirOrigem(id: string, o: Origem | null) {
    const atual = estado.erros.find((e) => e.id === id);
    if (!atual || atual.origem === o) return;
    const h: HistoricoItem = { em: agora(), campo: 'origem', de: atual.origem, para: o };
    otimista({ erros: estado.erros.map((e) => (e.id === id ? { ...e, origem: o, atualizadoEm: Date.now(), historico: [...e.historico, h] } : e)) });
    enviar(updateDoc(refErro(id), { origem: o, atualizadoEm: Date.now(), historico: arrayUnion(h) }));
  },

  registrarRevisao(id: string, p: Prioridade) {
    const atual = estado.erros.find((e) => e.id === id);
    if (!atual) return;
    const hist: HistoricoItem[] = [{ em: agora(), campo: 'revisao', de: atual.prioridade, para: p }];
    if (atual.prioridade !== p) hist.push({ em: agora(), campo: 'prioridade', de: atual.prioridade, para: p });
    const quando = agora();
    otimista({ erros: estado.erros.map((e) => (e.id === id ? { ...e, prioridade: p, revisoes: e.revisoes + 1, ultimaRevisao: quando, atualizadoEm: Date.now(), historico: [...e.historico, ...hist] } : e)) });
    enviar(updateDoc(refErro(id), { prioridade: p, revisoes: increment(1), ultimaRevisao: quando, atualizadoEm: Date.now(), historico: arrayUnion(...hist) }));
  },

  excluirErro(id: string) {
    otimista({ erros: estado.erros.filter((e) => e.id !== id) });
    enviar(deleteDoc(refErro(id)));
  },

  /** Retorna a matéria existente (mesmo nome) ou cria uma nova. */
  adicionarMateria(nome: string): Materia {
    const limpo = nome.trim().replace(/\s+/g, ' ');
    const existente = estado.materias.find((m) => normalizar(m.nome) === normalizar(limpo));
    if (existente) return existente;
    const m: Materia = { id: 'm-' + novoId(), nome: limpo, topicos: [] };
    otimista({ materias: [...estado.materias, m] });
    enviar(setDoc(refMateria(m.id), { nome: m.nome, topicos: [], ordem: Date.now() }));
    return m;
  },

  renomearMateria(id: string, nome: string): string | null {
    const limpo = nome.trim().replace(/\s+/g, ' ');
    if (!limpo) return 'Digite um nome para a matéria.';
    if (estado.materias.some((m) => m.id !== id && normalizar(m.nome) === normalizar(limpo))) return 'Já existe uma matéria com esse nome.';
    otimista({ materias: estado.materias.map((m) => (m.id === id ? { ...m, nome: limpo } : m)) });
    enviar(updateDoc(refMateria(id), { nome: limpo }));
    return null;
  },

  excluirMateria(id: string) {
    const removidos = estado.erros.filter((e) => e.materiaId === id).map((e) => e.id);
    otimista({ materias: estado.materias.filter((m) => m.id !== id), erros: estado.erros.filter((e) => e.materiaId !== id) });
    enviar(emLotes([(b) => b.delete(refMateria(id)), ...removidos.map((r) => (b: WriteBatch) => b.delete(refErro(r)))]));
  },

  adicionarTopico(materiaId: string, topico: string): string | null {
    const limpo = topico.trim().replace(/\s+/g, ' ');
    if (!limpo) return 'Digite um nome para o tópico.';
    const m = estado.materias.find((x) => x.id === materiaId);
    if (!m) return 'Matéria não encontrada.';
    if (m.topicos.some((t) => normalizar(t) === normalizar(limpo))) return 'Esse tópico já existe nesta matéria.';
    otimista({ materias: estado.materias.map((x) => (x.id === materiaId ? { ...x, topicos: [...x.topicos, limpo] } : x)) });
    enviar(updateDoc(refMateria(materiaId), { topicos: arrayUnion(limpo) }));
    return null;
  },

  renomearTopico(materiaId: string, antigo: string, novo: string): string | null {
    const limpo = novo.trim().replace(/\s+/g, ' ');
    if (!limpo) return 'Digite um nome para o tópico.';
    const m = estado.materias.find((x) => x.id === materiaId);
    if (!m) return 'Matéria não encontrada.';
    if (m.topicos.some((t) => t !== antigo && normalizar(t) === normalizar(limpo))) return 'Esse tópico já existe nesta matéria.';
    const afetados = estado.erros.filter((e) => e.materiaId === materiaId && e.topico === antigo).map((e) => e.id);
    const topicos = m.topicos.includes(antigo) ? m.topicos.map((t) => (t === antigo ? limpo : t)) : [...m.topicos, limpo];
    otimista({
      materias: estado.materias.map((x) => (x.id === materiaId ? { ...x, topicos } : x)),
      erros: estado.erros.map((e) => (afetados.includes(e.id) ? { ...e, topico: limpo, atualizadoEm: Date.now() } : e)),
    });
    enviar(emLotes([
      (b) => b.update(refMateria(materiaId), { topicos }),
      ...afetados.map((a) => (b: WriteBatch) => b.update(refErro(a), { topico: limpo, atualizadoEm: Date.now() })),
    ]));
    return null;
  },

  excluirTopico(materiaId: string, topico: string) {
    const removidos = estado.erros.filter((e) => e.materiaId === materiaId && e.topico === topico).map((e) => e.id);
    otimista({
      materias: estado.materias.map((x) => (x.id === materiaId ? { ...x, topicos: x.topicos.filter((t) => t !== topico) } : x)),
      erros: estado.erros.filter((e) => !removidos.includes(e.id)),
    });
    enviar(emLotes([
      (b) => b.update(refMateria(materiaId), { topicos: arrayRemove(topico) }),
      ...removidos.map((r) => (b: WriteBatch) => b.delete(refErro(r))),
    ]));
  },

  /** Substitui todo o conteúdo (importação de backup ou "apagar tudo"). */
  substituirTudo(data: AppData) {
    const idsErros = new Set(data.erros.map((e) => e.id));
    const idsMaterias = new Set(data.materias.map((m) => m.id));
    const ops: ((b: WriteBatch) => void)[] = [
      ...estado.erros.filter((e) => !idsErros.has(e.id)).map((e) => (b: WriteBatch) => b.delete(refErro(e.id))),
      ...estado.materias.filter((m) => !idsMaterias.has(m.id)).map((m) => (b: WriteBatch) => b.delete(refMateria(m.id))),
      ...data.materias.map((m, i) => (b: WriteBatch) => b.set(refMateria(m.id), { nome: m.nome, topicos: m.topicos, ordem: i })),
      ...data.erros.map((e) => (b: WriteBatch) => b.set(refErro(e.id), e)),
    ];
    otimista({ erros: data.erros, materias: data.materias });
    enviar(emLotes(ops));
  },
};
