import { useState } from 'react';
import { Eye, Pencil, Trash2, Lightbulb, BookMarked, CalendarDays, History } from 'lucide-react';
import type { Erro } from '../lib/types';
import { acoes, useEstado } from '../lib/store';
import { PRIO, origemInfo } from '../lib/constants';
import { cx, formatarData } from '../lib/utils';
import { Botao, Modal, SeletorPrioridade, SeloOrigem, SeloPrioridade, TrocarOrigem, confirmar, notificar } from './ui';
import { ErroForm } from './ErroForm';

export async function excluirComConfirmacao(e: Erro): Promise<boolean> {
  const ok = await confirmar({
    titulo: 'Excluir este erro?',
    texto: <>O registro <strong className="text-ink">“{e.descricao.slice(0, 80)}{e.descricao.length > 80 ? '…' : ''}”</strong> será apagado de vez. Se você já domina o conteúdo, prefira marcar como <strong className="text-ok">Superado</strong> para manter o histórico.</>,
    botao: 'Excluir', perigo: true,
  });
  if (ok) { acoes.excluirErro(e.id); notificar('Registro excluído.'); }
  return ok;
}

export function nomeMateria(materias: { id: string; nome: string }[], id: string) {
  return materias.find((m) => m.id === id)?.nome ?? 'Matéria removida';
}

function Bloco({ titulo, icone, children, cor }: { titulo: string; icone: React.ReactNode; children: React.ReactNode; cor?: string }) {
  return (
    <div className="rounded-2xl bg-page p-4">
      <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: cor ?? 'var(--plum)' }}>{icone}{titulo}</p>
      <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

const ROTULO_CAMPO: Record<string, string> = { prioridade: 'Prioridade', origem: 'Origem', criado: 'Registrado', revisao: 'Revisão', edicao: 'Editado' };
function nomeValor(campo: string, v: string | null | undefined) {
  if (campo === 'prioridade' || campo === 'criado' || campo === 'revisao') return v ? PRIO[v as keyof typeof PRIO]?.curto ?? v : '—';
  if (campo === 'origem') return origemInfo((v ?? null) as never).nome;
  return '';
}

export function DetalhesErro({ erro, onEditar }: { erro: Erro; onEditar?: () => void }) {
  const { materias } = useEstado();
  const historico = [...erro.historico].reverse().slice(0, 12);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SeloPrioridade p={erro.prioridade} grande />
        <TrocarOrigem valor={erro.origem} onChange={(o) => { acoes.definirOrigem(erro.id, o); notificar('Origem atualizada.'); }} />
      </div>
      <p className="text-sm text-muted"><strong className="text-plum">{nomeMateria(materias, erro.materiaId)}</strong> · {erro.topico}</p>
      <Bloco titulo="O erro" icone={<span className="h-2 w-2 rounded-full bg-alta" />}>{erro.descricao}</Bloco>
      <Bloco titulo="Correção" icone={<span className="h-2 w-2 rounded-full bg-ok" />} cor="var(--ok)">{erro.correcao}</Bloco>
      {erro.comoEvitar && <Bloco titulo="Como evitar" icone={<Lightbulb size={14} />} cor="var(--media)">{erro.comoEvitar}</Bloco>}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> Registrado em <strong className="num text-ink">{formatarData(erro.criadoEm)}</strong></span>
        {erro.referencia && (
          <span className="inline-flex min-w-0 items-center gap-1.5"><BookMarked size={15} />
            {/^https?:\/\//.test(erro.referencia)
              ? <a href={erro.referencia} target="_blank" rel="noreferrer" className="truncate font-semibold text-violet underline">{erro.referencia}</a>
              : <strong className="break-all text-ink">{erro.referencia}</strong>}
          </span>
        )}
        {erro.revisoes > 0 && <span>Revisado {erro.revisoes}× · última em <strong className="num text-ink">{formatarData(erro.ultimaRevisao)}</strong></span>}
      </div>
      <div>
        <p className="rotulo">Alterar prioridade</p>
        <SeletorPrioridade compacto valor={erro.prioridade} onChange={(p) => { acoes.definirPrioridade(erro.id, p); notificar(`Classificado como ${PRIO[p].curto.toLowerCase()}.`); }} />
      </div>
      {historico.length > 0 && (
        <details className="rounded-2xl border border-line p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-plum"><History size={15} /> Histórico de alterações</summary>
          <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-muted">
            {historico.map((h, i) => (
              <li key={i} className="flex flex-wrap gap-x-2">
                <span className="num font-semibold text-ink">{formatarData(h.em)}</span>
                <span>{ROTULO_CAMPO[h.campo]}</span>
                {h.campo === 'criado' && <span>como {nomeValor('criado', h.para)}</span>}
                {(h.campo === 'prioridade' || h.campo === 'origem') && <span>{nomeValor(h.campo, h.de)} → {nomeValor(h.campo, h.para)}</span>}
                {h.campo === 'revisao' && <span>· decidiu: {nomeValor('revisao', h.para)}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {onEditar && (
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Botao variante="fantasma" className="text-alta hover:bg-[var(--alta-bg)] hover:text-alta" onClick={() => void excluirComConfirmacao(erro)}><Trash2 size={16} /> Excluir</Botao>
          <Botao variante="primario" onClick={onEditar}><Pencil size={16} /> Editar registro</Botao>
        </div>
      )}
    </div>
  );
}

export function ErroCard({ erro, mostrarMateria = true }: { erro: Erro; mostrarMateria?: boolean }) {
  const { materias } = useEstado();
  const [modo, setModo] = useState<'nada' | 'ver' | 'editar'>('nada');
  const atual = useEstado().erros.find((e) => e.id === erro.id) ?? erro;
  const info = PRIO[atual.prioridade];
  return (
    <article className="card anim-subir relative flex flex-col gap-3 overflow-visible p-4 pl-5 sm:p-5 sm:pl-6">
      <span className="absolute bottom-4 left-0 top-4 w-1.5 rounded-r-full" style={{ background: info.cor }} aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
        {mostrarMateria && <span className="font-bold text-plum">{nomeMateria(materias, atual.materiaId)}</span>}
        {mostrarMateria && <span aria-hidden="true">›</span>}
        <span className="font-semibold">{atual.topico}</span>
        <span className="num ml-auto text-xs">{formatarData(atual.criadoEm)}</span>
      </div>
      <button type="button" onClick={() => setModo('ver')} className="text-left">
        <p className="line-clamp-3 text-[15px] font-medium leading-relaxed text-ink hover:text-violet">{atual.descricao}</p>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <SeletorPrioridade compacto valor={atual.prioridade} onChange={(p) => { acoes.definirPrioridade(atual.id, p); notificar(`Classificado como ${PRIO[p].curto.toLowerCase()}.`); }} />
        <TrocarOrigem valor={atual.origem} onChange={(o) => { acoes.definirOrigem(atual.id, o); notificar('Origem atualizada.'); }} />
        <div className="ml-auto flex gap-1">
          <button type="button" title="Ver detalhes" aria-label="Ver detalhes" onClick={() => setModo('ver')} className="rounded-full p-2 text-muted transition hover:bg-lilac hover:text-violet"><Eye size={17} /></button>
          <button type="button" title="Editar" aria-label="Editar" onClick={() => setModo('editar')} className="rounded-full p-2 text-muted transition hover:bg-lilac hover:text-violet"><Pencil size={17} /></button>
          <button type="button" title="Excluir" aria-label="Excluir" onClick={() => void excluirComConfirmacao(atual)} className="rounded-full p-2 text-muted transition hover:bg-[var(--alta-bg)] hover:text-alta"><Trash2 size={17} /></button>
        </div>
      </div>
      <Modal aberto={modo === 'ver'} onFechar={() => setModo('nada')} titulo="Detalhes do erro">
        <DetalhesErro erro={atual} onEditar={() => setModo('editar')} />
      </Modal>
      <Modal aberto={modo === 'editar'} onFechar={() => setModo('nada')} titulo="Editar erro" largura="max-w-3xl">
        <ErroForm inicial={atual} onSalvo={() => setModo('nada')} onCancelar={() => setModo('nada')} />
      </Modal>
    </article>
  );
}

export function LinhaErro({ erro }: { erro: Erro }) {
  const { materias } = useEstado();
  const [ver, setVer] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setVer(true)} className={cx('flex w-full min-w-0 items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-page')}>
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PRIO[erro.prioridade].cor }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-ink">{erro.descricao}</span>
          <span className="block truncate text-xs text-muted">{nomeMateria(materias, erro.materiaId)} · {erro.topico} · <span className="num">{formatarData(erro.criadoEm)}</span></span>
        </span>
        <span className="hidden shrink-0 sm:block"><SeloOrigem o={erro.origem} /></span>
      </button>
      <Modal aberto={ver} onFechar={() => setVer(false)} titulo="Detalhes do erro">
        <DetalhesErro erro={erro} />
      </Modal>
    </>
  );
}
