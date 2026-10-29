// Lo que las fichas NO dicen de cada ejercicio: qué jugadores y qué pasos del sistema enseña su pizarra.
// Todo esto es BORRADOR para que Adam lo revise; la IA no inventa ejercicios, solo recorta la pizarra del sistema.
// La clave es «id del sistema|línea de la ficha tal cual» (si la ficha cambia, el borrador deja de aplicarse).
import type { Jugador } from '../sistemas/tipos';

export interface Borrador {
  /** Jugadores que salen en la pizarra; sin ellos, los cinco. */
  jugadores?: Jugador[];
  /** Pasos del sistema (desde 0, ambos incluidos); sin ellos, todos. */
  pasos?: [number, number];
}

export const BORRADORES: Record<string, Borrador> = {
  // Cuernos: 5 bloquea, 1 sale por el bloqueo y 5 continúa.
  'cuernos|2x0 bloqueo directo y continuación.': { jugadores: ['1', '5'], pasos: [1, 3] },
  'cuernos|3x0 base y dos codos: elegir lado.': { jugadores: ['1', '4', '5'], pasos: [0, 3] },
  'cuernos|2x2 bloqueo directo con defensa que cambia.': { jugadores: ['1', '5'], pasos: [1, 3] },
  'cuernos|5x0 cuernos completo con las 2 primeras lecturas.': {},
  'cuernos|5x5 con puntos dobles si se acaba en continuación.': {},

  // Cuernos Flex: bloqueo ciego del 1 al 5; luego bloqueo de fondo (5 a 2) y vertical (4 a 5).
  'cuernos-flex|2x0 bloqueo ciego del base al codo y pase al que corta.': { jugadores: ['1', '5'], pasos: [1, 1] },
  'cuernos-flex|3x0 bloqueo de fondo y bloqueo vertical seguidos.': { jugadores: ['2', '4', '5'], pasos: [3, 4] },
  'cuernos-flex|5x0 completo, dos veces por cada lado.': {},
  'cuernos-flex|5x5 en el que la canasta solo vale si sale de una de las tres opciones.': {},

  // Flex: bloqueo de fondo de 4 para el corte de 5, y bloqueo vertical de 1 para 4.
  'flex|2x0 corte con bloqueo de fondo y pase.': { jugadores: ['4', '5'], pasos: [1, 1] },
  'flex|3x0 bloqueo de fondo y bloqueo vertical seguidos.': { jugadores: ['1', '4', '5'], pasos: [1, 3] },
  'flex|3x3 solo con bloqueos, defensa que cambia o pasa por detrás.': { jugadores: ['1', '4', '5'], pasos: [1, 3] },
  'flex|5x0 flex completo, dos vueltas de continuidad por cada lado.': {},
  'flex|5x5 con punto extra si se anota tras bloqueo de fondo o vertical.': {},
};
