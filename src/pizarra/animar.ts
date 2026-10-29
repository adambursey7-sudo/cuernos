// Motor de la pizarra: dónde está cada jugador y el balón en cualquier momento de la jugada.
// `t` va de 0 (antes del paso 1) a pasos.length (todo hecho): t = 2 es «paso 2 acabado», t = 2,5 es la mitad del paso 3.
import type { Jugador, Movimiento, Punto, Sistema } from '../sistemas/tipos';

export interface Foto {
  jugadores: Record<Jugador, Punto>;
  balon: Punto;
  /** Altura del balón de 0 (suelo) a 1 (lo más alto de un pase); en los botes sube y baja. */
  altura: number;
  /** Quién tiene el balón al acabar el paso en curso. */
  conBalon: Jugador;
}

const JUGADORES: Jugador[] = ['1', '2', '3', '4', '5'];

/** Punto de una curva cuadrática (o recta si no hay `por`). */
export function enCamino(de: Punto, a: Punto, k: number, por?: Punto): Punto {
  if (!por) return [de[0] + (a[0] - de[0]) * k, de[1] + (a[1] - de[1]) * k];
  const u = 1 - k;
  return [
    u * u * de[0] + 2 * u * k * por[0] + k * k * a[0],
    u * u * de[1] + 2 * u * k * por[1] + k * k * a[1],
  ];
}

/** Índice (desde 0) del paso que se está viendo en el momento t. */
export const pasoDe = (t: number, total: number) => Math.min(Math.max(Math.ceil(t) - 1, 0), total - 1);

const suave =(k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

/** Posiciones al empezar cada paso (índice i = antes del paso i; el último = jugada acabada). */
export function inicios(s: Sistema): { pos: Record<Jugador, Punto>; balon: Jugador }[] {
  const lista = [{ pos: { ...s.inicio }, balon: s.balon }];
  for (const paso of s.pasos) {
    const prev = lista[lista.length - 1];
    const pos = { ...prev.pos };
    let balon = prev.balon;
    for (const m of paso.movimientos) {
      if (m.tipo === 'pase') balon = m.a;
      else pos[m.jugador] = m.a;
    }
    lista.push({ pos, balon });
  }
  return lista;
}

export function foto(s: Sistema, t: number): Foto {
  const marcas = inicios(s);
  const total = s.pasos.length;
  const tt = Math.max(0, Math.min(total, t));
  const i = pasoDe(tt, total);
  const k = suave(Math.min(1, tt - i));
  const antes = marcas[i];
  const paso = s.pasos[i];
  const jugadores = { ...antes.pos };
  for (const m of paso?.movimientos ?? []) {
    if (m.tipo !== 'pase') jugadores[m.jugador] = enCamino(antes.pos[m.jugador], m.a, k, m.por);
  }
  // El balón va con su dueño; si hay pase, viaja del que pasa al que recibe en la segunda mitad del paso,
  // para que primero se vean los desplazamientos.
  const pase = paso?.movimientos.find((m): m is Extract<Movimiento, { tipo: 'pase' }> => m.tipo === 'pase');
  let balon = jugadores[antes.balon];
  let altura = 0;
  if (pase) {
    const kp = Math.max(0, (k - 0.5) * 2);
    balon = enCamino(jugadores[pase.de], jugadores[pase.a], kp);
    altura = kp > 0 && kp < 1 ? Math.sin(kp * Math.PI) : 0;
  } else {
    const bote = paso?.movimientos.find((m) => m.tipo === 'bote' && m.jugador === antes.balon);
    if (bote && bote.tipo === 'bote' && k > 0 && k < 1) {
      // Un bote cada 1,2 m más o menos; el balón no pasa de la cintura (0,45).
      const largo = Math.hypot(bote.a[0] - antes.pos[bote.jugador][0], bote.a[1] - antes.pos[bote.jugador][1]);
      const botes = Math.max(2, Math.round(largo / 12));
      altura = Math.abs(Math.sin(k * Math.PI * botes)) * 0.45;
    }
  }
  return { jugadores, balon, altura, conBalon: marcas[i + 1].balon };
}

const CANASTA: Punto = [75, 12];
/** Cuánto va la defensa por detrás del ataque (en pasos): así se queda atrás al chocar con un bloqueo. */
const RETRASO = 0.14;

/**
 * Defensa individual: cada X entre su atacante y la canasta. La del balón va pegada (1 m); las demás,
 * más separadas y cerradas hacia el balón para ayudar.
 */
export function defensa(s: Sistema, t: number): Record<Jugador, Punto> {
  const ahora = foto(s, t);
  const atras = foto(s, Math.max(0, t - RETRASO));
  const pos = {} as Record<Jugador, Punto>;
  for (const j of JUGADORES) {
    const [ax, ay] = atras.jugadores[j];
    const dx = CANASTA[0] - ax;
    const dy = CANASTA[1] - ay;
    const lejos = Math.hypot(dx, dy) || 1;
    const conBalon = j === ahora.conBalon;
    // Separación pensada para que la X no quede tapada por el círculo del atacante (radio 7).
    const d = Math.min(conBalon ? 10 : 13, lejos * 0.6);
    let x = ax + (dx / lejos) * d;
    let y = ay + (dy / lejos) * d;
    if (!conBalon) {
      // Ayuda: se cierra hacia el balón, como mucho 6 dm para no perder a su atacante.
      const bx = ahora.balon[0] - x;
      const by = ahora.balon[1] - y;
      const k = Math.min(0.22, 6 / (Math.hypot(bx, by) || 1));
      x += bx * k;
      y += by * k;
    }
    pos[j] = [Math.max(4, Math.min(146, x)), Math.max(4, Math.min(136, y))];
  }
  return pos;
}

export { JUGADORES };
