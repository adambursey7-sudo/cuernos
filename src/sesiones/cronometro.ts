// Cronómetro de pista: dónde va el entrenamiento según los segundos que han pasado. Todo puro, sin reloj.
import { inicios, total, type Sesion } from './sesiones';

export interface Posicion {
  /** Bloque en curso; -1 si ya acabó todo. */
  i: number;
  /** Segundos que faltan para terminar ese bloque. */
  resto: number;
  /** Segundos que faltan para terminar la sesión. */
  restoTotal: number;
  acabada: boolean;
}

export function posicion(s: Sesion, seg: number): Posicion {
  const fin = total(s) * 60;
  const t = Math.max(0, seg);
  if (t >= fin) return { i: -1, resto: 0, restoTotal: 0, acabada: true };
  const desde = inicios(s);
  let i = 0;
  while (i + 1 < s.bloques.length && desde[i + 1] * 60 <= t) i++;
  return { i, resto: (desde[i] + s.bloques[i].minutos) * 60 - t, restoTotal: fin - t, acabada: false };
}

/** Segundo en el que empieza el bloque `i` (se queda dentro de la sesión). */
export const inicioDe = (s: Sesion, i: number) => (inicios(s)[Math.min(Math.max(i, 0), s.bloques.length - 1)] ?? 0) * 60;

/** «12:05», «0:09». */
export function reloj(seg: number): string {
  const t = Math.max(0, Math.ceil(seg));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
