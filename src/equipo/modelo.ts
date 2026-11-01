// Lo que hace falta para montar un equipo entero: género, categoría, temporada, color, escudo, cuerpo técnico y objetivos.
// Todo es opcional: un equipo antiguo sigue valiendo tal cual. Se valida al cargar (también desde una copia).
import type { Equipo, Jugadora } from '../diario/diario';

export type Genero = 'f' | 'm';
export type FormaEscudo = 'redondo' | 'escudo' | 'rombo';

export interface Escudo {
  /** Hasta 3 letras. */
  letras: string;
  forma: FormaEscudo;
}

export const FORMAS_ESCUDO: readonly [FormaEscudo, string][] = [['redondo', 'Redondo'], ['escudo', 'Escudo'], ['rombo', 'Rombo']];

export const PAPELES = [['entrenador', 'Entrenador'], ['ayudante', 'Ayudante'], ['delegado', 'Delegado'], ['fisio', 'Fisio'], ['otro', 'Otro']] as const;
export type Papel = (typeof PAPELES)[number][0];
export const esPapel = (x: unknown): x is Papel => PAPELES.some(([id]) => id === x);

/** Persona del cuerpo técnico. Datos de adultos: solo en el móvil y en la copia. */
export interface Staff {
  id: string;
  nombre: string;
  papel: Papel;
  /** Teléfono o correo, a gusto del entrenador. */
  contacto?: string;
}

export interface Objetivo {
  id: string;
  texto: string;
  hecho?: boolean;
}

export type Mano = 'd' | 'i' | 'a';
export const MANOS: readonly [Mano, string][] = [['d', 'Derecha'], ['i', 'Izquierda'], ['a', 'Ambas']];

/** Sin dato, un equipo senior es masculino y uno de formación, femenino (así eran antes de poder elegirlo). */
export const esFemenino = (e?: Pick<Equipo, 'tipo' | 'genero'>) => (e?.genero ? e.genero === 'f' : e?.tipo !== 'senior');

const txt = (x: unknown): x is string => typeof x === 'string';
const hex = /^#[0-9a-f]{6}$/i;

/** Hasta 3 letras o números, en mayúsculas; sin dato, las iniciales del nombre. */
export function letrasDe(nombre: string): string {
  const palabras = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^A-Za-z0-9]+/).filter(Boolean);
  const iniciales = palabras.length > 1 ? palabras.map((p) => p[0]).join('') : (palabras[0] ?? '').slice(0, 2);
  return iniciales.slice(0, 3).toUpperCase();
}

export const escudoPorDefecto = (nombre: string): Escudo => ({ letras: letrasDe(nombre) || 'HQ', forma: 'redondo' });

export function limpiarEscudo(x: unknown): Escudo | undefined {
  const e = x as Escudo | undefined;
  if (!e || !txt(e.letras) || !FORMAS_ESCUDO.some(([f]) => f === e.forma)) return undefined;
  const letras = e.letras.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 3).toUpperCase();
  return letras ? { letras, forma: e.forma } : undefined;
}

export function limpiarStaff(x: unknown): Staff[] {
  if (!Array.isArray(x)) return [];
  const vistos = new Set<string>();
  const salida: Staff[] = [];
  for (const s of x as Staff[]) {
    if (!s || !txt(s.id) || !txt(s.nombre) || !esPapel(s.papel) || vistos.has(s.id)) continue;
    vistos.add(s.id);
    const contacto = txt(s.contacto) && s.contacto.trim() ? s.contacto.trim().slice(0, 60) : undefined;
    salida.push({ id: s.id, nombre: s.nombre.slice(0, 40), papel: s.papel, ...(contacto ? { contacto } : {}) });
  }
  return salida.slice(0, 12);
}

export function limpiarObjetivos(x: unknown): Objetivo[] {
  if (!Array.isArray(x)) return [];
  const salida: Objetivo[] = [];
  for (const o of x as Objetivo[]) {
    if (!o || !txt(o.id) || !txt(o.texto) || !o.texto.trim()) continue;
    salida.push({ id: o.id, texto: o.texto.slice(0, 120), ...(o.hecho === true ? { hecho: true } : {}) });
  }
  return salida.slice(0, 20);
}

type Extras = Pick<Equipo, 'genero' | 'categoria' | 'temporada' | 'color' | 'escudo' | 'staff' | 'objetivos' | 'ejemplo'>;

/** Solo las partes válidas de lo que el equipo trae de más. */
export function limpiarExtras(e: Partial<Extras>): Partial<Extras> {
  const escudo = limpiarEscudo(e.escudo);
  const staff = limpiarStaff(e.staff);
  const objetivos = limpiarObjetivos(e.objetivos);
  return {
    ...(e.genero === 'f' || e.genero === 'm' ? { genero: e.genero } : {}),
    ...(txt(e.categoria) && e.categoria.trim() ? { categoria: e.categoria.trim().slice(0, 30) } : {}),
    ...(txt(e.temporada) && e.temporada.trim() ? { temporada: e.temporada.trim().slice(0, 12) } : {}),
    ...(txt(e.color) && hex.test(e.color) ? { color: e.color.toLowerCase() } : {}),
    ...(escudo ? { escudo } : {}),
    ...(staff.length ? { staff } : {}),
    ...(objetivos.length ? { objetivos } : {}),
    ...(e.ejemplo === true ? { ejemplo: true } : {}),
  };
}

/** Año de nacimiento y mano de una jugadora: lo que no cuadra se descarta, sin tirar la ficha. */
export function limpiarDatosJugadora(j: Jugadora): Jugadora {
  const { nacimiento, mano, ...resto } = j;
  const año = Number.isInteger(nacimiento) && nacimiento! >= 1950 && nacimiento! <= 2030 ? nacimiento : undefined;
  return { ...resto, ...(año ? { nacimiento: año } : {}), ...(MANOS.some(([m]) => m === mano) ? { mano } : {}) };
}

/** Temporada por defecto como texto: «2026-27». */
export function etiquetaTemporada(inicio: string): string {
  const a = Number(inicio.slice(0, 4));
  return Number.isFinite(a) && a > 0 ? `${a}-${String(a + 1).slice(2)}` : '';
}

/** Color que se ve sobre fondo oscuro: si el elegido es muy oscuro, se aclara. */
export function colorLegible(c: string): string {
  if (!hex.test(c)) return '#f2b134';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const luz = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luz >= 90) return c;
  const mezcla = (v: number) => Math.round(v + (255 - v) * 0.5).toString(16).padStart(2, '0');
  return `#${mezcla(r)}${mezcla(g)}${mezcla(b)}`;
}
