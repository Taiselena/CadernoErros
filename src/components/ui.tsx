import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, CircleAlert, CircleHelp, Hourglass, ScanText, Shuffle, X, CircleDashed } from 'lucide-react';
import type { Origem, Prioridade } from '../lib/types';
import { ORIGENS, PRIORIDADES, PRIO, origemInfo } from '../lib/constants';
import { cx } from '../lib/utils';

/* ---------------- Botões ---------------- */
type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';
export function Botao({ variante = 'secundario', className, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none',
        variante === 'primario' && 'bg-violet text-white shadow-soft hover:brightness-110',
        variante === 'secundario' && 'bg-lilac text-plum hover:bg-[#e5d9fa]',
        variante === 'fantasma' && 'text-muted hover:bg-lilac hover:text-plum',
        variante === 'perigo' && 'bg-alta text-white hover:brightness-110',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Selos ---------------- */
export function PontoPrioridade({ p, className }: { p: Prioridade; className?: string }) {
  return <span className={cx('inline-block h-2.5 w-2.5 shrink-0 rounded-full', className)} style={{ background: PRIO[p].cor }} />;
}

export function SeloPrioridade({ p, grande }: { p: Prioridade; grande?: boolean }) {
  const info = PRIO[p];
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full font-bold', grande ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs')} style={{ background: info.fundo, color: info.cor }}>
      <PontoPrioridade p={p} className={grande ? '' : 'h-2 w-2'} />
      {info.curto === 'Superado' ? 'Superado' : `Prioridade ${info.curto.toLowerCase()}`}
    </span>
  );
}

export function IconeOrigem({ o, size = 16 }: { o: Origem | null; size?: number }) {
  const props = { size, strokeWidth: 2.2 };
  if (o === 'desconhecimento') return <CircleHelp {...props} />;
  if (o === 'confusao') return <Shuffle {...props} />;
  if (o === 'esquecimento') return <Hourglass {...props} />;
  if (o === 'interpretacao') return <ScanText {...props} />;
  return <CircleDashed {...props} />;
}

export function SeloOrigem({ o }: { o: Origem | null }) {
  const info = origemInfo(o);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: info.fundo, color: info.cor }}>
      <IconeOrigem o={o} size={13} />
      {info.nome}
    </span>
  );
}

/* ---------------- Seletores ---------------- */
export function SeletorPrioridade({ valor, onChange, compacto, erro }: { valor: Prioridade | null; onChange: (p: Prioridade) => void; compacto?: boolean; erro?: boolean }) {
  if (compacto) {
    return (
      <div className="inline-flex rounded-full bg-page p-0.5" role="radiogroup" aria-label="Prioridade">
        {PRIORIDADES.map((p) => (
          <button
            key={p.id} type="button" role="radio" aria-checked={valor === p.id} title={p.nome}
            onClick={() => onChange(p.id)}
            className={cx('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition', valor === p.id ? 'shadow-soft' : 'text-muted hover:text-ink')}
            style={valor === p.id ? { background: p.fundo, color: p.cor } : undefined}
          >
            <PontoPrioridade p={p.id} className="h-2 w-2" />
            {p.curto}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cx('grid gap-2.5 sm:grid-cols-3', erro && 'rounded-2xl ring-2 ring-alta/60 ring-offset-2')} role="radiogroup" aria-label="Classificação de prioridade">
      {PRIORIDADES.map((p) => {
        const ativo = valor === p.id;
        return (
          <button
            key={p.id} type="button" role="radio" aria-checked={ativo} onClick={() => onChange(p.id)}
            className={cx('flex flex-col gap-1.5 rounded-2xl border-2 p-3.5 text-left transition', ativo ? 'shadow-soft' : 'border-line bg-surface hover:border-[#e3d3ea]')}
            style={ativo ? { borderColor: p.cor, background: p.fundo } : undefined}
          >
            <span className="flex items-center gap-2 font-display text-[15px] font-bold" style={{ color: p.cor }}>
              <PontoPrioridade p={p.id} className="h-3 w-3" />
              {p.nome.toUpperCase()}
            </span>
            <span className="text-[13px] leading-snug text-muted">{p.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SeletorOrigem({ valor, onChange, erro }: { valor: Origem | null; onChange: (o: Origem) => void; erro?: boolean }) {
  return (
    <div className={cx('grid gap-2.5 sm:grid-cols-2', erro && 'rounded-2xl ring-2 ring-alta/60 ring-offset-2')} role="radiogroup" aria-label="Origem do erro">
      {ORIGENS.map((o) => {
        const ativo = valor === o.id;
        return (
          <button
            key={o.id} type="button" role="radio" aria-checked={ativo} onClick={() => onChange(o.id)}
            className={cx('flex gap-3 rounded-2xl border-2 p-3.5 text-left transition', ativo ? 'shadow-soft' : 'border-line bg-surface hover:border-[#e3d3ea]')}
            style={ativo ? { borderColor: o.cor, background: o.fundo } : undefined}
          >
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: ativo ? 'var(--surface)' : o.fundo, color: o.cor }}>
              <IconeOrigem o={o.id} size={18} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[15px] font-bold" style={{ color: ativo ? o.cor : 'var(--ink)' }}>{o.nome}</span>
              <span className="block text-[13px] leading-snug text-muted">{o.desc}</span>
              <span className="mt-1 block text-[12px] italic text-muted/80">Ex.: {o.exemplo}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Menu compacto para trocar a origem direto no cartão. */
export function TrocarOrigem({ valor, onChange }: { valor: Origem | null; onChange: (o: Origem) => void }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false); };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [aberto]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setAberto((a) => !a)} title="Alterar origem do erro" aria-expanded={aberto} className="rounded-full transition hover:brightness-95">
        <SeloOrigem o={valor} />
      </button>
      {aberto && (
        <div className="anim-surgir absolute left-0 z-30 mt-1.5 w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Origem do erro</p>
          {ORIGENS.map((o) => (
            <button
              key={o.id} type="button"
              onClick={() => { onChange(o.id); setAberto(false); }}
              className={cx('flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold hover:bg-page', valor === o.id && 'bg-page')}
              style={{ color: o.cor }}
            >
              <IconeOrigem o={o.id} size={16} /> <span className="text-ink">{o.nome}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ aberto, onFechar, titulo, children, largura = 'max-w-2xl' }: { aberto: boolean; onFechar: () => void; titulo: ReactNode; children: ReactNode; largura?: string }) {
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = overflow; };
  }, [aberto, onFechar]);
  if (!aberto) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#2b1a35]/40 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div role="dialog" aria-modal="true" className={cx('anim-surgir flex max-h-[92vh] w-full flex-col rounded-t-[26px] bg-surface shadow-lift sm:rounded-[26px]', largura)} style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-plum">{titulo}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="-mr-1.5 rounded-full p-1.5 text-muted hover:bg-page hover:text-ink"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Confirmação ---------------- */
interface PedidoConfirmacao { titulo: string; texto: ReactNode; botao: string; perigo?: boolean; resolver: (ok: boolean) => void }
let pedido: PedidoConfirmacao | null = null;
const ouvintesConf = new Set<() => void>();
export function confirmar(opts: Omit<PedidoConfirmacao, 'resolver'>): Promise<boolean> {
  return new Promise((resolver) => {
    pedido = { ...opts, resolver };
    ouvintesConf.forEach((f) => f());
  });
}
export function ConfirmacaoHost() {
  const atual = useSyncExternalStore((f) => { ouvintesConf.add(f); return () => ouvintesConf.delete(f); }, () => pedido);
  const fechar = (ok: boolean) => { atual?.resolver(ok); pedido = null; ouvintesConf.forEach((f) => f()); };
  return (
    <Modal aberto={!!atual} onFechar={() => fechar(false)} titulo={atual?.titulo ?? ''} largura="max-w-md">
      <div className="text-[15px] leading-relaxed text-muted">{atual?.texto}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Botao variante="fantasma" onClick={() => fechar(false)}>Cancelar</Botao>
        <Botao variante={atual?.perigo ? 'perigo' : 'primario'} onClick={() => fechar(true)}>{atual?.botao}</Botao>
      </div>
    </Modal>
  );
}

/* ---------------- Notificações ---------------- */
interface Aviso { id: number; tipo: 'sucesso' | 'erro'; texto: string }
let avisos: Aviso[] = [];
const ouvintesAviso = new Set<() => void>();
let seq = 0;
export function notificar(texto: string, tipo: Aviso['tipo'] = 'sucesso') {
  const id = ++seq;
  avisos = [...avisos, { id, tipo, texto }];
  ouvintesAviso.forEach((f) => f());
  setTimeout(() => { avisos = avisos.filter((a) => a.id !== id); ouvintesAviso.forEach((f) => f()); }, tipo === 'erro' ? 5200 : 3200);
}
export function AvisosHost() {
  const lista = useSyncExternalStore((f) => { ouvintesAviso.add(f); return () => ouvintesAviso.delete(f); }, () => avisos);
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }} aria-live="polite">
      {lista.map((a) => (
        <div key={a.id} className="anim-surgir pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl bg-plum px-4 py-3 text-sm font-semibold text-white shadow-lift">
          {a.tipo === 'sucesso' ? <CheckCircle2 size={18} className="shrink-0 text-[#8be0b2]" /> : <CircleAlert size={18} className="shrink-0 text-[#ff9aa4]" />}
          {a.texto}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Estado vazio ---------------- */
export function Vazio({ icone, titulo, texto, acao }: { icone: ReactNode; titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line px-6 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lilac text-violet">{icone}</span>
      <h3 className="font-display text-lg font-bold text-plum">{titulo}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{texto}</p>
      {acao}
    </div>
  );
}

export function CabecalhoPagina({ titulo, sub, acao }: { titulo: string; sub?: string; acao?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-plum sm:text-[34px]">{titulo}</h1>
        {sub && <p className="mt-1 max-w-2xl text-[15px] text-muted">{sub}</p>}
      </div>
      {acao}
    </div>
  );
}
