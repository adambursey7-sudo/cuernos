// Motor de la pizarra: dónde está cada jugador y el balón en cualquier momento de la jugada.
// `t` va de 0 (antes del paso 1) a pasos.length (todo hecho): t = 2 es «paso 2 acabado», t = 2,5 es la mitad del paso 3.
import type { Jugador, Movimiento, Punto, Sistema } from '../sistemas/tipos';

export interface Foto {
  jugadores: Record<Jugador, Punto>;
  balon: Punto;
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
  if (pase) {
    const kp = Math.max(0, (k - 0.5) * 2);
    balon = enCamino(jugadores[pase.de], jugadores[pase.a], kp);
  }
  return { jugadores, balon, conBalon: marcas[i + 1].balon };
}

export { JUGADORES };
