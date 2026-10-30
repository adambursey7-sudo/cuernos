// Ficha de ejercicio propia (opción B, elegida por Adam el 30/10: se rellena por pasos cortos con el vídeo a mano).
// Un recurso puede dar varios ejercicios. Todo lo escribe el entrenador; la IA solo ayuda a ordenar su texto.
import { NIVELES, type Nivel } from '../sistemas/tipos';
import { enlaceValido, type Recurso } from './recursos';
import { etiquetasLimpias } from './organizar';

const CLAVE = 'horns.fichas';

export const CATEGORIAS = ['Tiro', 'Pase', 'Defensa', 'Transición', 'Juego reducido', 'Calentamiento', 'Bote', 'Rebote', 'Otra'] as const;

export interface Ficha {
  id: string;
  nombre: string;
  objetivo: string;
  categoria: string;
  nivel: Nivel | '';
  /** «Infantil, 11-12 años». */
  edad: string;
  jugadoras: string;
  material: string;
  espacio: string;
  minutos: number;
  pasos: string[];
  consejos: string;
  variantes: string;
  /** Enlace de origen, siempre http/https; se enseña como «Fuente». */
  fuente: string;
  recursoId?: string;
  etiquetas: string[];
  coleccion: string;
  favorita: boolean;
  /** Pizarra opcional: id de una jugada del libro o propia. */
  sistemaId?: string;
}

const NIVELES_ID: string[] = NIVELES.map((n) => n.id);
const nuevoId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const nuevaFicha = (recurso?: Recurso): Ficha => ({
  id: nuevoId(),
  nombre: recurso?.titulo ?? '',
  objetivo: '',
  categoria: '',
  nivel: '',
  edad: '',
  jugadoras: '',
  material: '',
  espacio: '',
  minutos: 10,
  pasos: [''],
  consejos: '',
  variantes: '',
  fuente: recurso?.enlace ?? '',
  recursoId: recurso?.id,
  etiquetas: [],
  coleccion: recurso?.coleccion ?? '',
  favorita: false,
});

/** Falta el nombre: es lo único obligatorio. */
export const fichaCompleta = (f: Ficha) => f.nombre.trim().length > 0;

/** Los pasos sin texto no cuentan. */
export const pasosDe = (f: Ficha) => f.pasos.map((p) => p.trim()).filter(Boolean);

export function limpiarFichas(datos: unknown): Ficha[] {
  if (!Array.isArray(datos)) return [];
  const vistos = new Set<string>();
  const sal: Ficha[] = [];
  const t = (v: unknown, max = 3000) => (typeof v === 'string' ? v.slice(0, max) : '');
  for (const x of datos as Partial<Ficha>[]) {
    if (!x || typeof x.id !== 'string' || vistos.has(x.id) || !t(x.nombre, 200).trim()) continue;
    const fuente = typeof x.fuente === 'string' && x.fuente ? enlaceValido(x.fuente) : '';
    if (fuente === undefined) continue;
    vistos.add(x.id);
    sal.push({
      id: x.id.slice(0, 40),
      nombre: t(x.nombre, 200),
      objetivo: t(x.objetivo),
      categoria: t(x.categoria, 40),
      nivel: NIVELES_ID.includes(x.nivel as string) ? (x.nivel as Nivel) : '',
      edad: t(x.edad, 60),
      jugadoras: t(x.jugadoras, 60),
      material: t(x.material, 300),
      espacio: t(x.espacio, 100),
      minutos: Number.isFinite(x.minutos) ? Math.min(120, Math.max(1, Math.round(x.minutos as number))) : 10,
      pasos: Array.isArray(x.pasos) ? x.pasos.filter((p): p is string => typeof p === 'string').map((p) => p.slice(0, 500)).slice(0, 30) : [],
      consejos: t(x.consejos),
      variantes: t(x.variantes),
      fuente,
      etiquetas: etiquetasLimpias(x.etiquetas),
      coleccion: t(x.coleccion, 40).trim(),
      favorita: x.favorita === true,
      recursoId: typeof x.recursoId === 'string' ? x.recursoId.slice(0, 40) : undefined,
      sistemaId: typeof x.sistemaId === 'string' ? x.sistemaId.slice(0, 80) : undefined,
    });
  }
  return sal;
}

export function leerFichas(): Ficha[] {
  try {
    return limpiarFichas(JSON.parse(localStorage.getItem(CLAVE) ?? '[]'));
  } catch {
    return [];
  }
}

export function guardarFichas(lista: Ficha[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpiarFichas(lista)));
    return true;
  } catch {
    return false;
  }
}

export function juntarFichas(actuales: Ficha[], deLaCopia: Ficha[]): Ficha[] {
  const ids = new Set(deLaCopia.map((f) => f.id));
  return [...actuales.filter((f) => !ids.has(f.id)), ...deLaCopia];
}

/** Cuántas fichas salen de cada recurso (para enseñarlo en la bandeja). */
export const fichasDe = (fichas: Ficha[], recursoId: string) => fichas.filter((f) => f.recursoId === recursoId);

/** Los bloques de una sesión que vienen de «Mis ejercicios» llevan este prefijo en lugar del id de la biblioteca. */
export const PREFIJO_FICHA = 'ficha~';
export const idBloqueFicha = (f: Ficha) => `${PREFIJO_FICHA}${f.id}`;
export const fichaDeBloque = (id: string): Ficha | undefined => (id.startsWith(PREFIJO_FICHA) ? leerFichas().find((f) => f.id === id.slice(PREFIJO_FICHA.length)) : undefined);
