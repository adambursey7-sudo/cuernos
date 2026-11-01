// Listas que son de cada equipo (las estrellas y el libro de «esta semana»), sin romper lo que ya se había guardado.
// Antes había una sola lista para todo el móvil: sigue valiendo como punto de partida de cada equipo hasta que ese equipo
// la toca por primera vez; entonces se guarda su lista propia. Con un solo equipo (o ninguno) todo funciona igual que antes.
const CLAVE_ACTIVO = 'horns.equipoActivo';

export type Lista = 'favoritos' | 'semana';

const claveGlobal = (lista: Lista) => `horns.${lista}`;
const clave = (lista: Lista, equipoId: string) => (equipoId ? `horns.${lista}.${equipoId}` : claveGlobal(lista));

const textos = (crudo: string | null): string[] | undefined => {
  if (crudo === null) return undefined;
  try {
    const l = JSON.parse(crudo);
    return Array.isArray(l) ? l.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export function leerActivoId(): string {
  try {
    return localStorage.getItem(CLAVE_ACTIVO) ?? '';
  } catch {
    return '';
  }
}

/** La lista del equipo; si aún no tiene propia, la de siempre. */
export function leerLista(lista: Lista, equipoId = leerActivoId()): string[] {
  try {
    return textos(localStorage.getItem(clave(lista, equipoId))) ?? textos(localStorage.getItem(claveGlobal(lista))) ?? [];
  } catch {
    return [];
  }
}

/** Guarda la lista de un equipo (la global si no hay equipo). Devuelve false si el móvil no deja. */
export function guardarLista(lista: Lista, valor: string[], equipoId = leerActivoId()): boolean {
  try {
    localStorage.setItem(clave(lista, equipoId), JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

/** Las listas propias de cada equipo (para la copia de seguridad). */
export function listasPropias(lista: Lista): Record<string, string[]> {
  const salida: Record<string, string[]> = {};
  try {
    const prefijo = `horns.${lista}.`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefijo)) salida[k.slice(prefijo.length)] = textos(localStorage.getItem(k)) ?? [];
    }
  } catch {
    /* sin almacenamiento: no hay nada que copiar */
  }
  return salida;
}

/** Quita la lista propia de un equipo borrado. */
export function olvidarListas(equipoId: string): void {
  try {
    for (const l of ['favoritos', 'semana'] as const) localStorage.removeItem(clave(l, equipoId));
  } catch {
    /* sin almacenamiento */
  }
}

/** Limpia lo que trae una copia: solo ids de equipos que existen y listas de textos. */
export function limpiarPorEquipo(x: unknown, equipos: ReadonlySet<string> | undefined): Record<string, string[]> {
  const salida: Record<string, string[]> = {};
  if (!x || typeof x !== 'object') return salida;
  for (const [id, v] of Object.entries(x as Record<string, unknown>)) {
    if (equipos && !equipos.has(id)) continue;
    if (Array.isArray(v)) salida[id] = v.filter((s): s is string => typeof s === 'string' && s.length < 200).slice(0, 1000);
  }
  return salida;
}

/** Las listas efectivas de un solo equipo (con la de siempre si no tiene propia), para su copia de seguridad. */
export const listasDeEquipo = (equipoId: string) => ({
  favoritos: { [equipoId]: leerLista('favoritos', equipoId) },
  semana: { [equipoId]: leerLista('semana', equipoId) },
});

/** Copia las dos listas de un equipo a otro (al duplicar). */
export function copiarListas(deId: string, aId: string): void {
  for (const l of ['favoritos', 'semana'] as const) guardarLista(l, leerLista(l, deId), aId);
}
