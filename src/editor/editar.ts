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

/**
 * Tocar una flecha la curva: recta → curva a un lado → curva al otro → recta.
 * `desde` es dónde estaba el jugador al empezar el paso.
 */
export function curvar(paso: Paso, jugador: Jugador, desde: Punto): Paso {
  return {
    ...paso,
    movimientos: paso.movimientos.map((m) => {
      if (m.tipo === 'pase' || m.jugador !== jugador) return m;
      const medio: Punto = [(desde[0] + m.a[0]) / 2, (desde[1] + m.a[1]) / 2];
      const [dx, dy] = [m.a[0] - desde[0], m.a[1] - desde[1]];
      // Perpendicular a la línea, con una cuarta parte de su largo: se nota la curva sin parecer un globo.
      const normal: Punto = [-dy * 0.25, dx * 0.25];
      const lado = !m.por ? 0 : Math.sign((m.por[0] - medio[0]) * normal[0] + (m.por[1] - medio[1]) * normal[1]);
      if (lado < 0) return { tipo: m.tipo, jugador: m.jugador, a: m.a };
      const k = lado === 0 ? 1 : -1;
      return { ...m, por: [Math.round(medio[0] + normal[0] * k), Math.round(medio[1] + normal[1] * k)] as Punto };
    }),
  };
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
