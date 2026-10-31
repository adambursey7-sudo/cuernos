// Habilidades por edad (vuelta 8, A+B elegida por Adam): una guía por categoría de las habilidades que toca priorizar
// (★) y las que vienen más adelante, y un filtro que las deja fuera de las sesiones que monta la app.
// La categoría sale del nombre del equipo («Cadete femenino»); no se pide ninguna fecha de nacimiento.
// La guía es orientativa y de la app, no de una federación.

export interface CategoriaEdad {
  id: string;
  nombre: string;
  /** Palabras del nombre del equipo que la identifican (sin tildes y en minúsculas). */
  palabras: string[];
  /** Ids de CATALOGO que toca priorizar a esta edad. */
  prioridad: string[];
  /** Ids de CATALOGO que todavía no tocan: el filtro las deja fuera de las sesiones. */
  masAdelante: string[];
}

/** De pequeñas a mayores; «premini» va antes que «mini» porque lo contiene. */
export const CATEGORIAS_EDAD: CategoriaEdad[] = [
  { id: 'premini', nombre: 'Premini', palabras: ['premini'], prioridad: ['fundamentos', 'pase', 'finalizacion'], masAdelante: ['zona', 'presion', 'ayudas', 'bloqueos', 'reb-of', 'reb-def'] },
  { id: 'mini', nombre: 'Mini', palabras: ['mini'], prioridad: ['fundamentos', 'uno', 'pase', 'finalizacion'], masAdelante: ['zona', 'presion', 'ayudas', 'bloqueos'] },
  { id: 'infantil', nombre: 'Infantil', palabras: ['infantil'], prioridad: ['fundamentos', 'uno', 'tiro', 'transicion'], masAdelante: ['bloqueos'] },
  { id: 'cadete', nombre: 'Cadete', palabras: ['cadete'], prioridad: ['uno', 'tiro', 'ayudas', 'transicion'], masAdelante: [] },
  { id: 'junior', nombre: 'Júnior', palabras: ['junior'], prioridad: ['bloqueos', 'ayudas', 'reb-of', 'tiro'], masAdelante: [] },
];

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** La categoría que dice el nombre del equipo, o ninguna si no se reconoce. */
export function categoriaDeEquipo(nombre: string): CategoriaEdad | undefined {
  const t = sinTildes(nombre);
  return CATEGORIAS_EDAD.find((c) => c.palabras.some((p) => t.includes(p)));
}

export const tocaPriorizar = (c: CategoriaEdad | undefined, habilidad: string) => !!c && c.prioridad.includes(habilidad);

/** Quita lo que todavía no toca a esta edad y avisa de qué se ha quitado. Sin categoría o con el filtro apagado, no toca nada. */
export function porEdad<T extends { h: { id: string; nombre: string } }>(flojos: T[], c: CategoriaEdad | undefined, activo: boolean): { flojos: T[]; quitadas: string[] } {
  if (!c || !activo) return { flojos, quitadas: [] };
  const fuera = (f: T) => c.masAdelante.includes(f.h.id);
  return { flojos: flojos.filter((f) => !fuera(f)), quitadas: flojos.filter(fuera).map((f) => f.h.nombre) };
}

const CLAVE = 'horns.filtroEdad';

/** Encendido por defecto (elegido por Adam). */
export function leerFiltroEdad(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== 'no';
  } catch {
    return true;
  }
}

export function guardarFiltroEdad(activo: boolean): void {
  try {
    localStorage.setItem(CLAVE, activo ? 'si' : 'no');
  } catch {
    /* sin almacenamiento: se queda en el valor de esta sesión */
  }
}
