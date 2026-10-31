// Jugadas del entrenador: se guardan solo en su móvil (decisión de Adam: sin cuentas). Las del libro van en datos.ts.
import { SISTEMAS } from './datos';
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

export function leerMios(): Sistema[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(lista) ? lista.filter(esSistemaValido).map((s) => ({ ...s, propio: true })) : [];
  } catch {
    return [];
  }
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
  return [...SISTEMAS, ...SISTEMAS_SENIOR, ...leerMios()];
}

export function buscarSistema(id: string): Sistema | undefined {
  return todosLosSistemas().find((s) => s.id === id);
}

export const nuevoId = () => 'mio-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
