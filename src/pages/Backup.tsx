import { useRef, useState } from 'react';
import { Cloud, Download, FileJson, LogOut, Trash2, Upload } from 'lucide-react';
import { acoes, getEstado, limparCopiaLocal, useEstado } from '../lib/store';
import { sair } from '../lib/firebase';
import { gerarBackup, lerBackup, mesclar, type ResultadoImportacao } from '../lib/backup';
import { MATERIAS_INICIAIS } from '../lib/constants';
import { formatarData, hojeISO, plural } from '../lib/utils';
import { Botao, CabecalhoPagina, confirmar, notificar } from '../components/ui';

export function Backup() {
  const { erros, materias, sync, syncMsg, ultimaSync, usuario } = useEstado();
  const [colado, setColado] = useState('');
  const [previa, setPrevia] = useState<ResultadoImportacao | null>(null);
  const [erroImport, setErroImport] = useState('');
  const arquivo = useRef<HTMLInputElement>(null);

  function exportar() {
    const texto = JSON.stringify(gerarBackup(getEstado()), null, 2);
    const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `caderno-de-erros-tais-elena-${hojeISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notificar('Backup exportado.');
  }

  async function sairDaConta() {
    const ok = await confirmar({
      titulo: 'Sair da conta?',
      texto: 'Os dados continuam salvos na nuvem. A cópia deste aparelho é apagada; ao entrar de novo, tudo é baixado outra vez.',
      botao: 'Sair',
    });
    if (!ok) return;
    limparCopiaLocal();
    await sair();
    location.reload();
  }

  function analisar(texto: string) {
    setErroImport(''); setPrevia(null);
    let bruto: unknown;
    try { bruto = JSON.parse(texto); } catch { setErroImport('O conteúdo não é um JSON válido. Confira se o arquivo é o backup exportado por este caderno.'); return; }
    try { setPrevia(lerBackup(bruto)); } catch (e) { setErroImport((e as Error).message); }
  }

  function lerArquivo(f: File | undefined) {
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { setErroImport('Arquivo grande demais para um backup do caderno.'); return; }
    const r = new FileReader();
    r.onload = () => analisar(String(r.result ?? ''));
    r.onerror = () => setErroImport('Não foi possível ler o arquivo.');
    r.readAsText(f);
  }

  async function aplicar(modo: 'mesclar' | 'substituir') {
    if (!previa) return;
    if (modo === 'substituir') {
      const ok = await confirmar({
        titulo: 'Substituir todos os dados?',
        texto: <>Os {plural(erros.length, 'registro atual', 'registros atuais')} serão trocados pelos {plural(previa.data.erros.length, 'registro', 'registros')} do backup. Esta ação não pode ser desfeita.</>,
        botao: 'Substituir', perigo: true,
      });
      if (!ok) return;
      acoes.substituirTudo(previa.data);
    } else {
      acoes.substituirTudo(mesclar(getEstado(), previa.data));
    }
    notificar(`Backup importado: ${plural(previa.data.erros.length, 'registro', 'registros')}.`);
    previa.avisos.forEach((a) => notificar(a, 'erro'));
    setPrevia(null); setColado('');
    if (arquivo.current) arquivo.current.value = '';
  }

  async function apagarTudo() {
    const ok = await confirmar({
      titulo: 'Apagar todos os dados?',
      texto: <>Todos os {plural(erros.length, 'erro', 'erros')} e matérias serão apagados deste aparelho e da nuvem. Exporte um backup antes se quiser guardar uma cópia.</>,
      botao: 'Apagar tudo', perigo: true,
    });
    if (ok) { acoes.substituirTudo({ erros: [], materias: MATERIAS_INICIAIS.map((m) => ({ ...m, topicos: [...m.topicos] })) }); notificar('Dados apagados.'); }
  }

  const sincronizada = sync === 'sincronizado' || sync === 'enviando';

  return (
    <div className="flex flex-col gap-5">
      <CabecalhoPagina titulo="Backup e configurações" sub="Seus registros ficam salvos neste aparelho e na sua conta. Exporte um backup de vez em quando por segurança." />

      <section className="card flex gap-4 p-5 sm:p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: sincronizada ? 'var(--ok-bg)' : 'var(--media-bg)', color: sincronizada ? 'var(--ok)' : '#a26f00' }}><Cloud size={22} /></span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-plum">Sincronização</h2>
          <p className="text-sm text-ink">{syncMsg}{ultimaSync && sync === 'sincronizado' ? ` · ${new Date(ultimaSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
          <p className="mt-1 text-sm text-muted">Entre com a mesma conta Google em qualquer aparelho para ver os mesmos registros. Sem internet, tudo continua salvo neste aparelho e é enviado quando a conexão volta.</p>
        </div>
      </section>

      {usuario && (
        <section className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
          {usuario.foto
            ? <img src={usuario.foto} alt="" referrerPolicy="no-referrer" className="h-11 w-11 rounded-full" />
            : <span className="grid h-11 w-11 place-items-center rounded-full bg-lilac font-display font-bold text-violet">{(usuario.nome || usuario.email).slice(0, 1).toUpperCase()}</span>}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-plum">Conta</h2>
            <p className="truncate text-sm text-ink">{usuario.nome && <>{usuario.nome} · </>}{usuario.email}</p>
          </div>
          <Botao variante="fantasma" onClick={() => void sairDaConta()}><LogOut size={16} /> Sair</Botao>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-plum"><Download size={19} /> Exportar backup</h2>
          <p className="text-sm text-muted">Gera um arquivo JSON com {plural(erros.length, 'erro', 'erros')}, {plural(materias.length, 'matéria', 'matérias')}, tópicos, classificações, origens, datas e histórico.</p>
          <Botao variante="primario" onClick={exportar} className="w-fit"><FileJson size={17} /> Exportar JSON</Botao>
        </div>

        <div className="card flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-plum"><Upload size={19} /> Importar backup</h2>
          <p className="text-sm text-muted">Escolha um arquivo .json exportado por este caderno ou cole o conteúdo. Registros sem origem entram como “Não classificado”.</p>
          <input ref={arquivo} id="arquivo-backup" type="file" accept="application/json,.json" className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-lilac file:px-4 file:py-2 file:font-semibold file:text-plum" onChange={(e) => lerArquivo(e.target.files?.[0])} />
          <textarea id="json-colado" className="campo font-mono text-xs" placeholder="…ou cole aqui o conteúdo do backup" value={colado} onChange={(e) => setColado(e.target.value)} />
          {colado.trim() && <Botao onClick={() => analisar(colado)} className="w-fit">Verificar conteúdo</Botao>}
          {erroImport && <p className="rounded-2xl bg-[var(--alta-bg)] px-4 py-3 text-sm font-semibold text-alta">{erroImport}</p>}
          {previa && (
            <div className="anim-surgir flex flex-col gap-3 rounded-2xl bg-page p-4">
              <p className="text-sm text-ink">Backup válido: <strong>{plural(previa.data.erros.length, 'erro', 'erros')}</strong> em <strong>{plural(previa.data.materias.length, 'matéria', 'matérias')}</strong>
                {previa.data.erros.length > 0 && <> · de {formatarData([...previa.data.erros].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))[0].criadoEm)}</>}.
              </p>
              {previa.avisos.map((a) => <p key={a} className="text-xs font-semibold text-[#a26f00]">{a}</p>)}
              <div className="flex flex-wrap gap-2">
                <Botao variante="primario" onClick={() => void aplicar('mesclar')}>Juntar com os atuais</Botao>
                <Botao variante="perigo" onClick={() => void aplicar('substituir')}>Substituir tudo</Botao>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-plum">Apagar todos os dados</h2>
          <p className="text-sm text-muted">Remove todos os registros deste aparelho e da nuvem e restaura as matérias iniciais.</p>
        </div>
        <Botao variante="fantasma" className="text-alta hover:bg-[var(--alta-bg)] hover:text-alta" onClick={() => void apagarTudo()} disabled={!erros.length}><Trash2 size={16} /> Apagar tudo</Botao>
      </section>
    </div>
  );
}
