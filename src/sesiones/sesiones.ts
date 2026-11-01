// Sesiones de entrenamiento (opción B · línea de tiempo, elegida por Adam el 29/10): ejercicios en orden, con sus minutos.
// Se guardan solo en el móvil del entrenador y por equipo (categoría, sin nombres de jugadores).
import { TIPOS, buscarEjercicio, type TipoEjercicio } from '../ejercicios/ejercicios';
import { fichaDeBloque } from '../recursos/fichas';

const CLAVE = 'horns.sesiones';

export interface Bloque {
  /** Id del ejercicio de la biblioteca (`sistema~n`). */
  ejercicio: string;
  minutos: number;
  tipo: TipoEjercicio;
}

export interface Sesion {
  id: string;
  /** Equipo o categoría: «Cadete femenino». */
  equipo: string;
  /** Id del equipo del diario, si lo hay (así renombrar el equipo no suelta sus sesiones). */
  equipoId?: string;
  nombre: string;
  /** Duración prevista del entrenamiento, en minutos. */
  duracion: number;
  bloques: Bloque[];
}

export const PASO_MINUTOS = 5;
export const MIN_BLOQUE = 5;
export const MAX_BLOQUE = 60;
export const DURACIONES = [45, 60, 75, 90, 120];

export const total = (s: Sesion) => s.bloques.reduce((a, b) => a + b.minutos, 0);

/** Minutos que faltan (positivo) o sobran (negativo) respecto a la duración prevista. */
export const diferencia = (s: Sesion) => s.duracion - total(s);

export const nuevaSesion = (equipo: string, nombre = 'Entrenamiento', equipoId?: string): Sesion => ({
  id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  equipo,
  ...(equipoId ? { equipoId } : {}),
  nombre,
  duracion: 90,
  bloques: [],
});

export function bloqueDe(ejercicio: string, minutos: number, tipo: TipoEjercicio): Bloque {
  return { ejercicio, minutos: limitar(minutos), tipo };
}

const limitar = (m: number) => Math.min(MAX_BLOQUE, Math.max(MIN_BLOQUE, Math.round(m / PASO_MINUTOS) * PASO_MINUTOS));

export const conMinutos = (s: Sesion, i: number, minutos: number): Sesion => ({
  ...s,
  bloques: s.bloques.map((b, j) => (j === i ? { ...b, minutos: limitar(minutos) } : b)),
});

export const conTipo = (s: Sesion, i: number, tipo: TipoEjercicio): Sesion => ({
  ...s,
  bloques: s.bloques.map((b, j) => (j === i ? { ...b, tipo } : b)),
});

export function mover(s: Sesion, i: number, delta: -1 | 1): Sesion {
  const j = i + delta;
  if (j < 0 || j >= s.bloques.length) return s;
  const bloques = [...s.bloques];
  [bloques[i], bloques[j]] = [bloques[j], bloques[i]];
  return { ...s, bloques };
}

export const quitar = (s: Sesion, i: number): Sesion => ({ ...s, bloques: s.bloques.filter((_, j) => j !== i) });

/** Hora de inicio de cada bloque, en minutos desde el comienzo. */
export const inicios = (s: Sesion): number[] => s.bloques.map((_, i) => s.bloques.slice(0, i).reduce((a, b) => a + b.minutos, 0));

/** Minutos por tipo, en el orden de TIPOS, solo los que aparecen. */
export const reparto = (s: Sesion) =>
  TIPOS.map((t) => ({ ...t, minutos: s.bloques.filter((b) => b.tipo === t.id).reduce((a, b) => a + b.minutos, 0) })).filter((t) => t.minutos > 0);

const esTipo = (t: unknown): t is TipoEjercicio => TIPOS.some((x) => x.id === t);

function esSesion(s: unknown): s is Sesion {
  const x = s as Sesion;
  return (
    !!x &&
    typeof x.id === 'string' &&
    typeof x.equipo === 'string' &&
    (x.equipoId === undefined || typeof x.equipoId === 'string') &&
    typeof x.nombre === 'string' &&
    Number.isFinite(x.duracion) &&
    Array.isArray(x.bloques) &&
    x.bloques.every((b) => typeof b?.ejercicio === 'string' && Number.isFinite(b.minutos) && esTipo(b.tipo))
  );
}

/** Las sesiones de un equipo: por su id, o por el nombre si son de antes de que hubiera id. */
export const sesionesDe = (todas: Sesion[], e: { id: string; nombre: string }) =>
  todas.filter((s) => (s.equipoId ? s.equipoId === e.id : s.equipo === e.nombre));

/** Pone a cada sesión el id y el nombre actual de su equipo (si se puede saber cuál es por el nombre). Devuelve la misma lista si no hay nada que cambiar. */
export function alinearSesiones(sesiones: Sesion[], equipos: { id: string; nombre: string }[]): Sesion[] {
  let cambio = false;
  const nuevas = sesiones.map((s) => {
    const e = s.equipoId ? equipos.find((x) => x.id === s.equipoId) : equipos.find((x) => x.nombre === s.equipo);
    if (!e || (s.equipoId === e.id && s.equipo === e.nombre)) return s;
    cambio = true;
    return { ...s, equipoId: e.id, equipo: e.nombre };
  });
  return cambio ? nuevas : sesiones;
}

/** Deja solo las sesiones válidas (también al cargar una copia). */
export const limpiarSesiones = (l: unknown): Sesion[] => (Array.isArray(l) ? l.filter(esSesion) : []);

/** Junta las de una copia con las actuales: si coincide el id, gana la copia. */
export const juntarSesiones = (actuales: Sesion[], copia: Sesion[]): Sesion[] => {
  const ids = new Set(copia.map((s) => s.id));
  return [...actuales.filter((s) => !ids.has(s.id)), ...copia];
};

export function leerSesiones(): Sesion[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(lista) ? lista.filter(esSesion) : [];
  } catch {
    return [];
  }
}

/** Guarda todas las sesiones; devuelve false si el móvil no deja guardar. */
export function guardarSesiones(lista: Sesion[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}

/** Bloques cuyo ejercicio ya no existe (una jugada propia borrada): se avisan en vez de romper la pantalla. */
export const huerfanos = (s: Sesion) => s.bloques.filter((b) => !tituloBloque(b.ejercicio)).length;

/** Nombre de lo que hay en un bloque: un ejercicio de la biblioteca o uno de «Mis ejercicios». Undefined si ya no existe. */
export function tituloBloque(id: string): string | undefined {
  const f = fichaDeBloque(id);
  if (f) return f.nombre;
  const e = buscarEjercicio(id);
  return e ? `${e.formato ? `${e.formato} · ` : ''}${e.nombre}` : undefined;
}
