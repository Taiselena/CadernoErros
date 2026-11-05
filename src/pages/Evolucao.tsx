import { useMemo } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { useEstado } from '../lib/store';
import { porMateria, porOrigem, resumo, serieEvolucao, superadosRecentes } from '../lib/stats';
import { ORIGENS, PRIORIDADES, origemInfo } from '../lib/constants';
import { abrirMeusErrosCom } from '../lib/filtros';
import { plural } from '../lib/utils';
import { Anel, BarrasEmpilhadas, BarrasVerticais, Legenda, LinhaEvolucao } from '../components/Graficos';
import { CabecalhoPagina, IconeOrigem, Vazio } from '../components/ui';

const DICA_ORIGEM: Record<string, string> = {
  desconhecimento: 'Volte à teoria: leia o conteúdo base antes de partir para mais questões desse assunto.',
  confusao: 'Monte quadros comparativos entre os conceitos parecidos e revise as diferenças lado a lado.',
  esquecimento: 'Aumente a frequência das revisões espaçadas e use flashcards para prazos e exceções.',
  interpretacao: 'Leia o comando da questão duas vezes e grife palavras como “incorreta”, “exceto” e “somente”.',
};

export function Evolucao() {
  const { erros, materias } = useEstado();
  const r = useMemo(() => resumo(erros, materias), [erros, materias]);
  const serie = useMemo(() => serieEvolucao(erros), [erros]);
  const mats = useMemo(() => porMateria(erros, materias), [erros, materias]);
  const orig = useMemo(() => porOrigem(erros), [erros]);
  const recentes = useMemo(() => superadosRecentes(erros, 30), [erros]);

  if (erros.length === 0) {
    return (
      <div>
        <CabecalhoPagina titulo="Minha evolução" />
        <Vazio icone={<TrendingUp size={26} />} titulo="Sua evolução aparece aqui" texto="Assim que você registrar erros e começar a superá-los, os gráficos mostram o seu progresso por matéria e por origem do erro." />
      </div>
    );
  }

  const top = orig.maisFrequente ? origemInfo(orig.maisFrequente) : null;
  const linhaTop = orig.linhas.find((l) => l.origem === orig.maisFrequente);
  const naoClass = orig.linhas.find((l) => l.origem === null)!;

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina titulo="Minha evolução" sub="Acompanhe a superação das suas dificuldades ao longo do tempo." />

      <div className="flex gap-3 rounded-2xl bg-lilac/70 px-4 py-3 text-sm text-plum">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>Estes números contam <strong>erros registrados no caderno</strong>, não erros cometidos em provas. O objetivo é ver quantas dificuldades você já transformou em domínio.</p>
      </div>

      {/* Resumo */}
      <section className="card grid gap-6 p-5 sm:p-6 md:grid-cols-[auto_1fr] md:items-center">
        <Anel valor={r.pctSuperado} tamanho={136} espessura={12}>
          <div className="text-center">
            <div className="num font-display text-3xl font-extrabold text-ok">{r.pctSuperado}%</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">superado</div>
          </div>
        </Anel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: r.total, rotulo: 'Registrados', cor: 'var(--violet)', fundo: 'var(--lilac)' },
            { n: r.superado, rotulo: 'Superados', cor: 'var(--ok)', fundo: 'var(--ok-bg)' },
            { n: r.alta, rotulo: 'Em prioridade alta', cor: 'var(--alta)', fundo: 'var(--alta-bg)' },
            { n: r.media, rotulo: 'Em prioridade média', cor: '#a26f00', fundo: 'var(--media-bg)' },
          ].map((k) => (
            <div key={k.rotulo} className="rounded-2xl p-3.5" style={{ background: k.fundo }}>
              <div className="num font-display text-[28px] font-extrabold leading-none" style={{ color: k.cor }}>{k.n}</div>
              <div className="mt-1 text-xs font-bold" style={{ color: k.cor }}>{k.rotulo}</div>
            </div>
          ))}
          <p className="col-span-2 text-sm text-muted sm:col-span-4">
            {recentes > 0
              ? <><strong className="text-ok">{plural(recentes, 'erro superado', 'erros superados')}</strong> nos últimos 30 dias. Isso é dificuldade virando acerto.</>
              : 'Revise os erros pendentes no segundo ciclo e marque como superados os que você já domina.'}
          </p>
        </div>
      </section>

      {/* Linha do tempo */}
      <section className="card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-plum">Registrados e superados ao longo do tempo</h2>
          <Legenda itens={[{ cor: 'var(--violet)', nome: 'Total registrado' }, { cor: 'var(--ok)', nome: 'Total superado' }]} />
        </div>
        <LinhaEvolucao pontos={serie} />
        <p className="mt-2 text-xs text-muted">Quanto mais a linha verde se aproxima da roxa, mais erros você já superou.</p>
      </section>

      {/* Por matéria */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-plum">Evolução por matéria</h2>
          <Legenda itens={PRIORIDADES.map((p) => ({ cor: p.cor, nome: p.curto }))} />
        </div>
        <BarrasEmpilhadas linhas={mats.map((m) => ({ rotulo: m.materia.nome, alta: m.alta, media: m.media, superado: m.superado, extra: <><strong className="text-ok">{m.pctSuperado}%</strong> superado · {m.total}</> }))} />
      </section>

      {/* Por origem */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-plum">Por que estou errando?</h2>
        <p className="mb-5 text-sm text-muted">Quantidade e porcentagem de erros por origem. A origem não muda com a prioridade: ela mostra a causa do erro.</p>
        {top && linhaTop ? (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center" style={{ background: top.fundo }}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface" style={{ color: top.cor }}><IconeOrigem o={orig.maisFrequente} size={24} /></span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: top.cor }}>Origem mais frequente · {linhaTop.pct}% dos erros</p>
              <p className="font-display text-xl font-bold text-plum">{top.nome}</p>
              <p className="mt-0.5 text-sm text-ink/80">{DICA_ORIGEM[orig.maisFrequente!]}</p>
            </div>
          </div>
        ) : orig.empatadas.length > 1 ? (
          <p className="mb-6 rounded-2xl bg-page p-4 text-sm text-plum">Empate entre as origens mais frequentes: <strong>{(() => { const n = orig.empatadas.map((o) => origemInfo(o).nome); return n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1]; })()}</strong>.</p>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <BarrasVerticais itens={ORIGENS.map((o) => ({ nome: o.nome, valor: orig.linhas.find((l) => l.origem === o.id)!.total, cor: o.cor, fundo: o.fundo, icone: <IconeOrigem o={o.id} size={16} /> }))} />
          <div className="flex flex-col gap-1">
            {orig.linhas.filter((l) => l.origem !== null || l.total > 0).map((l) => {
              const info = origemInfo(l.origem);
              return (
                <button key={String(l.origem)} type="button" onClick={() => abrirMeusErrosCom({ origem: l.origem ?? 'nenhuma' })}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-page">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: info.fundo, color: info.cor }}><IconeOrigem o={l.origem} size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold text-ink">{info.nome}</span>
                      <span className="num shrink-0 text-sm font-bold" style={{ color: info.cor }}>{l.total} · {l.pct}%</span>
                    </span>
                    <span className="mt-1 block h-2 overflow-hidden rounded-full bg-page"><span className="block h-full rounded-full transition-all" style={{ width: `${l.pct}%`, background: info.cor }} /></span>
                    <span className="mt-0.5 block text-[11.5px] text-muted">{l.pendentes} ainda não superado{l.pendentes === 1 ? '' : 's'}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {naoClass.total > 0 && <p className="mt-4 text-xs text-muted">{plural(naoClass.total, 'registro antigo está', 'registros antigos estão')} como “Não classificado”. Abra o registro e escolha a origem quando quiser.</p>}
      </section>
    </div>
  );
}
