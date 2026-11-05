import type { Materia, Origem, Prioridade } from './types';

export const PRIORIDADES: { id: Prioridade; nome: string; curto: string; desc: string; cor: string; fundo: string }[] = [
  {
    id: 'alta', nome: 'Prioridade alta', curto: 'Alta',
    desc: 'Erros persistentes, conceitos que ainda não domino ou questões que continuo errando mesmo depois de estudar.',
    cor: 'var(--alta)', fundo: 'var(--alta-bg)',
  },
  {
    id: 'media', nome: 'Prioridade média', curto: 'Média',
    desc: 'Erros que já compreendi, mas merecem atenção para não se repetirem.',
    cor: 'var(--media)', fundo: 'var(--media-bg)',
  },
  {
    id: 'superado', nome: 'Superado', curto: 'Superado',
    desc: 'Erros que já corrigi, compreendi e demonstrei domínio com novas questões.',
    cor: 'var(--ok)', fundo: 'var(--ok-bg)',
  },
];

export const PRIO = Object.fromEntries(PRIORIDADES.map((p) => [p.id, p])) as Record<Prioridade, (typeof PRIORIDADES)[number]>;

export const ORIGENS: { id: Origem; nome: string; desc: string; exemplo: string; cor: string; fundo: string }[] = [
  {
    id: 'desconhecimento', nome: 'Desconhecimento',
    desc: 'Nunca havia estudado o conceito, termo ou conteúdo.',
    exemplo: 'Nunca tinha ouvido falar em modularidade.',
    cor: 'var(--o-desc)', fundo: 'var(--o-desc-bg)',
  },
  {
    id: 'confusao', nome: 'Confusão entre conceitos',
    desc: 'Conhecia os conceitos, mas confundi um com o outro.',
    exemplo: 'Anulação x revogação.',
    cor: 'var(--o-conf)', fundo: 'var(--o-conf-bg)',
  },
  {
    id: 'esquecimento', nome: 'Esquecimento',
    desc: 'Já havia estudado, mas não lembrei no momento da questão.',
    exemplo: 'Um prazo ou uma exceção legal.',
    cor: 'var(--o-esq)', fundo: 'var(--o-esq-bg)',
  },
  {
    id: 'interpretacao', nome: 'Erro de interpretação',
    desc: 'Conhecia o conteúdo, mas interpretei mal o enunciado ou as alternativas.',
    exemplo: 'Não perceber que pedia a alternativa incorreta.',
    cor: 'var(--o-int)', fundo: 'var(--o-int-bg)',
  },
];

export const ORIG = Object.fromEntries(ORIGENS.map((o) => [o.id, o])) as Record<Origem, (typeof ORIGENS)[number]>;
export const SEM_ORIGEM = { nome: 'Não classificado', cor: 'var(--muted)', fundo: 'var(--line)' };

export function origemInfo(o: Origem | null) {
  return o ? ORIG[o] : SEM_ORIGEM;
}

export const MATERIAS_INICIAIS: Materia[] = [
  { id: 'm-dconst', nome: 'Direito Constitucional', topicos: ['Direitos fundamentais', 'Controle de constitucionalidade', 'Organização do Estado', 'Poder Legislativo'] },
  { id: 'm-dadm', nome: 'Direito Administrativo', topicos: ['Atos administrativos', 'Poderes administrativos', 'Licitações', 'Responsabilidade civil do Estado'] },
  { id: 'm-dpenal', nome: 'Direito Penal', topicos: [] },
  { id: 'm-dpp', nome: 'Direito Processual Penal', topicos: [] },
  { id: 'm-port', nome: 'Língua Portuguesa', topicos: ['Concordância verbal'] },
  { id: 'm-rl', nome: 'Raciocínio Lógico', topicos: [] },
];

/** Paleta para distinguir matérias nos gráficos (fixa por ordem). */
export const CORES_MATERIA = ['#8a4fd6', '#e0619f', '#3b82c4', '#1f9e9a', '#e0812f', '#b44ad6', '#5d6fd8', '#c2577a', '#4f9a4a', '#a0703c'];
