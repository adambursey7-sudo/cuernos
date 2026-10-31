// Libro de jugadas del equipo: las favoritas (estrella) y las que se trabajan «esta semana». Solo en este móvil.
const CLAVE = 'horns.semana';

export function leerSemana(): string[] {
  try {
    const l = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(l) ? l.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Devuelve la lista con la jugada puesta o quitada de «esta semana» y la guarda. */
export function alternarSemana(lista: string[], id: string): string[] {
  const nueva = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nueva));
  } catch {
    /* sin almacenamiento: dura hasta cerrar la app */
  }
  return nueva;
}

/** Quita las jugadas que ya no existen (una propia borrada). */
export const semanaVigente = (lista: string[], existentes: ReadonlySet<string>) => lista.filter((id) => existentes.has(id));
