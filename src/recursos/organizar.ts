// Colecciones, etiquetas, favoritos y búsqueda, comunes a los recursos y a las fichas de ejercicio (tramo 3).
export interface Organizable {
  coleccion: string;
  etiquetas: string[];
  favorito?: boolean;
  favorita?: boolean;
}

export function etiquetasLimpias(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const sal: string[] = [];
  for (const e of v) {
    const t = typeof e === 'string' ? e.trim().slice(0, 30) : '';
    if (t && !sal.some((x) => x.toLowerCase() === t.toLowerCase())) sal.push(t);
  }
  return sal.slice(0, 20);
}

/** «tiro, 1x1 ,» → ['tiro', '1x1']. */
export const etiquetasDeTexto = (texto: string) => etiquetasLimpias(texto.split(','));

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Todas las palabras que escribes tienen que aparecer en alguno de los textos (sin mirar mayúsculas ni tildes). */
export function coincide(consulta: string, textos: string[]): boolean {
  const palabras = sinTildes(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const pajar = sinTildes(textos.join(' \n '));
  return palabras.every((p) => pajar.includes(p));
}

/** Colecciones que existen en la lista, ordenadas. */
export const coleccionesDe = (lista: { coleccion: string }[]) =>
  [...new Set(lista.map((x) => x.coleccion).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

export interface Filtro {
  texto: string;
  /** undefined = todas; '' = sin colección. */
  coleccion?: string;
  soloFavoritos: boolean;
}

export const esFavorito = (x: Organizable) => x.favorito === true || x.favorita === true;

export function filtrarOrganizables<T extends Organizable>(lista: T[], f: Filtro, textosDe: (x: T) => string[]): T[] {
  return lista.filter(
    (x) =>
      (f.coleccion === undefined || x.coleccion === f.coleccion) &&
      (!f.soloFavoritos || esFavorito(x)) &&
      coincide(f.texto, [...textosDe(x), ...x.etiquetas, x.coleccion]),
  );
}
