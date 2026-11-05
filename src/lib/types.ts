export type Prioridade = 'alta' | 'media' | 'superado';
export type Origem = 'desconhecimento' | 'confusao' | 'esquecimento' | 'interpretacao';

export interface HistoricoItem {
  /** ISO timestamp */
  em: string;
  campo: 'prioridade' | 'origem' | 'criado' | 'revisao' | 'edicao';
  de?: string | null;
  para?: string | null;
}

export interface Erro {
  id: string;
  materiaId: string;
  topico: string;
  descricao: string;
  correcao: string;
  comoEvitar: string;
  prioridade: Prioridade;
  /** null = "Não classificado" (registros antigos) */
  origem: Origem | null;
  referencia: string;
  /** AAAA-MM-DD (data local do registro) */
  criadoEm: string;
  /** epoch ms da última alteração */
  atualizadoEm: number;
  revisoes: number;
  ultimaRevisao?: string;
  historico: HistoricoItem[];
}

export interface Materia {
  id: string;
  nome: string;
  topicos: string[];
}

export interface AppData {
  erros: Erro[];
  materias: Materia[];
}

export type SyncStatus = 'conectando' | 'sincronizado' | 'enviando' | 'local' | 'offline' | 'erro';
