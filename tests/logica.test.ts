import { describe, it, expect } from 'vitest';
import { lerBackup, mesclar, gerarBackup } from '../src/lib/backup';
import { filtrar, agrupar, FILTROS_VAZIOS } from '../src/lib/filtros';
import { porOrigem, resumo, serieEvolucao, dataSuperacao } from '../src/lib/stats';
import { formatarData } from '../src/lib/utils';
import type { Erro } from '../src/lib/types';

const base = (p: Partial<Erro>): Erro => ({
  id: 'x', materiaId: 'm1', topico: 'Atos', descricao: 'd', correcao: 'c', comoEvitar: '', prioridade: 'alta',
  origem: 'confusao', referencia: '', criadoEm: '2026-10-01', atualizadoEm: 1, revisoes: 0, historico: [], ...p,
});
const mats = [{ id: 'm1', nome: 'Direito Administrativo', topicos: ['Atos'] }, { id: 'm2', nome: 'Português', topicos: [] }];

describe('backup', () => {
  it('lê backup antigo sem origem como Não classificado e por nome de matéria', () => {
    const r = lerBackup({ erros: [{ materia: 'Direito Penal', topico: 'Dolo', descricao: 'confundi', prioridade: 'media', criadoEm: '05/10/2026' }] });
    expect(r.data.erros[0].origem).toBeNull();
    expect(r.data.erros[0].criadoEm).toBe('2026-10-05');
    expect(r.data.materias[0].nome).toBe('Direito Penal');
    expect(r.avisos.some((a) => a.includes('Não classificado'))).toBe(true);
  });
  it('rejeita JSON sem lista de erros', () => {
    expect(() => lerBackup({ foo: 1 })).toThrow();
    expect(() => lerBackup(null)).toThrow();
  });
  it('ignora registros incompletos e prioridade inválida vira alta', () => {
    const r = lerBackup({ materias: mats, erros: [{ materiaId: 'm1', topico: 'Atos', descricao: 'ok', prioridade: 'xx', origem: 'esquecimento' }, { materiaId: 'm1' }] });
    expect(r.data.erros).toHaveLength(1);
    expect(r.ignorados).toBe(1);
    expect(r.data.erros[0].prioridade).toBe('alta');
    expect(r.data.erros[0].origem).toBe('esquecimento');
  });
  it('ida e volta preserva origem e histórico', () => {
    const e = base({ id: 'a1', historico: [{ em: '2026-10-02T10:00:00Z', campo: 'prioridade', de: 'alta', para: 'superado' }], prioridade: 'superado' });
    const r = lerBackup(JSON.parse(JSON.stringify(gerarBackup({ erros: [e], materias: mats }))));
    expect(r.data.erros[0]).toMatchObject({ id: 'a1', origem: 'confusao', prioridade: 'superado' });
    expect(r.data.erros[0].historico).toHaveLength(1);
  });
  it('mesclar não duplica matérias de mesmo nome', () => {
    const novo = { materias: [{ id: 'zz', nome: 'direito administrativo', topicos: ['Licitações'] }], erros: [base({ id: 'n1', materiaId: 'zz', topico: 'Licitações' })] };
    const m = mesclar({ erros: [base({ id: 'a' })], materias: mats }, novo);
    expect(m.materias).toHaveLength(2);
    expect(m.erros.find((e) => e.id === 'n1')!.materiaId).toBe('m1');
    expect(m.materias[0].topicos).toContain('Licitações');
  });
});

describe('filtros', () => {
  const erros = [
    base({ id: '1', descricao: 'Anulação é ex tunc', origem: 'confusao', criadoEm: '2026-10-01' }),
    base({ id: '2', materiaId: 'm2', topico: 'Crase', prioridade: 'superado', origem: null, correcao: 'Crase antes de palavra feminina', criadoEm: '2026-10-10' }),
    base({ id: '3', prioridade: 'media', origem: 'interpretacao', criadoEm: '2026-10-20' }),
  ];
  it('combina filtros', () => {
    expect(filtrar(erros, { ...FILTROS_VAZIOS, materiaId: 'm1', prioridades: ['alta', 'media'] }).map((e) => e.id)).toEqual(['1', '3']);
    expect(filtrar(erros, { ...FILTROS_VAZIOS, origem: 'nenhuma' }).map((e) => e.id)).toEqual(['2']);
    expect(filtrar(erros, { ...FILTROS_VAZIOS, busca: 'anulacao' }).map((e) => e.id)).toEqual(['1']);
    expect(filtrar(erros, { ...FILTROS_VAZIOS, busca: 'feminina' }).map((e) => e.id)).toEqual(['2']);
    expect(filtrar(erros, { ...FILTROS_VAZIOS, de: '2026-10-05', ate: '2026-10-15' }).map((e) => e.id)).toEqual(['2']);
  });
  it('agrupa por matéria e tópico', () => {
    const g = agrupar(erros, mats);
    expect(g.map((x) => x.materia.nome)).toEqual(['Direito Administrativo', 'Português']);
    expect(g[0].topicos[0].erros).toHaveLength(2);
  });
});

describe('estatísticas', () => {
  const erros = [
    base({ id: '1', origem: 'confusao' }),
    base({ id: '2', origem: 'confusao', prioridade: 'superado', historico: [{ em: '2026-10-05T12:00:00', campo: 'prioridade', de: 'alta', para: 'superado' }] }),
    base({ id: '3', origem: 'esquecimento', prioridade: 'media', criadoEm: '2026-10-03' }),
    base({ id: '4', origem: null }),
  ];
  it('resumo e percentual', () => {
    expect(resumo(erros, mats)).toMatchObject({ total: 4, alta: 2, media: 1, superado: 1, pctSuperado: 25 });
  });
  it('origem mais frequente ignora não classificados', () => {
    const o = porOrigem(erros);
    expect(o.maisFrequente).toBe('confusao');
    expect(o.linhas.find((l) => l.origem === 'confusao')!.pct).toBe(50);
    expect(o.linhas.find((l) => l.origem === null)!.total).toBe(1);
  });
  it('série acumulada', () => {
    expect(dataSuperacao(erros[1])).toBe('2026-10-05');
    expect(serieEvolucao(erros)).toEqual([
      { dia: '2026-10-01', registrados: 3, superados: 0 },
      { dia: '2026-10-03', registrados: 4, superados: 0 },
      { dia: '2026-10-05', registrados: 4, superados: 1 },
    ]);
  });
  it('formata datas em DD/MM/AAAA', () => {
    expect(formatarData('2026-11-04')).toBe('04/11/2026');
  });
});
