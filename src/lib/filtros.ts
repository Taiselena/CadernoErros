import type { Erro, Materia, Origem, Prioridade } from './types';
import { normalizar } from './utils';

export interface Filtros {
  busca: string;
  materiaId: string;
  topico: string;
  prioridades: Prioridade[];
  /** '' = todas; 'nenhuma' = Não classificado */
  origem: '' | Origem | 'nenhuma';
  de: string;
  ate: string;
}

export const FILTROS_VAZIOS: Filtros = { busca: '', materiaId: '', topico: '', prioridades: [], origem: '', de: '', ate: '' };

/** Filtro pedido por outra tela antes de navegar para "Meus erros". */
let pendente: Partial<Filtros> | null = null;
export function abrirMeusErrosCom(f: Partial<Filtros>) {
  pendente = f;
  if (location.hash === '#erros') window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = 'erros';
  window.scrollTo({ top: 0 });
}
export function consumirFiltroPendente(): Filtros | null {
  const f = pendente; pendente = null;
  return f ? { ...FILTROS_VAZIOS, ...f } : null;
}

export function filtrar(erros: Erro[], f: Filtros): Erro[] {
  const termos = normalizar(f.busca).split(/\s+/).filter(Boolean);
  return erros.filter((e) => {
    if (f.materiaId && e.materiaId !== f.materiaId) return false;
    if (f.topico && e.topico !== f.topico) return false;
    if (f.prioridades.length && !f.prioridades.includes(e.prioridade)) return false;
    if (f.origem === 'nenhuma' && e.origem !== null) return false;
    if (f.origem && f.origem !== 'nenhuma' && e.origem !== f.origem) return false;
    if (f.de && e.criadoEm < f.de) return false;
    if (f.ate && e.criadoEm > f.ate) return false;
    if (termos.length) {
      const texto = normalizar([e.descricao, e.correcao, e.comoEvitar, e.topico, e.referencia].join(' '));
      if (!termos.every((t) => texto.includes(t))) return false;
    }
    return true;
  });
}

export function agrupar(erros: Erro[], materias: Materia[]) {
  const grupos: { materia: Materia; total: number; topicos: { topico: string; erros: Erro[] }[] }[] = [];
  const ordemMateria = new Map(materias.map((m, i) => [m.id, i]));
  const porMateria = new Map<string, Erro[]>();
  for (const e of erros) porMateria.set(e.materiaId, [...(porMateria.get(e.materiaId) ?? []), e]);
  for (const [mid, lista] of porMateria) {
    const materia = materias.find((m) => m.id === mid) ?? { id: mid, nome: 'Matéria removida', topicos: [] };
    const ordemTopico = new Map(materia.topicos.map((t, i) => [t, i]));
    const porTopico = new Map<string, Erro[]>();
    for (const e of lista) porTopico.set(e.topico, [...(porTopico.get(e.topico) ?? []), e]);
    const topicos = [...porTopico.entries()]
      .map(([topico, es]) => ({ topico, erros: es.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm) || b.atualizadoEm - a.atualizadoEm) }))
      .sort((a, b) => (ordemTopico.get(a.topico) ?? 999) - (ordemTopico.get(b.topico) ?? 999) || a.topico.localeCompare(b.topico, 'pt-BR'));
    grupos.push({ materia, total: lista.length, topicos });
  }
  return grupos.sort((a, b) => (ordemMateria.get(a.materia.id) ?? 999) - (ordemMateria.get(b.materia.id) ?? 999));
}
