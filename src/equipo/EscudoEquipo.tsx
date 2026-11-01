// Escudo sencillo del equipo: una forma con sus letras, en el color del equipo. Se dibuja con SVG, sin imágenes.
import { colorLegible, escudoPorDefecto, type Escudo } from './modelo';

const FORMAS: Record<Escudo['forma'], string> = {
  redondo: 'M50 4a46 46 0 1 0 0 92a46 46 0 1 0 0-92z',
  escudo: 'M12 8h76v46c0 20-18 33-38 40C30 87 12 74 12 54z',
  rombo: 'M50 3L97 50L50 97L3 50z',
};

export function EscudoEquipo({ nombre, escudo, color, tam = 40 }: { nombre: string; escudo?: Escudo; color?: string; tam?: number }) {
  const e = escudo ?? escudoPorDefecto(nombre);
  const fondo = colorLegible(color ?? '#f2b134');
  return (
    <svg className="escudo-equipo" width={tam} height={tam} viewBox="0 0 100 100" role="img" aria-label={`Escudo de ${nombre}`}>
      <path d={FORMAS[e.forma]} fill={fondo} stroke="rgba(0,0,0,.45)" strokeWidth="4" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontFamily="Graduate, Georgia, serif" fontSize={e.letras.length > 2 ? 30 : 38} fontWeight="700" fill="#111">{e.letras}</text>
    </svg>
  );
}
