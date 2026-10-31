// Diario de dos minutos tras el entreno (vuelta 5): cómo ha ido, qué funcionó, qué no y qué repetir.
// Se guarda solo en este móvil y entra en la copia de seguridad. Sin nombres de jugadoras: es del equipo.

const CLAVE = 'horns.reflexiones';

export const ANIMOS = [
  { id: 1, icono: '😕', nombre: 'Mal' },
  { id: 2, icono: '😐', nombre: 'Regular' },
  { id: 3, icono: '🙂', nombre: 'Bien' },
  { id: 4, icono: '😄', nombre: 'Muy bien' },
] as const;

export interface Reflexion {
  id: string;
  /** AAAA-MM-DD */
  fecha: string;
  equipoId: string;
  animo: 1 | 2 | 3 | 4;
  funciono: string;
  no: string;
  proximo: string;
}

export const nuevaReflexion = (equipoId: string, fecha: string): Reflexion => ({
  id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
  fecha,
  equipoId,
  animo: 3,
  funciono: '',
  no: '',
  proximo: '',
});

const txt = (x: unknown): x is string => typeof x === 'string';

export const esReflexion = (r: unknown): r is Reflexion => {
  const x = r as Reflexion;
  return !!x && ['id', 'fecha', 'equipoId', 'funciono', 'no', 'proximo'].every((k) => txt(x[k as keyof Reflexion])) && ANIMOS.some((a) => a.id === x.animo);
};

export const limpiarReflexiones = (l: unknown): Reflexion[] => (Array.isArray(l) ? l.filter(esReflexion) : []);

/** Una entrada vacía (solo el ánimo por defecto) no se guarda. */
export const vacia = (r: Reflexion) => !r.funciono.trim() && !r.no.trim() && !r.proximo.trim();

/** Más recientes primero. */
export const recientes = (l: Reflexion[], equipoId: string) => l.filter((r) => r.equipoId === equipoId).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));

export function leerReflexiones(): Reflexion[] {
  try {
    return limpiarReflexiones(JSON.parse(localStorage.getItem(CLAVE) ?? '[]'));
  } catch {
    return [];
  }
}

export function guardarReflexiones(l: Reflexion[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpiarReflexiones(l)));
    return true;
  } catch {
    return false;
  }
}

/** Junta las de una copia con las actuales: si coincide el id, gana la copia. */
export function juntarReflexiones(actuales: Reflexion[], copia: Reflexion[]): Reflexion[] {
  const ids = new Set(copia.map((r) => r.id));
  return [...actuales.filter((r) => !ids.has(r.id)), ...copia];
}
