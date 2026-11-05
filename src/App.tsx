import { useEffect, useState } from 'react';
import { Layout, MENU, type Rota } from './components/Layout';
import { AvisosHost, ConfirmacaoHost } from './components/ui';
import { Dashboard } from './pages/Dashboard';
import { Registrar } from './pages/Registrar';
import { MeusErros } from './pages/MeusErros';
import { SegundoCiclo } from './pages/SegundoCiclo';
import { Evolucao } from './pages/Evolucao';
import { Materias } from './pages/Materias';
import { Backup } from './pages/Backup';
import { Carregando, Entrar } from './pages/Entrar';
import { useEstado } from './lib/store';

function rotaAtual(): Rota {
  const h = location.hash.replace('#', '') as Rota;
  return MENU.some((m) => m.id === h) ? h : 'dashboard';
}

export function App() {
  const [rota, setRota] = useState<Rota>(rotaAtual);
  // incrementa para remontar "Meus erros" quando outra tela pede um filtro
  const [visita, setVisita] = useState(0);
  useEffect(() => {
    const mudar = () => { setRota(rotaAtual()); setVisita((v) => v + 1); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', mudar);
    return () => window.removeEventListener('hashchange', mudar);
  }, []);
  useEffect(() => {
    const nome = MENU.find((m) => m.id === rota)?.nome;
    document.title = rota === 'dashboard' ? 'Caderno de Erros | Tais Elena' : `${nome} · Caderno de Erros`;
  }, [rota]);

  const { auth, carregado } = useEstado();
  if (auth === 'carregando' || (auth === 'logado' && !carregado)) return <Carregando />;
  if (auth === 'deslogado') return <><Entrar /><AvisosHost /></>;

  return (
    <>
      <Layout rota={rota}>
        <div key={rota + (rota === 'erros' ? visita : '')} className="anim-subir">
          {rota === 'dashboard' && <Dashboard />}
          {rota === 'registrar' && <Registrar />}
          {rota === 'erros' && <MeusErros />}
          {rota === 'ciclo' && <SegundoCiclo />}
          {rota === 'evolucao' && <Evolucao />}
          {rota === 'materias' && <Materias />}
          {rota === 'backup' && <Backup />}
        </div>
      </Layout>
      <ConfirmacaoHost />
      <AvisosHost />
    </>
  );
}
