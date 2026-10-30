// Pizarra grande de un ejercicio: se mueve sola al abrirse (salvo con «reducir movimiento»), con Atrás / Ver / Siguiente
// y, si se pide, los pasos debajo con el que se está viendo resaltado.
import { useEffect } from 'react';
import type { Sistema } from '../sistemas/tipos';
import { Pista } from './Pista';
import { useJugada } from './useJugada';

const sinMovimiento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function PizarraGrande({ sistema, conPasos = false }: { sistema: Sistema; conPasos?: boolean }) {
  const total = sistema.pasos.length;
  const jugada = useJugada(total);
  useEffect(() => {
    if (!sinMovimiento()) jugada.todo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div className="pizarra"><Pista sistema={sistema} t={jugada.t} /></div>
      <div className="mandos">
        <button onClick={() => jugada.anterior()} disabled={jugada.t <= 1}>Atrás</button>
        <button onClick={() => jugada.todo()}>▶ Ver</button>
        <button onClick={() => jugada.siguiente()} disabled={jugada.t >= total}>Siguiente</button>
      </div>
      {conPasos && (
        <ol className="pasos-borrador">
          {sistema.pasos.map((p, i) => <li key={i} className={i === jugada.paso ? 'on' : ''}>{p.texto}</li>)}
        </ol>
      )}
    </>
  );
}
