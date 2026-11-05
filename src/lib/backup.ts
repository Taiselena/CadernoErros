import type { AppData, Erro, HistoricoItem, Materia, Origem, Prioridade } from './types';
import { normalizar, novoId, hojeISO } from './utils';

export const VERSAO_BACKUP = 2;

export function gerarBackup(data: AppData) {
  return {
    app: 'caderno-de-erros-tais-elena',
    versao: VERSAO_BACKUP,
    exportadoEm: new Date().toISOString(),
    materias: data.materias,
    erros: data.erros,
  };
}

const PRIOS: Prioridade[] = ['alta', 'media', 'superado'];
const ORIGS: Origem[] = ['desconhecimento', 'confusao', 'esquecimento', 'interpretacao'];

function txt(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}

/** Aceita AAAA-MM-DD, DD/MM/AAAA ou ISO completo. */
function dataValida(v: unknown): string | null {
  const s = txt(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (s) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return null;
}

export interface ResultadoImportacao {
  data: AppData;
  avisos: string[];
  ignorados: number;
}

/**
 * Valida e normaliza um backup. Lança Error com mensagem amigável quando o
 * arquivo inteiro é inválido; registros individuais inválidos são ignorados
 * e contados. Registros sem origem ficam como "Não classificado" (null).
 */
export function lerBackup(bruto: unknown): ResultadoImportacao {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto) && bruto.length === 0) {
    throw new Error('O arquivo não contém um backup do Caderno de Erros.');
  }
  const obj = (Array.isArray(bruto) ? { erros: bruto } : bruto) as Record<string, unknown>;
  const errosBrutos = obj.erros;
  if (!Array.isArray(errosBrutos)) throw new Error('O arquivo não tem a lista "erros". Escolha um backup exportado por este caderno.');

  const avisos: string[] = [];
  const materias: Materia[] = [];
  const porNome = new Map<string, Materia>();
  const porId = new Map<string, Materia>();

  function garantirMateria(nome: string, id?: string): Materia {
    const chave = normalizar(nome);
    let m = porNome.get(chave);
    if (!m) {
      m = { id: id && !porId.has(id) ? id : 'm-' + novoId(), nome, topicos: [] };
      materias.push(m);
      porNome.set(chave, m);
      porId.set(m.id, m);
    }
    return m;
  }

  if (Array.isArray(obj.materias)) {
    for (const mb of obj.materias as unknown[]) {
      if (!mb || typeof mb !== 'object') continue;
      const r = mb as Record<string, unknown>;
      const nome = txt(r.nome);
      if (!nome) continue;
      const m = garantirMateria(nome, txt(r.id) || undefined);
      if (txt(r.id)) porId.set(txt(r.id), m);
      if (Array.isArray(r.topicos)) {
        for (const t of r.topicos) {
          const tt = txt(t);
          if (tt && !m.topicos.some((x) => normalizar(x) === normalizar(tt))) m.topicos.push(tt);
        }
      }
    }
  }

  const erros: Erro[] = [];
  const ids = new Set<string>();
  let ignorados = 0;
  let semOrigem = 0;

  for (const eb of errosBrutos as unknown[]) {
    if (!eb || typeof eb !== 'object') { ignorados++; continue; }
    const r = eb as Record<string, unknown>;
    const descricao = txt(r.descricao);
    const topico = txt(r.topico);
    let materia: Materia | undefined = porId.get(txt(r.materiaId));
    if (!materia && txt(r.materia)) materia = garantirMateria(txt(r.materia));
    if (!descricao || !topico || !materia) { ignorados++; continue; }

    if (!materia.topicos.some((x) => normalizar(x) === normalizar(topico))) materia.topicos.push(topico);

    const prio = PRIOS.includes(r.prioridade as Prioridade) ? (r.prioridade as Prioridade) : 'alta';
    const origemBruta = r.origem;
    const origem = ORIGS.includes(origemBruta as Origem) ? (origemBruta as Origem) : null;
    if (!origem) semOrigem++;

    let id = txt(r.id).replace(/[^A-Za-z0-9_-]/g, '');
    if (!id || ids.has(id)) id = novoId();
    ids.add(id);

    const historico: HistoricoItem[] = Array.isArray(r.historico)
      ? (r.historico as unknown[]).filter((h): h is HistoricoItem => !!h && typeof h === 'object' && typeof (h as HistoricoItem).em === 'string' && typeof (h as HistoricoItem).campo === 'string')
      : [];

    erros.push({
      id,
      materiaId: materia.id,
      topico,
      descricao,
      correcao: txt(r.correcao),
      comoEvitar: txt(r.comoEvitar),
      prioridade: prio,
      origem,
      referencia: txt(r.referencia),
      criadoEm: dataValida(r.criadoEm) ?? hojeISO(),
      atualizadoEm: typeof r.atualizadoEm === 'number' ? r.atualizadoEm : Date.now(),
      revisoes: typeof r.revisoes === 'number' && r.revisoes >= 0 ? Math.floor(r.revisoes) : 0,
      ultimaRevisao: txt(r.ultimaRevisao) || undefined,
      historico,
    });
  }

  if (erros.length === 0 && errosBrutos.length > 0) {
    throw new Error('Nenhum registro do arquivo pôde ser lido. Cada erro precisa de matéria, tópico e descrição.');
  }
  if (ignorados) avisos.push(`${ignorados} registro(s) incompleto(s) foram ignorados.`);
  if (semOrigem) avisos.push(`${semOrigem} registro(s) sem origem ficaram como "Não classificado".`);
  return { data: { erros, materias }, avisos, ignorados };
}

/** Une dados importados aos atuais, sem duplicar matérias (comparação pelo nome). */
export function mesclar(atual: AppData, novo: AppData): AppData {
  const materias = atual.materias.map((m) => ({ ...m, topicos: [...m.topicos] }));
  const mapaId = new Map<string, string>();
  for (const m of novo.materias) {
    const existente = materias.find((x) => normalizar(x.nome) === normalizar(m.nome));
    if (existente) {
      mapaId.set(m.id, existente.id);
      for (const t of m.topicos) if (!existente.topicos.some((x) => normalizar(x) === normalizar(t))) existente.topicos.push(t);
    } else {
      const id = materias.some((x) => x.id === m.id) ? 'm-' + novoId() : m.id;
      mapaId.set(m.id, id);
      materias.push({ ...m, id, topicos: [...m.topicos] });
    }
  }
  const ids = new Set(atual.erros.map((e) => e.id));
  const erros = [...atual.erros];
  for (const e of novo.erros) {
    const materiaId = mapaId.get(e.materiaId) ?? e.materiaId;
    const idx = erros.findIndex((x) => x.id === e.id);
    if (idx >= 0) {
      // mesmo registro: fica a versão alterada mais recentemente
      if (e.atualizadoEm > erros[idx].atualizadoEm) erros[idx] = { ...e, materiaId };
    } else {
      erros.push({ ...e, id: ids.has(e.id) ? novoId() : e.id, materiaId });
    }
  }
  return { materias, erros };
}
