// «Seguir donde lo dejaste»: la última jugada abierta y el paso en que se quedó (solo en este móvil).
const CLAVE = 'horns.ultima';

export interface Ultima {
  id: string;
  paso: number;
}

export function leerUltima(): Ultima | null {
  try {
    const u = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    return u && typeof u.id === 'string' && Number.isInteger(u.paso) ? u : null;
  } catch {
    return null;
  }
}

export function guardarUltima(u: Ultima) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(u));
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
}
