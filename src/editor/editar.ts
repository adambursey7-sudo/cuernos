// Operaciones del editor «arrastra y dibuja» (opción A, elegida por Adam el 29/10): el camino del dedo es la flecha
// y el tipo de movimiento se adivina. Funciones puras: devuelven copias nuevas.
import { nuevoId } from '../sistemas/almacen';
import type { Familia, Jugador, Movimiento, Paso, Punto, Sistema } from '../sistemas/tipos';

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
export function mover(paso: Paso, jugador: Jugador, tipo: TipoMovimiento, a: Punto, por?: Punto): Paso {
  const resto = paso.movimientos.filter((m) => m.tipo === 'pase' || m.jugador !== jugador);
  const nuevo: Extract<Movimiento, { jugador: Jugador }> = { tipo, jugador, a: redondo(a) };
  if (por) nuevo.por = redondo(por);
  return conMovimientos(paso, [...resto, nuevo]);
}

const redondo = ([x, y]: Punto): Punto => [Math.round(x), Math.round(y)];

/** Si el dedo se separa menos que esto (dm) de la línea recta, la flecha queda recta. */
const TORCIDO = 4;

/**
 * Convierte el camino del dedo en una curva de un solo punto de control (la que entiende la pizarra).
 * La curva pasa por el punto del camino que queda a mitad de recorrido. Devuelve `undefined` si es casi recta.
 */
export function ajustarCurva(camino: Punto[]): Punto | undefined {
  if (camino.length < 3) return undefined;
  const tramos = camino.slice(1).map((p, i) => Math.hypot(p[0] - camino[i][0], p[1] - camino[i][1]));
  const total = tramos.reduce((x, y) => x + y, 0);
  let recorrido = 0;
  let medio = camino[camino.length - 1];
  for (let i = 0; i < tramos.length; i++) {
    if (recorrido + tramos[i] >= total / 2) {
      const k = tramos[i] ? (total / 2 - recorrido) / tramos[i] : 0;
      medio = [camino[i][0] + (camino[i + 1][0] - camino[i][0]) * k, camino[i][1] + (camino[i + 1][1] - camino[i][1]) * k];
      break;
    }
    recorrido += tramos[i];
  }
  const [de, a] = [camino[0], camino[camino.length - 1]];
  const largo = Math.hypot(a[0] - de[0], a[1] - de[1]) || 1;
  const separacion = Math.abs((a[0] - de[0]) * (de[1] - medio[1]) - (de[0] - medio[0]) * (a[1] - de[1])) / largo;
  if (separacion < TORCIDO) return undefined;
  // En una curva de este tipo, el punto de mitad es (de + 2·control + a) / 4.
  return [2 * medio[0] - (de[0] + a[0]) / 2, 2 * medio[1] - (de[1] + a[1]) / 2];
}

/** Distancia (dm) a un compañero para que acabar a su lado cuente como bloqueo (un cuerpo de separación, como en la pista). */
const PEGADO = 18;

/** Qué movimientos puede tener un jugador en el paso: el que tiene el balón (y no lo ha pasado) también puede botar. */
export function opcionesDe(conBalon: boolean): TipoMovimiento[] {
  return conBalon ? ['bote', 'corte', 'bloqueo'] : ['corte', 'bloqueo'];
}

/** Adivina el movimiento: con balón, bote; si acaba pegado a un compañero, bloqueo; si no, corte. */
export function adivinar(conBalon: boolean, hasta: Punto, companeros: Punto[]): TipoMovimiento {
  if (conBalon) return 'bote';
  return companeros.some((c) => Math.hypot(c[0] - hasta[0], c[1] - hasta[1]) < PEGADO) ? 'bloqueo' : 'corte';
}

/** Tocar la etiqueta de una flecha pasa al siguiente movimiento posible, sin tocar el camino. */
export function cambiarTipo(paso: Paso, jugador: Jugador, opciones: TipoMovimiento[]): Paso {
  const m = paso.movimientos.find((x) => x.tipo !== 'pase' && x.jugador === jugador);
  if (!m || m.tipo === 'pase') return paso;
  const siguiente = opciones[(opciones.indexOf(m.tipo) + 1) % opciones.length];
  return mover(paso, jugador, siguiente, m.a, m.por);
}

/** Cambia el tipo de movimiento de un jugador sin tocar su camino (si no tiene movimiento, no hace nada). */
export function fijarTipo(paso: Paso, jugador: Jugador, tipo: TipoMovimiento): Paso {
  const m = paso.movimientos.find((x) => x.tipo !== 'pase' && x.jugador === jugador);
  return m && m.tipo !== 'pase' ? mover(paso, jugador, tipo, m.a, m.por) : paso;
}

/** Quita el movimiento de un jugador en el paso. */
export const quitarMovimiento = (paso: Paso, jugador: Jugador): Paso =>
  conMovimientos(paso, paso.movimientos.filter((m) => m.tipo === 'pase' || m.jugador !== jugador));

export const quitarPase = (paso: Paso): Paso => conMovimientos(paso, paso.movimientos.filter((m) => m.tipo !== 'pase'));

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

// ---- Pasos de la jugada (loop Pro, tramo 7): duplicar, mover y quitar un paso entero, y la categoría ----

/** Copia el paso `i` justo detrás de él (sus movimientos son los mismos: se retoca después). */
export function duplicarPaso(s: Sistema, i: number): Sistema {
  if (i < 0 || i >= s.pasos.length) return s;
  const pasos = [...s.pasos];
  pasos.splice(i + 1, 0, structuredClone(s.pasos[i]));
  return { ...s, pasos };
}

/** Mueve el paso `i` una posición (-1 antes, +1 después). Si no se puede, queda igual. */
export function moverPaso(s: Sistema, i: number, dir: -1 | 1): Sistema {
  const j = i + dir;
  if (i < 0 || j < 0 || i >= s.pasos.length || j >= s.pasos.length) return s;
  const pasos = [...s.pasos];
  [pasos[i], pasos[j]] = [pasos[j], pasos[i]];
  return { ...s, pasos };
}

/** Quita el paso `i`. Una jugada necesita al menos un paso: el último no se quita. */
export function quitarPaso(s: Sistema, i: number): Sistema {
  if (s.pasos.length <= 1 || i < 0 || i >= s.pasos.length) return s;
  return { ...s, pasos: s.pasos.filter((_, k) => k !== i) };
}

/** La categoría del libro de jugadas; la defensa y la presión se guardan como jugadas de defensa. */
export function ponerFamilia(s: Sistema, familia: Familia | undefined): Sistema {
  const { familia: _antes, ...resto } = s;
  // Sin categoría la jugada sigue siendo de lo que era; con ella, de defensa si es defensa o presión.
  return { ...resto, ...(familia ? { familia, tipo: familia === 'defensa' || familia === 'presion' ? 'defensa' : 'ataque' } : {}) };
}
