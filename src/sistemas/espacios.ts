// Los 9 espacios de la cancha (Adam, 30/10): 5 fuera de la línea de tres y 4 dentro. Cada entrenador los puede mover y
// renombrar; Claude los recibe con el encargo y las jugadoras acaban cada paso en uno de ellos. Solo nombres de sitios.
import type { Punto } from './tipos';

const CLAVE = 'horns.espacios';

export interface Espacio {
  id: string;
  nombre: string;
  punto: Punto;
}

/** Los de siempre: fuera (exteriores) y dentro (interiores), en decímetros de la media pista (x 0–150, y 0–140). */
export const ESPACIOS_BASE: Espacio[] = [
  { id: 'esquina-izq', nombre: 'Esquina izquierda', punto: [8, 12] },
  { id: 'ala-izq', nombre: 'Ala izquierda', punto: [22, 60] },
  { id: 'frontal', nombre: 'Frontal', punto: [75, 85] },
  { id: 'ala-der', nombre: 'Ala derecha', punto: [128, 60] },
  { id: 'esquina-der', nombre: 'Esquina derecha', punto: [142, 12] },
  { id: 'poste-alto-izq', nombre: 'Poste alto izquierdo', punto: [50, 58] },
  { id: 'poste-alto-der', nombre: 'Poste alto derecho', punto: [100, 58] },
  { id: 'bloque-izq', nombre: 'Bloque izquierdo', punto: [52, 28] },
  { id: 'bloque-der', nombre: 'Bloque derecho', punto: [98, 28] },
];

const ANCHO = 150;
const FONDO = 140;
/** Margen con las líneas para que un punto no se salga de la pista. */
const BORDE = 4;
export const MAX_NOMBRE = 30;
const CANASTA: Punto = [75, 12];
const RADIO_TRES = 67.5;

const copiar = (e: Espacio[]): Espacio[] => e.map((x) => ({ ...x, punto: [...x.punto] as Punto }));
export const espaciosDeSiempre = (): Espacio[] => copiar(ESPACIOS_BASE);

/** Nombre limpio: una línea, sin HTML ni símbolos raros, corto. Vacío si no queda nada. */
export function nombreLimpio(t: unknown): string {
  if (typeof t !== 'string') return '';
  return t
    .replace(/<[^>]*>/g, '')
    .replace(/[<>&"`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NOMBRE);
}

const dentroDe = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const sujetarPunto = ([x, y]: Punto): Punto => [Math.round(dentroDe(x, BORDE, ANCHO - BORDE)), Math.round(dentroDe(y, BORDE, FONDO - BORDE))];

/** Fuera de la línea de tres (exterior) o dentro (interior). */
export function esExterior([x, y]: Punto): boolean {
  if (x < 9 || x > 141) return y < 26 || Math.hypot(x - CANASTA[0], y - CANASTA[1]) > RADIO_TRES;
  return Math.hypot(x - CANASTA[0], y - CANASTA[1]) > RADIO_TRES;
}

/** Lee lo que haya guardado; si falta algo o está mal, ese espacio vuelve al de siempre. Siempre devuelve los 9. */
export function leerEspacios(): Espacio[] {
  let crudo: unknown;
  try {
    crudo = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
  } catch {
    return espaciosDeSiempre();
  }
  return validarEspacios(crudo);
}

export function validarEspacios(crudo: unknown): Espacio[] {
  const lista = Array.isArray(crudo) ? crudo : [];
  return ESPACIOS_BASE.map((base) => {
    const x = lista.find((e) => e && typeof e === 'object' && (e as Espacio).id === base.id) as Partial<Espacio> | undefined;
    const p = x?.punto;
    const punto: Punto = Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n)) ? sujetarPunto([p[0], p[1]]) : [...base.punto];
    return { id: base.id, nombre: nombreLimpio(x?.nombre) || base.nombre, punto };
  });
}

/** Guarda los espacios. Falso si el móvil no deja. */
export function guardarEspacios(e: Espacio[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(validarEspacios(e)));
    return true;
  } catch {
    return false;
  }
}

export function volverAEspaciosDeSiempre() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: ya están los de siempre */
  }
}

/** El espacio más cercano a un punto. Con varios a la misma distancia, el primero de la lista. */
export function espacioMasCercano(p: Punto, espacios: Espacio[] = leerEspacios()): Espacio {
  let mejor = espacios[0];
  let d = Infinity;
  for (const e of espacios) {
    const dd = Math.hypot(e.punto[0] - p[0], e.punto[1] - p[1]);
    if (dd < d) { d = dd; mejor = e; }
  }
  return mejor;
}

/** Las jugadoras (de un ejercicio) que se quedan a medias se ponen en el espacio más cercano si está a menos de `radio`. */
export function pegarAEspacio(p: Punto, espacios: Espacio[], radio = 15): Punto {
  const e = espacioMasCercano(p, espacios);
  return Math.hypot(e.punto[0] - p[0], e.punto[1] - p[1]) <= radio ? [...e.punto] as Punto : p;
}

/** El texto que se añade al encargo para Claude: los espacios de este entrenador, con sus nombres y puntos. */
export function textoEspacios(espacios: Espacio[] = leerEspacios()): string {
  const f = (e: Espacio) => `- ${e.nombre}: [${e.punto[0]},${e.punto[1]}]`;
  const fuera = espacios.filter((e) => esExterior(e.punto)).map(f);
  const dentro = espacios.filter((e) => !esExterior(e.punto)).map(f);
  return [
    'The coach uses these 9 court spaces, with these names and exact points (they replace the default spaces of the court guide):',
    `OUTSIDE the three-point line (perimeter players):\n${fuera.join('\n') || '- none'}`,
    `INSIDE the three-point line (inside players):\n${dentro.join('\n') || '- none'}`,
    'Players start and end every step in one of these spaces. Use the coach\'s names in the step texts.',
  ].join('\n');
}
