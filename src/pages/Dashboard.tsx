import { useMemo, useState } from 'react';
import { BookOpen, Flame, Layers, Plus, Quote, Sparkles, Target, Trophy, TrendingUp, NotebookPen } from 'lucide-react';
import { useEstado } from '../lib/store';
import { sortearMensagem } from '../lib/mensagens';
import { porMateria, porTopico, resumo, superadosRecentes } from '../lib/stats';
import { PRIORIDADES } from '../lib/constants';
import { plural } from '../lib/utils';
import { Caricatura } from '../components/Caricatura';
import { Anel, BarrasEmpilhadas, Legenda, Rosca } from '../components/Graficos';
import { LinhaErro } from '../components/ErroCard';
import { Vazio } from '../components/ui';

function Indicador({ icone, rotulo, valor, cor, fundo, detalhe }: { icone: React.ReactNode; rotulo: string; valor: React.ReactNode; cor: string; fundo: string; detalhe?: string }) {
  return (
    <div className="card flex flex-col gap-3 p-4 sm:p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: fundo, color: cor }}>{icone}</span>
      <div>
        <div className="num font-display text-[30px] font-extrabold leading-none text-plum">{valor}</div>
        <div className="mt-1.5 text-[13px] font-semibold leading-tight text-muted">{rotulo}</div>
        {detalhe && <div className="mt-0.5 text-[11.5px] text-muted/80">{detalhe}</div>}
      </div>
    </div>
  );
}

const LEGENDA_PRIO = PRIORIDADES.map((p) => ({ cor: p.cor, nome: p.curto }));

export function Dashboard() {
  const { erros, materias } = useEstado();
  const [mensagem] = useState(sortearMensagem);
  const r = useMemo(() => resumo(erros, materias), [erros, materias]);
  const mat = useMemo(() => porMateria(erros, materias).slice(0, 7), [erros, materias]);
  const topicos = useMemo(() => porTopico(erros, materias, true).slice(0, 6), [erros, materias]);
  const ultimos = useMemo(() => [...erros].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm) || b.atualizadoEm - a.atualizadoEm).slice(0, 6), [erros]);
  const recentes = useMemo(() => superadosRecentes(erros, 7), [erros]);

  const fraseEvolucao = r.total === 0
    ? 'Registre seu primeiro erro para começar a acompanhar sua evolução.'
    : r.pctSuperado >= 75 ? 'Você já domina a maior parte do que errou. Mantenha as revisões em dia.'
      : r.pctSuperado >= 40 ? 'Boa parte das dificuldades já virou acerto. Continue no segundo ciclo.'
        : r.superado > 0 ? 'Os primeiros erros já foram superados. Cada revisão aproxima a aprovação.'
          : 'Revise os erros no segundo ciclo e marque como superados os que você já domina.';

  return (
    <div className="flex flex-col gap-6">
      {/* Abertura */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f7dcea] via-[#f4e6fb] to-[#e9defb] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/40" aria-hidden="true" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="flex min-w-0 flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet"><NotebookPen size={13} /> Preparação para concursos</span>
            <h1 className="font-display text-[40px] font-extrabold leading-[.95] tracking-tight text-plum sm:text-[56px]">CADERNO<br />DE ERROS</h1>
            <p className="max-w-md text-[16px] font-medium text-[#5b3f6c] sm:text-[17px]">Uma ferramenta para transformar erros em acertos.</p>
            <p className="font-display text-2xl font-bold text-rose sm:text-[28px]">Tais Elena</p>
            <a href="#registrar" className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-rose px-6 py-3.5 text-[15px] font-bold tracking-wide text-white shadow-lift transition hover:brightness-110 active:scale-[.98]">
              <Plus size={20} strokeWidth={2.6} /> REGISTRAR NOVO ERRO
            </a>
          </div>
          <Caricatura className="mx-auto h-[220px] w-[186px] sm:h-[260px] sm:w-[220px] md:mx-0" />
        </div>
      </section>

      {/* Mensagem motivacional */}
      <section className="card relative overflow-hidden p-5 sm:p-6">
        <Quote className="absolute -right-2 -top-2 text-lilac" size={96} strokeWidth={1.4} aria-hidden="true" />
        <div className="relative flex gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blush text-rose"><Sparkles size={20} /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-rose">Mensagem do dia</p>
            <p className="mt-1 font-display text-[19px] font-semibold leading-snug text-plum sm:text-[22px]">{mensagem}</p>
          </div>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores">
        <Indicador icone={<BookOpen size={20} />} rotulo="Total de erros" valor={r.total} cor="var(--violet)" fundo="var(--lilac)" />
        <Indicador icone={<Layers size={20} />} rotulo="Matérias" valor={r.materias} cor="var(--rose)" fundo="var(--blush)" detalhe={`${r.materiasComErro} com erros`} />
        <Indicador icone={<Flame size={20} />} rotulo="Prioridade alta" valor={r.alta} cor="var(--alta)" fundo="var(--alta-bg)" />
        <Indicador icone={<Target size={20} />} rotulo="Prioridade média" valor={r.media} cor="var(--media)" fundo="var(--media-bg)" />
        <Indicador icone={<Trophy size={20} />} rotulo="Erros superados" valor={r.superado} cor="var(--ok)" fundo="var(--ok-bg)" />
        <Indicador icone={<TrendingUp size={20} />} rotulo="Superados do total" valor={`${r.pctSuperado}%`} cor="var(--ok)" fundo="var(--ok-bg)" />
      </section>

      {/* Evolução */}
      <section className="card flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
        <Anel valor={r.pctSuperado} tamanho={104} espessura={11}>
          <span className="num font-display text-2xl font-extrabold text-ok">{r.pctSuperado}%</span>
        </Anel>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-ok">Sua evolução</p>
          <p className="mt-1 font-display text-lg font-bold text-plum">{fraseEvolucao}</p>
          <p className="mt-1 text-sm text-muted">
            {r.total > 0 && <>{plural(r.superado, 'erro superado', 'erros superados')} de {r.total}. </>}
            {recentes > 0 && <strong className="text-ok">+{recentes} nos últimos 7 dias.</strong>}
          </p>
        </div>
        <a href="#evolucao" className="shrink-0 rounded-full bg-[var(--ok-bg)] px-4 py-2 text-sm font-bold text-ok hover:brightness-95">Ver evolução</a>
      </section>

      {r.total === 0 ? (
        <Vazio icone={<NotebookPen size={26} />} titulo="Seu caderno está pronto" texto="Ao errar uma questão, registre o erro aqui com a correção e a origem. Os gráficos e o segundo ciclo se montam sozinhos a partir dos seus registros."
          acao={<a href="#registrar" className="mt-1 inline-flex items-center gap-2 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white"><Plus size={17} /> Registrar o primeiro erro</a>} />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="card p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-plum">Erros por matéria</h2>
                <Legenda itens={LEGENDA_PRIO} />
              </div>
              <BarrasEmpilhadas linhas={mat.map((m) => ({ rotulo: m.materia.nome, alta: m.alta, media: m.media, superado: m.superado }))} />
            </div>
            <div className="card flex flex-col gap-4 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold text-plum">Distribuição por classificação</h2>
              <Rosca fatias={PRIORIDADES.map((p) => ({ nome: p.curto, cor: p.cor, valor: p.id === 'alta' ? r.alta : p.id === 'media' ? r.media : r.superado }))} centro={r.total} rotuloCentro="registros" />
              <div className="grid grid-cols-3 gap-2 text-center">
                {PRIORIDADES.map((p) => {
                  const v = p.id === 'alta' ? r.alta : p.id === 'media' ? r.media : r.superado;
                  return (
                    <div key={p.id} className="rounded-2xl p-2" style={{ background: p.fundo }}>
                      <div className="num font-display text-xl font-extrabold" style={{ color: p.cor }}>{r.total ? Math.round((v / r.total) * 100) : 0}%</div>
                      <div className="text-[11px] font-bold" style={{ color: p.cor }}>{p.curto}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="card p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between px-2">
                <h2 className="font-display text-lg font-bold text-plum">Últimos erros</h2>
                <a href="#erros" className="text-sm font-bold text-violet hover:underline">Ver todos</a>
              </div>
              <div className="flex flex-col">{ultimos.map((e) => <LinhaErro key={e.id} erro={e} />)}</div>
            </div>
            <div className="card p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between px-2">
                <h2 className="font-display text-lg font-bold text-plum">Assuntos com mais erros</h2>
                <a href="#ciclo" className="text-sm font-bold text-violet hover:underline">Revisar</a>
              </div>
              {topicos.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted">Nenhum assunto pendente. Todos os erros registrados estão superados.</p>
              ) : (
                <ol className="flex flex-col gap-1">
                  {topicos.map((t, i) => (
                    <li key={t.materia?.id + t.topico} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                      <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lilac font-display text-sm font-extrabold text-violet">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{t.topico}</span>
                        <span className="block truncate text-xs text-muted">{t.materia?.nome}</span>
                      </span>
                      <span className="flex shrink-0 gap-1.5 text-xs font-bold">
                        {t.alta > 0 && <span className="num rounded-full px-2 py-0.5" style={{ background: 'var(--alta-bg)', color: 'var(--alta)' }}>{t.alta} alta</span>}
                        {t.media > 0 && <span className="num rounded-full px-2 py-0.5" style={{ background: 'var(--media-bg)', color: 'var(--media)' }}>{t.media} média</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
