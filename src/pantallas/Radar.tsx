// Radar del equipo (vuelta 5): una punta por habilidad con nivel de 1 a 5. Sin nombres de jugadoras: se puede compartir.
import type { HabilidadEquipo } from '../habilidades/habilidades';

const MAX_PUNTAS = 8;

/** Punto del radar a un ángulo (0 = arriba) y a una distancia de 0 a 1 del centro. */
export function punto(i: number, n: number, radio: number, c = 100): [number, number] {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [c + Math.cos(a) * radio * 80, c + Math.sin(a) * radio * 80];
}

/** Las habilidades con nivel, las que se dibujan (3 como mínimo). */
export const conNivel = (hs: HabilidadEquipo[]) => hs.filter((h) => h.nivel !== undefined).slice(0, MAX_PUNTAS);

export function Radar({ habilidades }: { habilidades: HabilidadEquipo[] }) {
  const hs = conNivel(habilidades);
  if (hs.length < 3) return <p className="vacio">Pon nivel (1 a 5) a tres habilidades o más para ver el radar del equipo.</p>;
  const n = hs.length;
  const poligono = (r: (i: number) => number) => hs.map((_, i) => punto(i, n, r(i)).map((v) => v.toFixed(1)).join(',')).join(' ');
  return (
    <figure className="radar">
      <svg viewBox="-45 0 290 200" role="img" aria-label={`Radar del equipo: ${hs.map((h) => `${h.nombre} ${h.nivel}`).join(', ')}`}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((r) => <polygon key={r} points={poligono(() => r)} fill="none" stroke="currentColor" strokeOpacity="0.2" />)}
        {hs.map((_, i) => { const [x, y] = punto(i, n, 1); return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="currentColor" strokeOpacity="0.2" />; })}
        <polygon points={poligono((i) => (hs[i].nivel ?? 0) / 5)} fill="var(--principal)" fillOpacity="0.35" stroke="var(--principal)" strokeWidth="2" />
        {hs.map((h, i) => { const [x, y] = punto(i, n, 1.2); return <text key={h.id} x={x} y={y} fontSize="8" textAnchor="middle" fill="currentColor" dominantBaseline="middle">{h.nombre.length > 14 ? `${h.nombre.slice(0, 13)}…` : h.nombre}</text>; })}
      </svg>
    </figure>
  );
}
