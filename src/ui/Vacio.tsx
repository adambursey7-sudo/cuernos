// Estado vacío y esqueleto de carga del sistema de diseño: mismo aspecto en todas las pantallas.
import type { ReactNode } from 'react';

type Dibujo = 'balon' | 'pizarra' | 'calendario' | 'gente' | 'grafico';

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const DIBUJOS: Record<Dibujo, ReactNode> = {
  balon: <><circle cx="56" cy="42" r="28" /><path d="M28 42h56M56 14v56M36 22c8 8 8 32 0 40M76 22c-8 8-8 32 0 40" /></>,
  pizarra: <><rect x="14" y="10" width="84" height="56" rx="8" /><path d="M30 52c10-24 22-4 32-22l6-6M68 24l-9 1M68 24l-2 9M40 74h32M56 66v8" /></>,
  calendario: <><rect x="16" y="14" width="80" height="62" rx="8" /><path d="M16 32h80M36 8v12M76 8v12M34 48h8M52 48h8M70 48h8M34 62h8M52 62h8" /></>,
  gente: <><circle cx="42" cy="30" r="12" /><path d="M16 74c2-16 12-24 26-24s24 8 26 24" /><circle cx="78" cy="34" r="9" /><path d="M76 52c14-2 20 6 22 20" /></>,
  grafico: <><path d="M16 74h84M24 74V50M44 74V34M64 74V44M84 74V20" /><path d="M24 40l20-12 20 8 20-22" /></>,
};

/** Cuando no hay nada que mostrar: dibujo, qué falta y un botón con lo siguiente que hacer. */
export function Vacio({ dibujo, titulo, texto, accion, alPulsar }: { dibujo: Dibujo; titulo: string; texto?: string; accion?: string; alPulsar?: () => void }) {
  return (
    <div className="vacio-pro" role="status">
      <svg viewBox="0 0 112 84" aria-hidden="true" {...trazo}>{DIBUJOS[dibujo]}</svg>
      <b>{titulo}</b>
      {texto && <p>{texto}</p>}
      {accion && alPulsar && <button className="principal" onClick={alPulsar}>{accion}</button>}
    </div>
  );
}

/** Lo que se ve mientras carga una pantalla pesada. */
export function Esqueleto() {
  return <div className="esq" aria-busy="true" aria-label="Cargando"><i /><i /><i /><i /></div>;
}
