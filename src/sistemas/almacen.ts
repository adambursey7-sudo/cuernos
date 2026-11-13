// Jugadas del entrenador: se guardan solo en su móvil (decisión de Adam: sin cuentas). Las del libro van en datos.ts.
import { SISTEMAS } from './datos';
import { SISTEMAS_BIBLIOTECA } from './datosBiblioteca';
import { SISTEMAS_SENIOR } from './datosSenior';
import type { Jugador, Sistema } from './tipos';

const CLAVE = 'cuernos.mios';
const JUGADORES: Jugador[] = ['1', '2', '3', '4', '5'];

const esPunto = (p: unknown) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Comprueba lo mínimo para que una jugada guardada (o cargada de una copia) no rompa la pizarra. */
export function esSistemaValido(s: unknown): s is Sistema {
  if (!s || typeof s !== 'object') return false;
  const x = s as Sistema;
  return (
    typeof x.id === 'string' &&
    typeof x.nombre === 'string' &&
    !!x.inicio &&
    JUGADORES.every((j) => esPunto(x.inicio[j])) &&
    JUGADORES.includes(x.balon) &&
    Array.isArray(x.pasos) &&
    x.pasos.length > 0 &&
    x.pasos.every((p) => typeof p?.texto === 'string' && Array.isArray(p.movimientos))
  );
}

// Lo leído se recuerda mientras el texto guardado no cambie: el cronómetro y el editor de sesiones buscan jugadas y ejercicios
// varias veces por segundo, y releer y validar todo cada vez gastaba batería y daba tirones.
let memoMios: { crudo: string | null; mios: Sistema[]; todos?: Sistema[] } | undefined;

function miosEnMemoria(): NonNullable<typeof memoMios> {
  let crudo: string | null;
  try {
    crudo = localStorage.getItem(CLAVE);
  } catch {
    // Sin almacenamiento (modo privado): se recuerda una lista vacía, siempre la misma.
    memoMios ??= { crudo: null, mios: [] };
    return memoMios;
  }
  if (memoMios && memoMios.crudo === crudo) return memoMios;
  let mios: Sistema[] = [];
  try {
    const lista = JSON.parse(crudo ?? '[]');
    if (Array.isArray(lista)) mios = lista.filter(esSistemaValido).map((s) => ({ ...s, propio: true }));
  } catch {
    /* texto roto: como si no hubiera jugadas propias */
  }
  memoMios = { crudo, mios };
  return memoMios;
}

const todosEnMemoria = (): Sistema[] => {
  const m = miosEnMemoria();
  m.todos ??= [...SISTEMAS, ...SISTEMAS_SENIOR, ...SISTEMAS_BIBLIOTECA, ...m.mios];
  return m.todos;
};

/** Cambia cada vez que cambian las jugadas propias guardadas: sirve de llave para recordar cálculos hechos con ellas. */
export const versionDeMios = (): unknown => miosEnMemoria();

export function leerMios(): Sistema[] {
  return [...miosEnMemoria().mios];
}

function escribir(lista: Sistema[]) {
  localStorage.setItem(CLAVE, JSON.stringify(lista));
}

/** Guarda (o sustituye si ya existe) una jugada propia. Lanza si el móvil no deja guardar. */
export function guardarMio(s: Sistema) {
  const lista = leerMios().filter((x) => x.id !== s.id);
  escribir([...lista, { ...s, propio: true }]);
}

/** Sustituye todas las jugadas propias (al cargar una copia). */
export function guardarTodosMios(lista: Sistema[]) {
  escribir(lista.filter(esSistemaValido));
}

export function borrarMio(id: string) {
  escribir(leerMios().filter((x) => x.id !== id));
}

export function todosLosSistemas(): Sistema[] {
  return [...todosEnMemoria()];
}

export function buscarSistema(id: string): Sistema | undefined {
  return todosEnMemoria().find((s) => s.id === id);
}

export const nuevoId = () => 'mio-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
