import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Erro } from '../lib/types';
import { ErroForm } from '../components/ErroForm';
import { CabecalhoPagina } from '../components/ui';
import { formatarData } from '../lib/utils';

export function Registrar() {
  const [ultimo, setUltimo] = useState<Erro | null>(null);
  return (
    <div>
      <CabecalhoPagina titulo="Registrar novo erro" sub="Anote o erro enquanto ele está fresco. Leva um minuto e evita que ele se repita na prova." />
      {ultimo && (
        <div className="anim-surgir mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--ok-bg)] px-4 py-3 text-sm font-semibold text-ok">
          <CheckCircle2 size={18} /> Registro de {formatarData(ultimo.criadoEm)} salvo. O formulário está pronto para o próximo.
          <a href="#erros" className="ml-auto font-bold underline">Ver em Meus erros</a>
        </div>
      )}
      <div className="card p-5 sm:p-8">
        <ErroForm onSalvo={(e) => { if (e) { setUltimo(e); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} />
      </div>
    </div>
  );
}
