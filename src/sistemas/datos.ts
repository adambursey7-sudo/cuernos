// Sistemas pasados a mano desde las fichas de `sistemas/*.md`. La IA no inventa jugadas: solo usa estas.
import type { Sistema } from './tipos';

const CUERNOS_INICIO: Sistema['inicio'] = {
  '1': [75, 105],
  '2': [12, 10],
  '3': [138, 10],
  '4': [55, 60],
  '5': [95, 60],
};

export const SISTEMAS: Sistema[] = [
  {
    id: 'cuernos',
    nombre: 'Cuernos',
    tipo: 'ataque',
    contra: 'individual',
    nivelMinimo: 'infantil',
    idea: 'El base tiene dos bloqueadores a la vez. Elige lado según cómo defiendan, y el interior que no bloquea queda libre para abrirse o cortar.',
    inicio: CUERNOS_INICIO,
    balon: '1',
    pasos: [
      { texto: '1 sube con balón; 4 y 5 en los codos.', movimientos: [{ tipo: 'bote', jugador: '1', a: [74, 98] }] },
      { texto: '5 sube a poner bloqueo directo a 1.', movimientos: [{ tipo: 'bloqueo', jugador: '5', a: [87, 87] }] },
      { texto: '1 sale por el bloqueo hacia el lado de 5.', movimientos: [{ tipo: 'bote', jugador: '1', a: [110, 78], por: [96, 100] }] },
      {
        texto: '5 continúa hacia canasta; 4 se abre fuera.',
        movimientos: [
          { tipo: 'corte', jugador: '5', a: [80, 28] },
          { tipo: 'corte', jugador: '4', a: [40, 92] },
        ],
      },
      { texto: '2 y 3 se quedan en las esquinas, listos para recibir y tirar.', movimientos: [] },
    ],
    lecturas: {
      infantil: 'Solo el bloqueo directo y la continuación a canasta.',
      cadete: 'Decidir lado del bloqueo; pase al interior que continúa o al que se abre.',
      junior: 'Todas las variantes y lecturas según cómo defiendan el bloqueo (cambio, flotar, pasar por detrás).',
      senior: 'Todas las variantes y lecturas según cómo defiendan el bloqueo (cambio, flotar, pasar por detrás).',
    },
    errores: [
      'El base sale del bloqueo demasiado lejos y no amenaza.',
      'El bloqueador se mueve antes de tiempo (falta en ataque).',
      'Las esquinas se acercan al balón y cierran el espacio.',
    ],
    ejercicios: [
      '2x0 bloqueo directo y continuación.',
      '3x0 base y dos codos: elegir lado.',
      '2x2 bloqueo directo con defensa que cambia.',
      '5x0 cuernos completo con las 2 primeras lecturas.',
      '5x5 con puntos dobles si se acaba en continuación.',
    ],
  },
  {
    id: 'cuernos-flex',
    nombre: 'Cuernos Flex',
    tipo: 'ataque',
    contra: 'individual',
    nivelMinimo: 'cadete',
    idea: 'Empieza como cuernos, pero el base no usa el bloqueo: lo pone él. Después se encadenan un bloqueo de fondo y un bloqueo vertical; cada bloqueo deja una opción de canasta fácil.',
    inicio: CUERNOS_INICIO,
    balon: '1',
    borrador: true,
    pasos: [
      { texto: '1 pasa a 4 en el codo izquierdo.', movimientos: [{ tipo: 'pase', de: '1', a: '4' }] },
      {
        texto: '1 pone un bloqueo ciego a 5; 5 corta a canasta. Opción 1: bandeja.',
        movimientos: [
          { tipo: 'bloqueo', jugador: '1', a: [88, 70] },
          { tipo: 'corte', jugador: '5', a: [80, 22], por: [100, 45] },
        ],
      },
      {
        texto: '1 se abre arriba y recibe el balón de vuelta.',
        revisar: true,
        movimientos: [
          { tipo: 'corte', jugador: '1', a: [75, 100] },
          { tipo: 'pase', de: '4', a: '1' },
        ],
      },
      {
        texto: '5 pone el bloqueo de fondo flex a 2; 2 corta pegado al bloqueo. Opción 2: bandeja.',
        movimientos: [
          { tipo: 'bloqueo', jugador: '5', a: [48, 20] },
          { tipo: 'corte', jugador: '2', a: [72, 24], por: [42, 30] },
        ],
      },
      {
        texto: '4 baja y pone bloqueo vertical a 5; 5 sale al codo. Opción 3: tirar o seguir.',
        movimientos: [
          { tipo: 'bloqueo', jugador: '4', a: [50, 34] },
          { tipo: 'corte', jugador: '5', a: [45, 62], por: [40, 40] },
        ],
      },
    ],
    lecturas: {
      cadete: 'Solo las tres opciones en orden. Si ninguna sale, se juega libre.',
      junior: 'Enlazar con la continuidad del flex en vez de jugar libre. El defensor de 5 suele ayudar en el corte de 2, y eso deja a 5 solo al salir del bloqueo vertical.',
      senior: 'Enlazar con la continuidad del flex en vez de jugar libre. El defensor de 5 suele ayudar en el corte de 2, y eso deja a 5 solo al salir del bloqueo vertical.',
    },
    errores: [
      '1 se queda pegado después del bloqueo ciego y no se abre a recibir.',
      '5 corta y se para en la zona en vez de ir a bloquear a 2.',
      '2 sale de la esquina antes de que llegue el bloqueo.',
      '4 se olvida del bloqueo vertical porque se queda mirando el corte.',
    ],
    ejercicios: [
      '2x0 bloqueo ciego del base al codo y pase al que corta.',
      '3x0 bloqueo de fondo y bloqueo vertical seguidos.',
      '5x0 completo, dos veces por cada lado.',
      '5x5 en el que la canasta solo vale si sale de una de las tres opciones.',
    ],
  },
  {
    id: 'flex',
    nombre: 'Flex',
    tipo: 'ataque',
    contra: 'individual (con zona pierde casi todo su efecto)',
    nivelMinimo: 'infantil',
    idea: 'El interior del lado contrario corta por la zona usando un bloqueo de fondo, y el que ha bloqueado recibe un bloqueo vertical para salir. Es una continuidad: las posiciones se intercambian y se repite sin parar.',
    inicio: { '1': [75, 100], '2': [25, 70], '3': [125, 70], '4': [52, 22], '5': [98, 22] },
    balon: '1',
    borrador: true,
    pasos: [
      { texto: '1 pasa a 2 (ala del lado del balón).', movimientos: [{ tipo: 'pase', de: '1', a: '2' }] },
      {
        texto: '4 pone el bloqueo de fondo flex; 5 corta por la zona pegado al bloqueo. 1 baja hacia el lado del balón.',
        movimientos: [
          { tipo: 'bloqueo', jugador: '4', a: [56, 24] },
          { tipo: 'corte', jugador: '5', a: [36, 20], por: [66, 34] },
          { tipo: 'corte', jugador: '1', a: [56, 52] },
        ],
      },
      { texto: '2 mira si 5 llega con ventaja y le pasa. Si no, 5 se queda en el bloque.', movimientos: [] },
      {
        texto: '1 pone bloqueo vertical a 4, que sale al codo para recibir y tirar.',
        movimientos: [
          { tipo: 'bloqueo', jugador: '1', a: [56, 36] },
          { tipo: 'corte', jugador: '4', a: [62, 64], por: [66, 46] },
        ],
      },
      {
        texto: '3 sube arriba para equilibrar; se repite desde el otro lado.',
        revisar: true,
        movimientos: [{ tipo: 'corte', jugador: '3', a: [90, 100] }],
      },
    ],
    lecturas: {
      infantil: 'Solo el corte con bloqueo de fondo y el pase al cortador; el bloqueador sale después sin lectura.',
      cadete: 'Decidir entre pasar al cortador, al que sale por el bloqueo vertical o al lado contrario.',
      junior: 'Todas las variantes y lecturas según cómo defiendan el bloqueo (pasar por delante, por detrás, cambio, ayuda).',
      senior: 'Todas las variantes y lecturas según cómo defiendan el bloqueo (pasar por delante, por detrás, cambio, ayuda).',
    },
    errores: [
      'El cortador no roza el bloqueo y su defensor lo sigue pegado.',
      'El bloqueador se mueve antes de tiempo o pone el bloqueo muy lejos de la línea de fondo.',
      'El pasador tarda en ver el corte y la ventaja se pierde.',
      'Los jugadores se paran tras el movimiento y la continuidad se rompe.',
    ],
    ejercicios: [
      '2x0 corte con bloqueo de fondo y pase.',
      '3x0 bloqueo de fondo y bloqueo vertical seguidos.',
      '3x3 solo con bloqueos, defensa que cambia o pasa por detrás.',
      '5x0 flex completo, dos vueltas de continuidad por cada lado.',
      '5x5 con punto extra si se anota tras bloqueo de fondo o vertical.',
    ],
  },
];
