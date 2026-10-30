// Media pista con los cinco atacantes y el balón. Se pinta con los colores del tema (variables CSS).
import type { Punto, Sistema } from '../sistemas/tipos';
import { numerosActivos, type Numeros } from '../diario/puestos';
import { defensa, enCamino, foto, inicios, JUGADORES, pasoDe } from './animar';

/** El jugador acaba encima del final de su flecha: se recorta para que la punta quede a la vista. */
const HUECO = 9;
function recorta(desde: Punto, a: Punto): Punto {
  const d = Math.hypot(a[0] - desde[0], a[1] - desde[1]) || 1;
  const k = Math.max(0, d - HUECO) / d;
  return [desde[0] + (a[0] - desde[0]) * k, desde[1] + (a[1] - desde[1]) * k];
}

const camino = (de: Punto, a: Punto, por?: Punto) =>
  por ? `M${de[0]} ${de[1]}Q${por[0]} ${por[1]} ${a[0]} ${a[1]}` : `M${de[0]} ${de[1]}L${a[0]} ${a[1]}`;

/** Línea en zigzag para los botes, siguiendo la misma curva que el jugador. */
function onda(de: Punto, a: Punto, por?: Punto): string {
  const n = 28;
  const puntos: string[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const [x, y] = enCamino(de, a, k, por);
    const [x2, y2] = enCamino(de, a, Math.min(1, k + 0.01), por);
    const largo = Math.hypot(x2 - x, y2 - y) || 1;
    // Se apaga al final para que la punta de la flecha quede limpia.
    const amp = i === 0 || i >= n - 2 ? 0 : 1.7 * (i % 2 ? 1 : -1);
    puntos.push(`${(x - ((y2 - y) / largo) * amp).toFixed(1)} ${(y + ((x2 - x) / largo) * amp).toFixed(1)}`);
  }
  return 'M' + puntos.join('L');
}

/** Remate de la flecha: punta para cortes, botes y pases; barra en T para los bloqueos. */
function remate(desde: Punto, a: Punto, bloqueo: boolean) {
  const ang = Math.atan2(a[1] - desde[1], a[0] - desde[0]);
  const p = (d: number, g: number): Punto => [a[0] + Math.cos(ang + g) * d, a[1] + Math.sin(ang + g) * d];
  if (bloqueo) {
    const [x1, y1] = p(5, Math.PI / 2);
    const [x2, y2] = p(5, -Math.PI / 2);
    return `M${x1} ${y1}L${x2} ${y2}`;
  }
  const [x1, y1] = p(-5, 0.5);
  const [x2, y2] = p(-5, -0.5);
  return `M${x1} ${y1}L${a[0]} ${a[1]}L${x2} ${y2}`;
}

/** `numeros`: lo que sale en cada círculo. Sin él, los dorsales del equipo elegido (salvo en ejercicios, donde 1–5 no son puestos); null = 1–5. */
export function Pista({ sistema, t, alto = 140, conDefensa = false, numeros }: { sistema: Sistema; t: number; alto?: number; conDefensa?: boolean; numeros?: Numeros | null }) {
  const etiqueta = (numeros === undefined ? (sistema.visibles ? null : numerosActivos()) : numeros) ?? undefined;
  const f = foto(sistema, t);
  const d = conDefensa ? defensa(sistema, t) : null;
  const i = pasoDe(t, sistema.pasos.length);
  const antes = inicios(sistema)[i].pos;
  const y0 = (alto - 140) / 2;
  // En un ejercicio (2x0, 3x3…) solo salen sus jugadores.
  const quienes = sistema.visibles ?? JUGADORES;

  return (
    <svg className="pista" viewBox={`0 0 150 ${alto}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${sistema.nombre}, paso ${i + 1}`}>
      <rect className="suelo" width="150" height={alto} />
      <g transform={`translate(0 ${y0})`}>
        <rect className="zona" x="50.5" y="0" width="49" height="58" />
        <path className="linea" d="M0 .6H150M50.5 0V58H99.5V0M57 58a18 18 0 0 0 36 0M9 0V26A67.5 67.5 0 0 0 141 26V0M0 139.4H150" />
        <circle className="linea" cx="75" cy="12" r="2.3" />
        <path className="linea" d="M66 9H84" />
        {sistema.pasos[i].movimientos.map((m, n) => {
          if (m.tipo === 'pase') {
            const de = antes[m.de];
            const a = recorta(de, antes[m.a]);
            return (
              <g key={n} className="flecha pase">
                <path d={camino(de, a)} />
                <path d={remate(de, a, false)} />
              </g>
            );
          }
          const de = antes[m.jugador];
          const a = recorta(m.por ?? de, m.a);
          return (
            <g key={n} className={`flecha ${m.tipo}`}>
              <path d={m.tipo === 'bote' ? onda(de, a, m.por) : camino(de, a, m.por)} />
              <path d={remate(m.por ?? de, a, m.tipo === 'bloqueo')} />
            </g>
          );
        })}
        {d &&
          quienes.map((j) => (
            <path key={'x' + j} className="defensor" transform={`translate(${d[j][0]} ${d[j][1]})`} d="M-4 -4L4 4M4 -4L-4 4" />
          ))}
        {quienes.map((j) => {
          const [x, y] = f.jugadores[j];
          return (
            <g key={j} className="jugador" transform={`translate(${x} ${y})`}>
              <circle r="7" />
              <text style={(etiqueta?.[j] ?? j).length > 1 ? { fontSize: 5.4 } : undefined}>{etiqueta?.[j] ?? j}</text>
            </g>
          );
        })}
        {/* Vista desde arriba: al subir, el balón se separa de su sombra y se ve un poco más grande. */}
        {!sistema.sinBalon && (
          <>
            <ellipse className="sombra" cx={f.balon[0] + 5} cy={f.balon[1] - 4} rx={3 - f.altura} ry={1.6 - f.altura * 0.5} />
            <circle className="balon" cx={f.balon[0] + 5} cy={f.balon[1] - 5 - f.altura * 7} r={3.2 * (1 + f.altura * 0.35)} />
          </>
        )}
      </g>
    </svg>
  );
}
