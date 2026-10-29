// Operaciones del editor «arrastra y elige» (opción B, elegida por Adam). Funciones puras: devuelven copias nuevas.
import { nuevoId } from '../sistemas/almacen';
import type { Jugador, Movimiento, Paso, Punto, Sistema } from '../sistemas/tipos';

export type TipoMovimiento = 'corte' | 'bote' | 'bloqueo';

/** Colocación de partida si no se empieza desde otro sistema: cinco abiertos. */
const CINCO_ABIERTOS: Sistema['inicio'] = {
  '1': [75, 100],
  '2': [22, 70],
  '3': [128, 70],
  '4': [14, 14],
  '5': [136, 14],
};

export function nuevoBorrador(base?: Sistema): Sistema {
  if (base?.propio) return structuredClone(base);
  if (base)
    return {
      ...structuredClone(base),
      id: nuevoId(),
      nombre: base.nombre + ' (variante)',
      borrador: false,
      propio: true,
    };
  return {
    id: nuevoId(),
    nombre: 'Mi jugada',
    tipo: 'ataque',
    contra: 'individual',
    nivelMinimo: 'infantil',
    idea: '',
    inicio: { ...CINCO_ABIERTOS },
    balon: '1',
    pasos: [],
    lecturas: {},
    errores: [],
    ejercicios: [],
    propio: true,
  };
}

const VERBO: Record<Movimiento['tipo'], string> = { corte: 'corta', bote: 'bota', bloqueo: 'bloquea', pase: 'pasa' };

/** Texto del paso a partir de sus movimientos: «5 bloquea; 1 bota». */
export function describir(movimientos: Movimiento[]): string {
  if (!movimientos.length) return '';
  const frase = movimientos
    .map((m) => (m.tipo === 'pase' ? `${m.de} pasa a ${m.a}` : `${m.jugador} ${VERBO[m.tipo]}`))
    .join('; ');
  return frase + '.';
}

/** Cambia los movimientos de un paso y, si su texto era el automático (o estaba vacío), lo rehace. */
function conMovimientos(paso: Paso, movimientos: Movimiento[]): Paso {
  const automatico = !paso.texto || paso.texto === describir(paso.movimientos);
  return { ...paso, movimientos, texto: automatico ? describir(movimientos) : paso.texto };
}

/** Un jugador solo hace un movimiento por paso: el nuevo sustituye al anterior. */
export function mover(paso: Paso, jugador: Jugador, tipo: TipoMovimiento, a: Punto): Paso {
  const resto = paso.movimientos.filter((m) => m.tipo === 'pase' || m.jugador !== jugador);
  return conMovimientos(paso, [...resto, { tipo, jugador, a: [Math.round(a[0]), Math.round(a[1])] }]);
}

/** Un pase por paso como mucho. */
export function pasar(paso: Paso, de: Jugador, a: Jugador): Paso {
  const resto = paso.movimientos.filter((m) => m.tipo !== 'pase');
  return conMovimientos(paso, [...resto, { tipo: 'pase', de, a }]);
}

/** Lo que queda para guardar: sin pasos vacíos al final. */
export function limpiar(s: Sistema): Sistema {
  const pasos = [...s.pasos];
  while (pasos.length && !pasos[pasos.length - 1].movimientos.length) pasos.pop();
  return { ...s, nombre: s.nombre.trim() || 'Mi jugada', pasos };
}

/** Un punto de la pista dentro de los límites (los jugadores no se salen al arrastrar). */
export const dentro = ([x, y]: Punto): Punto => [Math.max(6, Math.min(144, x)), Math.max(6, Math.min(134, y))];
