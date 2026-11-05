import { useState, type ReactNode } from 'react';
import { Cloud, CloudOff, HardDrive, LayoutDashboard, Library, ListChecks, Menu, Plus, RefreshCw, Repeat2, Settings2, TrendingUp, X, AlertTriangle } from 'lucide-react';
import { useEstado } from '../lib/store';
import { cx } from '../lib/utils';

export type Rota = 'dashboard' | 'registrar' | 'erros' | 'ciclo' | 'evolucao' | 'materias' | 'backup';

export const MENU: { id: Rota; nome: string; icone: typeof LayoutDashboard }[] = [
  { id: 'dashboard', nome: 'Dashboard', icone: LayoutDashboard },
  { id: 'registrar', nome: 'Registrar erro', icone: Plus },
  { id: 'erros', nome: 'Meus erros', icone: ListChecks },
  { id: 'ciclo', nome: 'Segundo ciclo', icone: Repeat2 },
  { id: 'evolucao', nome: 'Minha evolução', icone: TrendingUp },
  { id: 'materias', nome: 'Matérias e tópicos', icone: Library },
  { id: 'backup', nome: 'Backup e configurações', icone: Settings2 },
];

export function ir(r: Rota) {
  if (location.hash !== '#' + r) location.hash = r;
  window.scrollTo({ top: 0 });
}

function Sincronizacao({ compacta }: { compacta?: boolean }) {
  const { sync, syncMsg } = useEstado();
  const cfg = {
    conectando: { icone: <RefreshCw size={15} className="girando" />, rotulo: 'Conectando', cor: 'var(--muted)' },
    enviando: { icone: <RefreshCw size={15} className="girando" />, rotulo: 'Sincronizando', cor: 'var(--violet)' },
    sincronizado: { icone: <Cloud size={15} />, rotulo: 'Salvo na nuvem', cor: 'var(--ok)' },
    local: { icone: <HardDrive size={15} />, rotulo: 'Neste aparelho', cor: 'var(--media)' },
    offline: { icone: <CloudOff size={15} />, rotulo: 'Offline', cor: 'var(--media)' },
    erro: { icone: <AlertTriangle size={15} />, rotulo: 'Falha ao sincronizar', cor: 'var(--alta)' },
  }[sync];
  return (
    <span title={syncMsg} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-soft" style={{ color: cfg.cor }}>
      {cfg.icone}
      {compacta ? <span className="max-[380px]:sr-only">{cfg.rotulo}</span> : cfg.rotulo}
    </span>
  );
}

export function Layout({ rota, children }: { rota: Rota; children: ReactNode }) {
  const [maisAberto, setMaisAberto] = useState(false);
  const inferior: Rota[] = ['dashboard', 'erros', 'registrar', 'ciclo', 'evolucao'];
  return (
    <div className="min-h-full lg:flex">
      {/* Barra lateral (computador) */}
      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col gap-1 border-r border-line bg-surface/70 px-4 py-6 backdrop-blur lg:flex" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mb-6 px-2">
          <p className="font-display text-[19px] font-extrabold leading-none tracking-tight text-plum">CADERNO<br />DE ERROS</p>
          <p className="mt-1.5 text-xs font-semibold text-rose">Tais Elena</p>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Navegação principal">
          {MENU.map((m) => {
            const ativo = rota === m.id;
            const Icone = m.icone;
            return (
              <a
                key={m.id} href={'#' + m.id} aria-current={ativo ? 'page' : undefined}
                className={cx('flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14.5px] font-semibold transition', ativo ? 'bg-lilac text-violet' : 'text-muted hover:bg-page hover:text-ink', m.id === 'registrar' && !ativo && 'text-rose')}
              >
                <span className={cx('grid h-8 w-8 place-items-center rounded-xl', ativo ? 'bg-violet text-white' : m.id === 'registrar' ? 'bg-blush text-rose' : 'bg-page')}><Icone size={17} strokeWidth={2.3} /></span>
                {m.nome}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto px-2"><Sincronizacao /></div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Cabeçalho do celular */}
        <header className="gutter sticky z-40 flex items-center justify-between gap-3 border-b border-line bg-page/90 py-3 backdrop-blur lg:hidden" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <a href="#dashboard" className="min-w-0">
            <span className="block font-display text-[15px] font-extrabold leading-none tracking-tight text-plum">CADERNO DE ERROS</span>
            <span className="text-[11px] font-semibold text-rose">Tais Elena</span>
          </a>
          <Sincronizacao compacta />
        </header>
        {/* Indicador de sincronização (computador) */}
        <main className="gutter mx-auto w-full max-w-[1180px] pb-32 pt-6 lg:pb-14 lg:pt-8">{children}</main>
      </div>

      {/* Barra inferior (celular e tablet) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }} aria-label="Navegação">
        <div className="mx-auto grid max-w-lg grid-cols-6 items-end px-1 pt-1.5">
          {inferior.map((id) => {
            const m = MENU.find((x) => x.id === id)!;
            const Icone = m.icone;
            const ativo = rota === id;
            if (id === 'registrar') {
              return (
                <a key={id} href="#registrar" aria-label="Registrar novo erro" className="-mt-6 flex flex-col items-center gap-1 pb-1.5">
                  <span className={cx('grid h-14 w-14 place-items-center rounded-full text-white shadow-lift transition', ativo ? 'bg-plum' : 'bg-rose')}><Plus size={26} strokeWidth={2.6} /></span>
                  <span className="text-[10.5px] font-bold text-rose">Registrar</span>
                </a>
              );
            }
            return (
              <a key={id} href={'#' + id} aria-current={ativo ? 'page' : undefined} className={cx('flex flex-col items-center gap-1 pb-2 pt-1 text-[10.5px] font-bold', ativo ? 'text-violet' : 'text-muted')}>
                <span className={cx('grid h-8 w-11 place-items-center rounded-full transition', ativo && 'bg-lilac')}><Icone size={19} strokeWidth={2.3} /></span>
                {({ dashboard: 'Início', erros: 'Erros', ciclo: 'Ciclo', evolucao: 'Evolução' } as Record<string, string>)[id]}
              </a>
            );
          })}
          <button type="button" onClick={() => setMaisAberto(true)} className={cx('flex flex-col items-center gap-1 pb-2 pt-1 text-[10.5px] font-bold', rota === 'materias' || rota === 'backup' ? 'text-violet' : 'text-muted')}>
            <span className={cx('grid h-8 w-11 place-items-center rounded-full', (rota === 'materias' || rota === 'backup') && 'bg-lilac')}><Menu size={19} strokeWidth={2.3} /></span>
            Mais
          </button>
        </div>
      </nav>

      {maisAberto && (
        <div className="fixed inset-0 z-[55] flex items-end bg-[#2b1a35]/35 lg:hidden" onClick={() => setMaisAberto(false)}>
          <div className="anim-surgir w-full rounded-t-[26px] bg-surface p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-display font-bold text-plum">Mais opções</span>
              <button type="button" aria-label="Fechar" onClick={() => setMaisAberto(false)} className="rounded-full p-1.5 text-muted hover:bg-page"><X size={20} /></button>
            </div>
            {MENU.filter((m) => m.id === 'materias' || m.id === 'backup').map((m) => {
              const Icone = m.icone;
              return (
                <a key={m.id} href={'#' + m.id} onClick={() => setMaisAberto(false)} className={cx('flex items-center gap-3 rounded-2xl px-3 py-3 font-semibold', rota === m.id ? 'bg-lilac text-violet' : 'text-ink hover:bg-page')}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-page text-violet"><Icone size={18} /></span>{m.nome}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
