import type { ReactNode } from 'react';
import { formatarData } from '../lib/utils';

/* Barras horizontais empilhadas (alta / média / superado) por categoria. */
export function BarrasEmpilhadas({ linhas }: { linhas: { rotulo: string; alta: number; media: number; superado: number; extra?: ReactNode }[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.alta + l.media + l.superado));
  return (
    <div className="flex flex-col gap-3.5">
      {linhas.map((l) => {
        const total = l.alta + l.media + l.superado;
        return (
          <div key={l.rotulo} className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-semibold text-ink">{l.rotulo}</span>
              <span className="num shrink-0 text-muted">{l.extra ?? total}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-page">
              <div className="flex h-full transition-all duration-500" style={{ width: `${(total / max) * 100}%` }}>
                {l.alta > 0 && <span style={{ width: `${(l.alta / total) * 100}%`, background: 'var(--alta)' }} title={`Alta: ${l.alta}`} />}
                {l.media > 0 && <span style={{ width: `${(l.media / total) * 100}%`, background: 'var(--media)' }} title={`Média: ${l.media}`} />}
                {l.superado > 0 && <span style={{ width: `${(l.superado / total) * 100}%`, background: 'var(--ok)' }} title={`Superado: ${l.superado}`} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Legenda({ itens }: { itens: { cor: string; nome: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-muted">
      {itens.map((i) => (
        <span key={i.nome} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: i.cor }} />{i.nome}</span>
      ))}
    </div>
  );
}

/* Rosca com centro informativo. */
export function Rosca({ fatias, centro, rotuloCentro, tamanho = 168 }: { fatias: { valor: number; cor: string; nome: string }[]; centro: ReactNode; rotuloCentro: string; tamanho?: number }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  const r = 62, c = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <div className="relative mx-auto" style={{ width: tamanho, height: tamanho, maxWidth: '100%' }}>
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={fatias.map((f) => `${f.nome}: ${f.valor}`).join(', ')}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--page)" strokeWidth="20" />
        {total > 0 && fatias.filter((f) => f.valor > 0).map((f) => {
          const frac = f.valor / total;
          const traco = Math.max(frac * c - (fatias.filter((x) => x.valor > 0).length > 1 ? 3 : 0), 0.5);
          const el = (
            <circle key={f.nome} cx="80" cy="80" r={r} fill="none" stroke={f.cor} strokeWidth="20" strokeLinecap="butt"
              strokeDasharray={`${traco} ${c - traco}`} strokeDashoffset={-acumulado * c} style={{ transition: 'stroke-dasharray .6s ease' }} />
          );
          acumulado += frac;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="num font-display text-3xl font-extrabold text-plum">{centro}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{rotuloCentro}</div>
        </div>
      </div>
    </div>
  );
}

/* Anel de progresso simples. */
export function Anel({ valor, cor = 'var(--ok)', tamanho = 92, espessura = 10, children }: { valor: number; cor?: string; tamanho?: number; espessura?: number; children?: ReactNode }) {
  const r = 50 - espessura / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth={espessura} />
        <circle cx="50" cy="50" r={r} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round"
          strokeDasharray={`${(Math.min(valor, 100) / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray .7s ease' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* Linhas acumuladas: registrados x superados ao longo do tempo. */
export function LinhaEvolucao({ pontos }: { pontos: { dia: string; registrados: number; superados: number }[] }) {
  const W = 900, H = 260, m = { t: 16, r: 18, b: 34, l: 38 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const serie = pontos.length === 1 ? [{ ...pontos[0], registrados: 0, superados: 0, dia: '' }, pontos[0]] : pontos;
  const max = Math.max(1, ...serie.map((p) => p.registrados));
  const passo = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : Math.ceil(max / 5 / 10) * 10;
  const topo = Math.ceil(max / passo) * passo;
  const x = (i: number) => m.l + (serie.length === 1 ? iw / 2 : (i / (serie.length - 1)) * iw);
  const y = (v: number) => m.t + ih - (v / topo) * ih;
  const linha = (k: 'registrados' | 'superados') => serie.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
  const area = (k: 'registrados' | 'superados') => `${linha(k)} L${x(serie.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks: number[] = [];
  for (let v = 0; v <= topo; v += passo) ticks.push(v);
  const marcas = serie.length <= 6 ? serie.map((_, i) => i) : [0, Math.floor((serie.length - 1) / 2), serie.length - 1];
  const ult = serie[serie.length - 1];
  return (
    <div className="w-full overflow-x-auto rolagem-fina">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" role="img" aria-label="Erros registrados e superados ao longo do tempo">
        <defs>
          <linearGradient id="gReg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7a46d0" stopOpacity=".22" /><stop offset="1" stopColor="#7a46d0" stopOpacity="0" /></linearGradient>
          <linearGradient id="gSup" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#23955f" stopOpacity=".28" /><stop offset="1" stopColor="#23955f" stopOpacity="0" /></linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t ? '3 4' : undefined} />
            <text x={m.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" className="num">{t}</text>
          </g>
        ))}
        {marcas.map((i) => serie[i].dia && (
          <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? 'start' : i === serie.length - 1 ? 'end' : 'middle'} fontSize="11" fill="var(--muted)">{formatarData(serie[i].dia).slice(0, 5)}</text>
        ))}
        <path d={area('registrados')} fill="url(#gReg)" />
        <path d={area('superados')} fill="url(#gSup)" />
        <path d={linha('registrados')} fill="none" stroke="var(--violet)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={linha('superados')} fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(serie.length - 1)} cy={y(ult.registrados)} r="5" fill="var(--surface)" stroke="var(--violet)" strokeWidth="2.5" />
        <circle cx={x(serie.length - 1)} cy={y(ult.superados)} r="5" fill="var(--surface)" stroke="var(--ok)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

/* Barras verticais simples (uma série). */
export function BarrasVerticais({ itens }: { itens: { nome: string; valor: number; cor: string; fundo: string; icone?: ReactNode }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="grid h-48 grid-flow-col items-end gap-2 sm:gap-4" style={{ gridAutoColumns: '1fr' }}>
      {itens.map((i) => (
        <div key={i.nome} className="flex h-full min-w-0 flex-col items-center justify-end gap-1.5">
          <span className="num text-sm font-bold" style={{ color: i.cor }}>{i.valor}</span>
          <div className="w-full max-w-[56px] rounded-t-xl transition-all duration-500" style={{ height: `${Math.max((i.valor / max) * 100, i.valor ? 6 : 2)}%`, background: i.valor ? i.cor : 'var(--line)' }} />
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: i.fundo, color: i.cor }} title={i.nome}>{i.icone}</span>
        </div>
      ))}
    </div>
  );
}
