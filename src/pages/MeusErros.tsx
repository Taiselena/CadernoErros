import { useMemo, useState } from 'react';
import { ChevronDown, FilterX, ListChecks, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEstado } from '../lib/store';
import { FILTROS_VAZIOS, agrupar, consumirFiltroPendente, filtrar, type Filtros } from '../lib/filtros';
import { ORIGENS, PRIORIDADES } from '../lib/constants';
import { cx, plural } from '../lib/utils';
import { ErroCard } from '../components/ErroCard';
import { CabecalhoPagina, PontoPrioridade, Vazio } from '../components/ui';

export function MeusErros() {
  const { erros, materias } = useEstado();
  const [f, setF] = useState<Filtros>(() => consumirFiltroPendente() ?? FILTROS_VAZIOS);
  const [maisFiltros, setMaisFiltros] = useState(() => !!(f.origem || f.de || f.ate));
  const [recolhidas, setRecolhidas] = useState<Set<string>>(new Set());

  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setF((x) => ({ ...x, [k]: v, ...(k === 'materiaId' ? { topico: '' } : {}) }));
  const resultado = useMemo(() => filtrar(erros, f), [erros, f]);
  const grupos = useMemo(() => agrupar(resultado, materias), [resultado, materias]);
  const topicosDisponiveis = useMemo(() => {
    const base = f.materiaId ? erros.filter((e) => e.materiaId === f.materiaId) : [];
    return [...new Set(base.map((e) => e.topico))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [erros, f.materiaId]);
  const ativos = f.busca || f.materiaId || f.topico || f.prioridades.length || f.origem || f.de || f.ate;

  const contagemPrio = (p: string) => filtrar(erros, { ...f, prioridades: [] }).filter((e) => e.prioridade === p).length;

  return (
    <div>
      <CabecalhoPagina
        titulo="Meus erros"
        sub="Organizados por matéria e tópico. Toque em um tópico para ver só os erros dele."
        acao={<a href="#registrar" className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:brightness-110"><Plus size={17} /> Registrar novo erro</a>}
      />

      {/* Busca e filtros */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:p-5">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input id="busca" type="search" className="campo pl-10" placeholder="Buscar nas descrições, correções e macetes…" value={f.busca} onChange={(e) => set('busca', e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select id="filtro-materia" className="campo" value={f.materiaId} onChange={(e) => set('materiaId', e.target.value)} aria-label="Filtrar por matéria">
            <option value="">Todas as matérias</option>
            {materias.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <select id="filtro-topico" className="campo" value={f.topico} onChange={(e) => set('topico', e.target.value)} disabled={!f.materiaId} aria-label="Filtrar por tópico">
            <option value="">{f.materiaId ? 'Todos os tópicos' : 'Escolha uma matéria para filtrar o tópico'}</option>
            {topicosDisponiveis.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRIORIDADES.map((p) => {
            const ativo = f.prioridades.includes(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={ativo}
                onClick={() => set('prioridades', ativo ? f.prioridades.filter((x) => x !== p.id) : [...f.prioridades, p.id])}
                className={cx('inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition', !ativo && 'border-line text-muted hover:text-ink')}
                style={ativo ? { borderColor: p.cor, background: p.fundo, color: p.cor } : undefined}>
                <PontoPrioridade p={p.id} /> {p.id === 'superado' ? 'Superados' : `Prioridade ${p.curto.toLowerCase()}`}
                <span className="num text-xs opacity-75">{contagemPrio(p.id)}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setMaisFiltros((m) => !m)} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-violet hover:bg-lilac" aria-expanded={maisFiltros}>
            <SlidersHorizontal size={16} /> Origem e data <ChevronDown size={15} className={cx('transition', maisFiltros && 'rotate-180')} />
          </button>
        </div>
        {maisFiltros && (
          <div className="anim-surgir grid gap-3 border-t border-line pt-3 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <label className="rotulo" htmlFor="filtro-origem">Origem do erro</label>
              <select id="filtro-origem" className="campo" value={f.origem} onChange={(e) => set('origem', e.target.value as Filtros['origem'])}>
                <option value="">Todas as origens</option>
                {ORIGENS.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                <option value="nenhuma">Não classificado</option>
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="filtro-de">Cadastrado de</label>
              <input id="filtro-de" type="date" className="campo num" value={f.de} onChange={(e) => set('de', e.target.value)} />
            </div>
            <div>
              <label className="rotulo" htmlFor="filtro-ate">até</label>
              <input id="filtro-ate" type="date" className="campo num" value={f.ate} min={f.de || undefined} onChange={(e) => set('ate', e.target.value)} />
            </div>
          </div>
        )}
        {ativos ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-muted">{plural(resultado.length, 'erro encontrado', 'erros encontrados')} de {erros.length}</span>
            <button type="button" onClick={() => setF(FILTROS_VAZIOS)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-rose hover:bg-blush"><FilterX size={16} /> Limpar filtros</button>
          </div>
        ) : null}
      </div>

      {erros.length === 0 ? (
        <Vazio icone={<ListChecks size={26} />} titulo="Nenhum erro registrado ainda" texto="Quando você registrar um erro, ele aparece aqui organizado por matéria e tópico."
          acao={<a href="#registrar" className="inline-flex items-center gap-2 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white"><Plus size={17} /> Registrar erro</a>} />
      ) : resultado.length === 0 ? (
        <Vazio icone={<Search size={26} />} titulo="Nada encontrado com esses filtros" texto="Tente remover algum filtro ou buscar por outra palavra."
          acao={<button type="button" onClick={() => setF(FILTROS_VAZIOS)} className="rounded-full bg-lilac px-5 py-2.5 text-sm font-bold text-plum">Limpar filtros</button>} />
      ) : (
        <div className="flex flex-col gap-8">
          {grupos.map((g) => {
            const fechada = recolhidas.has(g.materia.id);
            return (
              <section key={g.materia.id}>
                <button type="button" onClick={() => setRecolhidas((r) => { const n = new Set(r); if (n.has(g.materia.id)) n.delete(g.materia.id); else n.add(g.materia.id); return n; })}
                  className="mb-3 flex w-full items-center gap-3 text-left" aria-expanded={!fechada}>
                  <h2 className="font-display text-xl font-extrabold text-plum sm:text-2xl">{g.materia.nome}</h2>
                  <span className="num rounded-full bg-lilac px-2.5 py-0.5 text-sm font-bold text-violet">{g.total}</span>
                  <span className="h-px flex-1 bg-line" />
                  <ChevronDown size={20} className={cx('text-muted transition', fechada && '-rotate-90')} />
                </button>
                {!fechada && (
                  <>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {g.topicos.map((t) => {
                        const ativo = f.topico === t.topico && f.materiaId === g.materia.id;
                        return (
                          <button key={t.topico} type="button"
                            onClick={() => setF((x) => (ativo ? { ...x, topico: '' } : { ...x, materiaId: g.materia.id, topico: t.topico }))}
                            className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold transition', ativo ? 'bg-violet text-white' : 'bg-surface text-plum shadow-soft hover:bg-lilac')}>
                            {t.topico} <span className="num opacity-70">{t.erros.length}</span>{ativo && <X size={13} />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-6">
                      {g.topicos.map((t) => (
                        <div key={t.topico}>
                          <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose" />{t.topico}
                          </h3>
                          <div className="grid gap-3 md:grid-cols-2">
                            {t.erros.map((e) => <ErroCard key={e.id} erro={e} mostrarMateria={false} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
