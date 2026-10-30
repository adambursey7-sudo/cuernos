// Reloj de las miniaturas: la jugada entera en bucle, lenta, con una pausa al final. Función pura (se prueba sin pantalla).
import { SEGUNDOS_POR_PASO } from './useJugada';

/** Velocidad de las miniaturas: la mitad que la pizarra grande. */
export const VELOCIDAD_MINIATURA = 0.5;
/** Cuánto se queda quieta al final antes de volver a empezar (ms). */
export const PAUSA_FINAL = 1500;

/** Momento de la jugada (0 a `total`) que toca `ms` milisegundos después de empezar el bucle. */
export function momentoDelBucle(ms: number, total: number, velocidad = VELOCIDAD_MINIATURA, pausa = PAUSA_FINAL): number {
  if (total <= 0) return 0;
  const porPaso = (SEGUNDOS_POR_PASO / velocidad) * 1000;
  const vuelta = total * porPaso + pausa;
  const dentro = ((ms % vuelta) + vuelta) % vuelta;
  return Math.min(dentro / porPaso, total);
}
