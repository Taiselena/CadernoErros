import { useMemo, useState } from 'react';
import { BookMarked, CheckCircle2, Eye, Flame, Lightbulb, PartyPopper, PlayCircle, Repeat2, Target, Trophy } from 'lucide-react';
import type { Erro, Prioridade } from '../lib/types';
import { acoes, getEstado, useEstado } from '../lib/store';
import { porMateria, porTopico } from '../lib/stats';
import { PRIO } from '../lib/constants';
import { abrirMeusErrosCom } from '../lib/filtros';
import { cx, formatarData, plural } from '../lib/utils';
import { nomeMateria } from '../components/ErroCard';
import { BarrasEmpilhadas } from '../components/Graficos';
import { Botao, CabecalhoPagina, Modal, SeloOrigem, SeloPrioridade, Vazio, notificar } from '../components/ui';

function Revisao({ fila, onFechar }: { fila: string[]; onFechar: () => void }) {
  const { materias } = useEstado();
  const [indice, setIndice] = useState(0);
  const [revelada, setRevelada] = useState(false);
  const [feitos, setFeitos] = useState<Prioridade[]>([]);
  const erro = getEstado().erros.find((e) => e.id === fila[indice]);
  const fim = indice >= fila.length || !erro;

  function decidir(p: Prioridade) {
    if (!erro) return;
    acoes.registrarRevisao(erro.id, p);
    notificar(p === 'superado' ? 'Superado! O histórico continua guardado.' : p === 'media' ? 'Movido para prioridade média.' : 'Mantido em prioridade alta.');
    setFeitos((f) => [...f, p]);
    setRevelada(false);
    setIndice((i) => i + 1);
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={fim ? 'Revisão concluída' : `Revisar erro ${fila.length > 1 ? `· ${indice + 1} de ${fila.length}` : ''}`} largura="max-w-2xl">
      {fim ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--ok-bg)] text-ok"><PartyPopper size={30} /></span>
          <p className="font-display text-xl font-bold text-plum">{plural(feitos.length, 'erro revisado', 'erros revisados')}</p>
          <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
            {(['superado', 'media', 'alta'] as Prioridade[]).map((p) => {
              const n = feitos.filter((x) => x === p).length;
              return n ? <span key={p} className="num rounded-full px-3 py-1" style={{ background: PRIO[p].fundo, color: PRIO[p].cor }}>{n} {p === 'superado' ? (n === 1 ? 'superado' : 'superados') : `em ${PRIO[p].curto.toLowerCase()}`}</span> : null;
            })}
          </div>
          <Botao variante="primario" onClick={onFechar}>Concluir</Botao>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fila.length > 1 && (
            <div className="h-1.5 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full bg-violet transition-all" style={{ width: `${(indice / fila.length) * 100}%` }} /></div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <SeloPrioridade p={erro.prioridade} />
            <SeloOrigem o={erro.origem} />
            <span className="num ml-auto text-xs text-muted">{formatarData(erro.criadoEm)}</span>
          </div>
          <p className="text-sm text-muted"><strong className="text-plum">{nomeMateria(materias, erro.materiaId)}</strong> · {erro.topico}</p>
          <div className="rounded-2xl bg-page p-4">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-alta">O erro</p>
            <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-ink">{erro.descricao}</p>
            {erro.referencia && <p className="mt-2 flex items-center gap-1.5 break-all text-xs text-muted"><BookMarked size={13} /> {erro.referencia}</p>}
          </div>
          {!revelada ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line px-4 py-6 text-center">
              <p className="text-sm text-muted">Antes de revelar, tente lembrar: qual é o entendimento correto?</p>
              <Botao variante="primario" className="px-6 py-3 tracking-wide" onClick={() => setRevelada(true)}><Eye size={18} /> REVELAR CORREÇÃO</Botao>
            </div>
          ) : (
            <div className="anim-surgir flex flex-col gap-3">
              <div className="rounded-2xl bg-[var(--ok-bg)] p-4">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ok">Correção</p>
                <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-ink">{erro.correcao}</p>
              </div>
              {erro.comoEvitar && (
                <div className="rounded-2xl bg-[var(--media-bg)] p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#a26f00]"><Lightbulb size={14} /> Como evitar</p>
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">{erro.comoEvitar}</p>
                </div>
              )}
              <p className="mt-1 text-center text-sm font-semibold text-plum">Como você se saiu nesta revisão?</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => decidir('alta')} className="flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-sm font-bold transition hover:brightness-95" style={{ borderColor: 'var(--alta)', background: 'var(--alta-bg)', color: 'var(--alta)' }}>
                  <Flame size={20} /> Manter prioridade alta
                </button>
                <button type="button" onClick={() => decidir('media')} className="flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-sm font-bold transition hover:brightness-95" style={{ borderColor: 'var(--media)', background: 'var(--media-bg)', color: '#a26f00' }}>
                  <Target size={20} /> Alterar para média
                </button>
                <button type="button" onClick={() => decidir('superado')} className="flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-sm font-bold transition hover:brightness-95" style={{ borderColor: 'var(--ok)', background: 'var(--ok-bg)', color: 'var(--ok)' }}>
                  <Trophy size={20} /> Marcar como superado
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ItemCiclo({ erro, onRevisar }: { erro: Erro; onRevisar: () => void }) {
  const { materias } = useEstado();
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-bold text-plum">{nomeMateria(materias, erro.materiaId)}</span> · <span className="font-semibold">{erro.topico}</span>
        {erro.revisoes > 0 && <span className="num ml-auto rounded-full bg-page px-2 py-0.5 font-semibold">{erro.revisoes}× revisado</span>}
      </div>
      <p className="line-clamp-2 text-[14.5px] font-medium leading-relaxed text-ink">{erro.descricao}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SeloOrigem o={erro.origem} />
        <button type="button" onClick={onRevisar} className="inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2 text-xs font-bold tracking-wide text-white transition hover:brightness-110">
          <Repeat2 size={15} /> REVISAR ERRO
        </button>
      </div>
    </div>
  );
}

export function SegundoCiclo() {
  const { erros, materias } = useEstado();
  const [fila, setFila] = useState<string[] | null>(null);
  const alta = useMemo(() => erros.filter((e) => e.prioridade === 'alta').sort((a, b) => a.revisoes - b.revisoes || a.criadoEm.localeCompare(b.criadoEm)), [erros]);
  const media = useMemo(() => erros.filter((e) => e.prioridade === 'media').sort((a, b) => a.revisoes - b.revisoes || a.criadoEm.localeCompare(b.criadoEm)), [erros]);
  const mats = useMemo(() => porMateria(erros, materias).filter((m) => m.pendentes > 0).sort((a, b) => b.alta * 2 + b.media - (a.alta * 2 + a.media)).slice(0, 6), [erros, materias]);
  const tops = useMemo(() => porTopico(erros, materias, true).slice(0, 8), [erros, materias]);
  const pendentes = alta.length + media.length;

  return (
    <div>
      <CabecalhoPagina
        titulo="Meu segundo ciclo"
        sub="Todos os erros ainda não superados. Tente lembrar a correção antes de revelar e depois reclassifique."
        acao={pendentes > 0 && (
          <Botao variante="primario" className="px-5 py-3" onClick={() => setFila([...alta, ...media].map((e) => e.id))}>
            <PlayCircle size={18} /> Revisar todos ({pendentes})
          </Botao>
        )}
      />

      {pendentes === 0 ? (
        <Vazio icone={<CheckCircle2 size={26} />} titulo={erros.length ? 'Nenhum erro pendente' : 'O segundo ciclo começa com o primeiro registro'}
          texto={erros.length ? 'Todos os erros registrados estão superados. Continue resolvendo questões e registrando o que aparecer.' : 'Registre erros com prioridade alta ou média e eles aparecem aqui para revisão.'} />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5 sm:p-6">
              <h2 className="mb-1 font-display text-lg font-bold text-plum">Matérias com mais dificuldades</h2>
              <p className="mb-4 text-sm text-muted">Erros pendentes (alta e média) por matéria.</p>
              <BarrasEmpilhadas linhas={mats.map((m) => ({ rotulo: m.materia.nome, alta: m.alta, media: m.media, superado: 0, extra: `${m.pendentes} pendentes` }))} />
            </div>
            <div className="card p-5 sm:p-6">
              <h2 className="mb-1 font-display text-lg font-bold text-plum">Tópicos que precisam de atenção</h2>
              <p className="mb-3 text-sm text-muted">Toque para ver os erros do tópico.</p>
              <div className="flex flex-wrap gap-2">
                {tops.map((t) => (
                  <button key={t.materia?.id + t.topico} type="button" onClick={() => abrirMeusErrosCom({ materiaId: t.materia?.id ?? '', topico: t.topico, prioridades: ['alta', 'media'] })}
                    className="flex min-w-0 max-w-full items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-left transition hover:border-violet">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">{t.topico}</span>
                      <span className="block truncate text-[11px] text-muted">{t.materia?.nome}</span>
                    </span>
                    {t.alta > 0 && <span className="num rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'var(--alta-bg)', color: 'var(--alta)' }}>{t.alta}</span>}
                    {t.media > 0 && <span className="num rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'var(--media-bg)', color: '#a26f00' }}>{t.media}</span>}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            {([['alta', alta], ['media', media]] as const).map(([p, lista]) => (
              <div key={p} className="rounded-[24px] p-4 sm:p-5" style={{ background: PRIO[p].fundo }}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-display text-lg font-extrabold" style={{ color: p === 'media' ? '#a26f00' : PRIO[p].cor }}>
                    {p === 'alta' ? <Flame size={20} /> : <Target size={20} />} {PRIO[p].nome}
                    <span className="num rounded-full bg-surface px-2.5 py-0.5 text-sm">{lista.length}</span>
                  </h2>
                  {lista.length > 1 && (
                    <button type="button" onClick={() => setFila(lista.map((e) => e.id))} className={cx('rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-soft hover:brightness-95')} style={{ color: p === 'media' ? '#a26f00' : PRIO[p].cor }}>
                      Revisar em sequência
                    </button>
                  )}
                </div>
                {lista.length === 0 ? (
                  <p className="rounded-2xl bg-surface/70 px-4 py-6 text-center text-sm text-muted">Nenhum erro nesta classificação.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">{lista.map((e) => <ItemCiclo key={e.id} erro={e} onRevisar={() => setFila([e.id])} />)}</div>
                )}
              </div>
            ))}
          </section>
        </div>
      )}
      {fila && <Revisao fila={fila} onFechar={() => setFila(null)} />}
    </div>
  );
}
