import type { Erro, Materia, Origem } from './types';
import { diaDe, pct } from './utils';

export function resumo(erros: Erro[], materias: Materia[]) {
  const alta = erros.filter((e) => e.prioridade === 'alta').length;
  const media = erros.filter((e) => e.prioridade === 'media').length;
  const superado = erros.filter((e) => e.prioridade === 'superado').length;
  const materiasComErro = new Set(erros.map((e) => e.materiaId)).size;
  return { total: erros.length, alta, media, superado, pctSuperado: pct(superado, erros.length), materias: materias.length, materiasComErro };
}

export function porMateria(erros: Erro[], materias: Materia[]) {
  return materias
    .map((m) => {
      const lista = erros.filter((e) => e.materiaId === m.id);
      const alta = lista.filter((e) => e.prioridade === 'alta').length;
      const media = lista.filter((e) => e.prioridade === 'media').length;
      const superado = lista.filter((e) => e.prioridade === 'superado').length;
      return { materia: m, total: lista.length, alta, media, superado, pendentes: alta + media, pctSuperado: pct(superado, lista.length) };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function porTopico(erros: Erro[], materias: Materia[], somentePendentes = false) {
  const mapa = new Map<string, { materia: Materia | undefined; topico: string; total: number; alta: number; media: number }>();
  for (const e of erros) {
    if (somentePendentes && e.prioridade === 'superado') continue;
    const chave = e.materiaId + '|' + e.topico;
    const atual = mapa.get(chave) ?? { materia: materias.find((m) => m.id === e.materiaId), topico: e.topico, total: 0, alta: 0, media: 0 };
    atual.total++;
    if (e.prioridade === 'alta') atual.alta++;
    if (e.prioridade === 'media') atual.media++;
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) => b.alta * 2 + b.media - (a.alta * 2 + a.media) || b.total - a.total);
}

export function porOrigem(erros: Erro[]) {
  const chaves: (Origem | null)[] = ['desconhecimento', 'confusao', 'esquecimento', 'interpretacao', null];
  const linhas = chaves.map((o) => {
    const lista = erros.filter((e) => e.origem === o);
    return { origem: o, total: lista.length, pct: pct(lista.length, erros.length), pendentes: lista.filter((e) => e.prioridade !== 'superado').length };
  });
  const classificadas = linhas.filter((l) => l.origem !== null && l.total > 0).sort((a, b) => b.total - a.total);
  const maisFrequente = classificadas[0] && (classificadas.length === 1 || classificadas[0].total > classificadas[1].total) ? classificadas[0].origem : null;
  const empatadas = classificadas.length > 1 && classificadas[0].total === classificadas[1].total
    ? classificadas.filter((c) => c.total === classificadas[0].total).map((c) => c.origem)
    : [];
  return { linhas, maisFrequente, empatadas };
}

/** Data (AAAA-MM-DD) em que o erro foi marcado como superado pela última vez. */
export function dataSuperacao(e: Erro): string | null {
  if (e.prioridade !== 'superado') return null;
  for (let i = e.historico.length - 1; i >= 0; i--) {
    const h = e.historico[i];
    if ((h.campo === 'prioridade' || h.campo === 'criado') && h.para === 'superado') return diaDe(h.em);
  }
  return diaDe(new Date(e.atualizadoEm).toISOString());
}

/**
 * Série acumulada por dia: quantos erros estavam registrados e quantos
 * estavam superados (estado atual) em cada data com movimento.
 */
export function serieEvolucao(erros: Erro[]) {
  const dias = new Set<string>();
  const sup = erros.map((e) => ({ criado: e.criadoEm, superado: dataSuperacao(e) }));
  sup.forEach((s) => { dias.add(s.criado); if (s.superado) dias.add(s.superado); });
  const ordenados = [...dias].sort();
  return ordenados.map((d) => ({
    dia: d,
    registrados: sup.filter((s) => s.criado <= d).length,
    superados: sup.filter((s) => s.superado && s.superado <= d && s.criado <= d).length,
  }));
}

/** Superados nos últimos N dias (para o indicador de evolução). */
export function superadosRecentes(erros: Erro[], dias = 7) {
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  const lim = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`;
  return erros.filter((e) => { const d = dataSuperacao(e); return d !== null && d > lim; }).length;
}
