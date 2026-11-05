import { useMemo, useState } from 'react';
import { Save, Plus } from 'lucide-react';
import type { Erro, Origem, Prioridade } from '../lib/types';
import { acoes, useEstado, type NovoErro } from '../lib/store';
import { cx, hojeISO, normalizar } from '../lib/utils';
import { Botao, SeletorOrigem, SeletorPrioridade, notificar } from './ui';

const NOVA = '__nova__';
const CHAVE_ULTIMA = 'caderno-erros:ultima-materia';

function ultimaMateria(): string {
  try { return localStorage.getItem(CHAVE_ULTIMA) ?? ''; } catch { return ''; }
}

type Campos = 'materia' | 'topico' | 'descricao' | 'correcao' | 'origem' | 'prioridade' | 'data';

export function ErroForm({ inicial, onSalvo, onCancelar }: { inicial?: Erro; onSalvo?: (e?: Erro) => void; onCancelar?: () => void }) {
  const { materias } = useEstado();
  const [materiaId, setMateriaId] = useState(() => inicial?.materiaId ?? (materias.some((m) => m.id === ultimaMateria()) ? ultimaMateria() : ''));
  const [novaMateria, setNovaMateria] = useState('');
  const [topico, setTopico] = useState(inicial?.topico ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [correcao, setCorrecao] = useState(inicial?.correcao ?? '');
  const [comoEvitar, setComoEvitar] = useState(inicial?.comoEvitar ?? '');
  const [origem, setOrigem] = useState<Origem | null>(inicial?.origem ?? null);
  const [prioridade, setPrioridade] = useState<Prioridade | null>(inicial?.prioridade ?? null);
  const [referencia, setReferencia] = useState(inicial?.referencia ?? '');
  const [data, setData] = useState(inicial?.criadoEm ?? hojeISO());
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({});

  const topicosDaMateria = useMemo(() => materias.find((m) => m.id === materiaId)?.topicos ?? [], [materias, materiaId]);

  function validar(): Partial<Record<Campos, string>> {
    const e: Partial<Record<Campos, string>> = {};
    if (!materiaId || (materiaId === NOVA && !novaMateria.trim())) e.materia = 'Escolha ou digite a matéria.';
    if (!topico.trim()) e.topico = 'Informe o tópico.';
    if (!descricao.trim()) e.descricao = 'Descreva o erro.';
    if (!correcao.trim()) e.correcao = 'Escreva o entendimento correto.';
    // registros antigos "Não classificado" podem ser salvos sem origem até a Tais decidir
    if (!origem && !(inicial && inicial.origem === null)) e.origem = 'Escolha a origem do erro.';
    if (!prioridade) e.prioridade = 'Escolha a classificação.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) e.data = 'Informe a data.';
    return e;
  }

  function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validar();
    setErros(e);
    if (Object.keys(e).length) {
      notificar('Preencha os campos destacados para salvar.', 'erro');
      const primeiro = document.querySelector('[data-campo-erro="true"]');
      primeiro?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const mid = materiaId === NOVA ? acoes.adicionarMateria(novaMateria).id : materiaId;
    const materia = materias.find((m) => m.id === mid);
    const topicoFinal = materia?.topicos.find((t) => normalizar(t) === normalizar(topico)) ?? topico.trim().replace(/\s+/g, ' ');
    const dados: NovoErro = {
      materiaId: mid, topico: topicoFinal, descricao: descricao.trim(), correcao: correcao.trim(), comoEvitar: comoEvitar.trim(),
      origem, prioridade: prioridade!, referencia: referencia.trim(), criadoEm: data,
    };
    try { localStorage.setItem(CHAVE_ULTIMA, mid); } catch { /* opcional */ }
    if (inicial) {
      acoes.editarErro(inicial.id, dados);
      notificar('Alterações salvas.');
      onSalvo?.();
    } else {
      const novo = acoes.adicionarErro(dados);
      notificar('Erro registrado. Agora ele vira aprendizado.');
      setTopico(''); setDescricao(''); setCorrecao(''); setComoEvitar(''); setOrigem(null); setPrioridade(null); setReferencia(''); setData(hojeISO());
      setMateriaId(mid); setNovaMateria(''); setErros({});
      onSalvo?.(novo);
    }
  }

  const aviso = (c: Campos) => erros[c] && <p className="mt-1.5 text-[13px] font-semibold text-alta">{erros[c]}</p>;

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div data-campo-erro={!!erros.materia}>
          <label className="rotulo" htmlFor="f-materia">1. Matéria</label>
          <select id="f-materia" className={cx('campo', erros.materia && 'invalido')} value={materiaId} onChange={(e) => { setMateriaId(e.target.value); setErros((x) => ({ ...x, materia: undefined })); }}>
            <option value="">Selecione a matéria…</option>
            {materias.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            <option value={NOVA}>+ Adicionar nova matéria</option>
          </select>
          {materiaId === NOVA && (
            <input id="f-nova-materia" className="campo mt-2" placeholder="Nome da nova matéria (ex.: Direito Civil)" value={novaMateria} onChange={(e) => setNovaMateria(e.target.value)} autoFocus />
          )}
          {aviso('materia')}
        </div>
        <div data-campo-erro={!!erros.topico}>
          <label className="rotulo" htmlFor="f-topico">2. Tópico</label>
          <input id="f-topico" className={cx('campo', erros.topico && 'invalido')} placeholder="Ex.: Atos administrativos" list="f-topicos" value={topico} onChange={(e) => { setTopico(e.target.value); setErros((x) => ({ ...x, topico: undefined })); }} />
          <datalist id="f-topicos">{topicosDaMateria.map((t) => <option key={t} value={t} />)}</datalist>
          {topicosDaMateria.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topicosDaMateria.slice(0, 12).map((t) => (
                <button key={t} type="button" onClick={() => { setTopico(t); setErros((x) => ({ ...x, topico: undefined })); }}
                  className={cx('rounded-full px-2.5 py-1 text-xs font-semibold transition', normalizar(t) === normalizar(topico) ? 'bg-violet text-white' : 'bg-lilac text-plum hover:bg-[#e5d9fa]')}>
                  {t}
                </button>
              ))}
            </div>
          )}
          {aviso('topico')}
        </div>
      </div>

      <div data-campo-erro={!!erros.descricao}>
        <label className="rotulo" htmlFor="f-descricao">3. Descrição do erro</label>
        <textarea id="f-descricao" className={cx('campo', erros.descricao && 'invalido')} placeholder="O que eu respondi e por que estava errado?" value={descricao} onChange={(e) => { setDescricao(e.target.value); setErros((x) => ({ ...x, descricao: undefined })); }} />
        {aviso('descricao')}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div data-campo-erro={!!erros.correcao}>
          <label className="rotulo" htmlFor="f-correcao">4. Correção / entendimento correto</label>
          <textarea id="f-correcao" className={cx('campo', erros.correcao && 'invalido')} placeholder="Qual é a regra, o conceito ou a resposta certa?" value={correcao} onChange={(e) => { setCorrecao(e.target.value); setErros((x) => ({ ...x, correcao: undefined })); }} />
          {aviso('correcao')}
        </div>
        <div>
          <label className="rotulo" htmlFor="f-evitar">5. Como evitar esse erro novamente?</label>
          <textarea id="f-evitar" className="campo" placeholder="Macete, alerta ou palavra-chave que denuncia a pegadinha" value={comoEvitar} onChange={(e) => setComoEvitar(e.target.value)} />
        </div>
      </div>

      <div data-campo-erro={!!erros.origem}>
        <span className="rotulo">Qual foi a origem do meu erro? <span className="text-alta">*</span></span>
        <SeletorOrigem valor={origem} onChange={(o) => { setOrigem(o); setErros((x) => ({ ...x, origem: undefined })); }} erro={!!erros.origem} />
        {aviso('origem')}
      </div>

      <div data-campo-erro={!!erros.prioridade}>
        <span className="rotulo">6. Classificação de prioridade <span className="text-alta">*</span></span>
        <SeletorPrioridade valor={prioridade} onChange={(p) => { setPrioridade(p); setErros((x) => ({ ...x, prioridade: undefined })); }} erro={!!erros.prioridade} />
        {aviso('prioridade')}
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_220px]">
        <div>
          <label className="rotulo" htmlFor="f-ref">7. Questão de referência <span className="font-medium normal-case tracking-normal text-muted">(opcional)</span></label>
          <input id="f-ref" className="campo" placeholder="Nº da questão, banca ou link (ex.: Q123456 · VUNESP 2023)" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </div>
        <div data-campo-erro={!!erros.data}>
          <label className="rotulo" htmlFor="f-data">8. Data do registro</label>
          <input id="f-data" type="date" className={cx('campo num', erros.data && 'invalido')} value={data} max={hojeISO()} onChange={(e) => setData(e.target.value)} />
          {aviso('data')}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        {onCancelar && <Botao variante="fantasma" onClick={onCancelar}>Cancelar</Botao>}
        <Botao type="submit" variante="primario" className="px-7 py-3 text-[15px] tracking-wide">
          {inicial ? <Save size={18} /> : <Plus size={18} />}
          {inicial ? 'SALVAR ALTERAÇÕES' : 'SALVAR ERRO'}
        </Botao>
      </div>
    </form>
  );
}
