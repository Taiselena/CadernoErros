import { useState } from 'react';
import { Check, ChevronDown, Library, Pencil, Plus, Trash2, X } from 'lucide-react';
import { acoes, useEstado } from '../lib/store';
import { abrirMeusErrosCom } from '../lib/filtros';
import { cx, plural } from '../lib/utils';
import { Botao, CabecalhoPagina, Vazio, confirmar, notificar } from '../components/ui';

function EdicaoInline({ valor, onSalvar, onCancelar }: { valor: string; onSalvar: (v: string) => string | null; onCancelar: () => void }) {
  const [v, setV] = useState(valor);
  const [erro, setErro] = useState('');
  const salvar = () => { const e = onSalvar(v); if (e) setErro(e); };
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex gap-1.5">
        <input className="campo py-1.5" value={v} autoFocus onChange={(e) => { setV(e.target.value); setErro(''); }} onKeyDown={(e) => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') onCancelar(); }} aria-label="Novo nome" />
        <button type="button" onClick={salvar} aria-label="Salvar" className="rounded-full bg-violet p-2 text-white"><Check size={16} /></button>
        <button type="button" onClick={onCancelar} aria-label="Cancelar" className="rounded-full p-2 text-muted hover:bg-page"><X size={16} /></button>
      </div>
      {erro && <p className="text-xs font-semibold text-alta">{erro}</p>}
    </div>
  );
}

export function Materias() {
  const { materias, erros } = useEstado();
  const [nova, setNova] = useState('');
  const [erroNova, setErroNova] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(materias[0]?.id ?? null);
  const [novoTopico, setNovoTopico] = useState('');

  function criar() {
    if (!nova.trim()) { setErroNova('Digite o nome da matéria.'); return; }
    const existe = materias.find((m) => m.nome.toLowerCase() === nova.trim().toLowerCase());
    const m = acoes.adicionarMateria(nova);
    if (existe) { setErroNova('Essa matéria já existe.'); setAberta(m.id); return; }
    setNova(''); setAberta(m.id);
    notificar('Matéria adicionada.');
  }

  async function excluirMateria(id: string, nome: string) {
    const n = erros.filter((e) => e.materiaId === id).length;
    const ok = await confirmar({
      titulo: `Excluir ${nome}?`,
      texto: n ? <>Esta matéria tem <strong className="text-alta">{plural(n, 'erro registrado', 'erros registrados')}</strong>, que também serão apagados. Exporte um backup antes, se quiser guardar.</> : 'A matéria e seus tópicos serão removidos.',
      botao: 'Excluir matéria', perigo: true,
    });
    if (ok) { acoes.excluirMateria(id); notificar('Matéria excluída.'); }
  }

  async function excluirTopico(mid: string, t: string) {
    const n = erros.filter((e) => e.materiaId === mid && e.topico === t).length;
    const ok = await confirmar({
      titulo: `Excluir o tópico “${t}”?`,
      texto: n ? <>Os <strong className="text-alta">{plural(n, 'erro', 'erros')}</strong> deste tópico também serão apagados.</> : 'O tópico será removido da lista.',
      botao: 'Excluir tópico', perigo: true,
    });
    if (ok) { acoes.excluirTopico(mid, t); notificar('Tópico excluído.'); }
  }

  return (
    <div>
      <CabecalhoPagina titulo="Matérias e tópicos" sub="Organize as matérias do edital e os assuntos de cada uma. Nomes repetidos não são duplicados." />
      <div className="card mb-6 flex flex-col gap-2 p-4 sm:flex-row sm:p-5">
        <input id="nova-materia" className={cx('campo', erroNova && 'invalido')} placeholder="Nova matéria (ex.: Direito Civil, Informática…)" value={nova} onChange={(e) => { setNova(e.target.value); setErroNova(''); }} onKeyDown={(e) => e.key === 'Enter' && criar()} />
        <Botao variante="primario" onClick={criar} className="shrink-0"><Plus size={17} /> Adicionar matéria</Botao>
      </div>
      {erroNova && <p className="-mt-4 mb-4 px-1 text-sm font-semibold text-alta">{erroNova}</p>}

      {materias.length === 0 ? (
        <Vazio icone={<Library size={26} />} titulo="Nenhuma matéria cadastrada" texto="Adicione as matérias do seu edital para começar a organizar os erros." />
      ) : (
        <div className="flex flex-col gap-3">
          {materias.map((m) => {
            const doMat = erros.filter((e) => e.materiaId === m.id);
            const aberto = aberta === m.id;
            const topicos = [...new Set([...m.topicos, ...doMat.map((e) => e.topico)])];
            return (
              <div key={m.id} className="card overflow-hidden">
                <div className="flex items-center gap-2 p-4 sm:px-5">
                  {editando === 'm:' + m.id ? (
                    <EdicaoInline valor={m.nome} onCancelar={() => setEditando(null)} onSalvar={(v) => { const e = acoes.renomearMateria(m.id, v); if (!e) { setEditando(null); notificar('Matéria renomeada.'); } return e; }} />
                  ) : (
                    <>
                      <button type="button" onClick={() => setAberta(aberto ? null : m.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={aberto}>
                        <ChevronDown size={18} className={cx('shrink-0 text-muted transition', !aberto && '-rotate-90')} />
                        <span className="min-w-0">
                          <span className="block truncate font-display text-[17px] font-bold text-plum">{m.nome}</span>
                          <span className="text-xs text-muted">{plural(topicos.length, 'tópico', 'tópicos')} · {plural(doMat.length, 'erro', 'erros')}</span>
                        </span>
                      </button>
                      <button type="button" aria-label={`Renomear ${m.nome}`} title="Renomear" onClick={() => setEditando('m:' + m.id)} className="rounded-full p-2 text-muted hover:bg-lilac hover:text-violet"><Pencil size={16} /></button>
                      <button type="button" aria-label={`Excluir ${m.nome}`} title="Excluir" onClick={() => void excluirMateria(m.id, m.nome)} className="rounded-full p-2 text-muted hover:bg-[var(--alta-bg)] hover:text-alta"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
                {aberto && (
                  <div className="anim-surgir border-t border-line bg-page/60 p-4 sm:px-5">
                    <div className="mb-3 flex gap-2">
                      <input id={'novo-topico-' + m.id} className="campo py-2" placeholder="Novo tópico" value={novoTopico} onChange={(e) => setNovoTopico(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { const r = acoes.adicionarTopico(m.id, novoTopico); if (r) notificar(r, 'erro'); else { setNovoTopico(''); notificar('Tópico adicionado.'); } } }} />
                      <Botao onClick={() => { const r = acoes.adicionarTopico(m.id, novoTopico); if (r) notificar(r, 'erro'); else { setNovoTopico(''); notificar('Tópico adicionado.'); } }} className="shrink-0"><Plus size={16} /> Tópico</Botao>
                    </div>
                    {topicos.length === 0 ? (
                      <p className="py-2 text-sm text-muted">Nenhum tópico ainda. Eles também são criados automaticamente ao registrar um erro.</p>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {topicos.map((t) => {
                          const n = doMat.filter((e) => e.topico === t).length;
                          const pend = doMat.filter((e) => e.topico === t && e.prioridade !== 'superado').length;
                          return (
                            <li key={t} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
                              {editando === `t:${m.id}:${t}` ? (
                                <EdicaoInline valor={t} onCancelar={() => setEditando(null)} onSalvar={(v) => { const e = acoes.renomearTopico(m.id, t, v); if (!e) { setEditando(null); notificar('Tópico renomeado.'); } return e; }} />
                              ) : (
                                <>
                                  <button type="button" disabled={!n} onClick={() => abrirMeusErrosCom({ materiaId: m.id, topico: t })} className="min-w-0 flex-1 text-left disabled:cursor-default">
                                    <span className="block truncate text-sm font-semibold text-ink">{t}</span>
                                    <span className="text-xs text-muted">{n ? `${plural(n, 'erro', 'erros')} · ${pend} pendente${pend === 1 ? '' : 's'}` : 'Sem erros'}</span>
                                  </button>
                                  <button type="button" aria-label={`Renomear ${t}`} onClick={() => setEditando(`t:${m.id}:${t}`)} className="rounded-full p-1.5 text-muted hover:bg-lilac hover:text-violet"><Pencil size={15} /></button>
                                  <button type="button" aria-label={`Excluir ${t}`} onClick={() => void excluirTopico(m.id, t)} className="rounded-full p-1.5 text-muted hover:bg-[var(--alta-bg)] hover:text-alta"><Trash2 size={15} /></button>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
