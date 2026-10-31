// Habilidades del equipo (vuelta 5 del loop Diario): lo que el equipo hace bien y lo que hay que trabajar,
// y las etiquetas que enlazan cada ejercicio y jugada de la biblioteca con esas habilidades.
// Todo vive solo en este móvil. La lista de partida sale de los contenidos de formación del baloncesto de base (Cadete) y se puede cambiar.

export type Estado = 'fuerte' | 'normal' | 'trabajar';

export const ESTADOS: { id: Estado; nombre: string }[] = [
  { id: 'fuerte', nombre: 'Fuerte' },
  { id: 'normal', nombre: 'Normal' },
  { id: 'trabajar', nombre: 'A trabajar' },
];

export interface HabilidadEquipo {
  /** Id del catálogo (`transicion`) o propio (`h…`). */
  id: string;
  nombre: string;
  estado: Estado;
  /** Cómo la entrenamos. */
  como: string;
  /** Nivel de 1 a 5 para el radar (opcional). */
  nivel?: number;
}

/** Lista inicial; `claves` son palabras que, si salen en el nombre del ejercicio o la jugada, sugieren la etiqueta. */
export const CATALOGO: { id: string; nombre: string; claves: string[] }[] = [
  { id: 'transicion', nombre: 'Transición', claves: ['contraataque', 'transición', 'transicion', 'salida', 'continuidad'] },
  { id: 'presion', nombre: 'Defensa presionante', claves: ['presión', 'presion', 'presionante', 'toda la pista'] },
  { id: 'zona', nombre: 'Defensa de zona', claves: ['zona'] },
  { id: 'ayudas', nombre: 'Ayudas y rotaciones', claves: ['ayuda', 'rotación', 'rotacion', 'cambia', 'cambio de defensa', 'pasa por detrás'] },
  { id: 'tiro', nombre: 'Tiro exterior', claves: ['tiro', 'triple', 'lanzamiento', 'puntos dobles'] },
  { id: 'finalizacion', nombre: 'Finalización cerca del aro', claves: ['bandeja', 'entrada', 'finaliza', 'continuación', 'continuacion'] },
  { id: 'uno', nombre: '1x1', claves: ['1x1', 'uno contra uno', 'mano a mano'] },
  { id: 'pase', nombre: 'Pase y visión', claves: ['pase', 'pasa ', 'lectura', 'elegir lado', 'opciones'] },
  { id: 'bloqueos', nombre: 'Bloqueos y pick & roll', claves: ['bloqueo', 'pick', 'codo', 'ciego'] },
  { id: 'reb-of', nombre: 'Rebote ofensivo', claves: ['rebote ofensivo'] },
  { id: 'reb-def', nombre: 'Rebote defensivo', claves: ['rebote defensivo', 'bloqueo de rebote', 'caja'] },
  { id: 'fundamentos', nombre: 'Pies y fundamentos', claves: ['pies', 'parada', 'pivote', 'fundamento', 'corte'] },
];

const esTexto = (x: unknown): x is string => typeof x === 'string';

export function esHabilidad(h: unknown): h is HabilidadEquipo {
  const x = h as HabilidadEquipo;
  return (
    !!x && esTexto(x.id) && !!x.id && esTexto(x.nombre) && !!x.nombre.trim() && esTexto(x.como) &&
    ESTADOS.some((e) => e.id === x.estado) &&
    (x.nivel === undefined || (Number.isInteger(x.nivel) && x.nivel >= 1 && x.nivel <= 5))
  );
}

/** Deja solo lo válido, sin ids repetidos. */
export function limpiarHabilidades(h: unknown): HabilidadEquipo[] {
  if (!Array.isArray(h)) return [];
  const vistas = new Set<string>();
  return h.filter(esHabilidad).filter((x) => (vistas.has(x.id) ? false : (vistas.add(x.id), true)));
}

export const nuevaHabilidad = (nombre: string, id?: string): HabilidadEquipo => ({
  id: id ?? `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
  nombre: nombre.trim(),
  estado: 'normal',
  como: '',
});

export const nombreDeHabilidad = (hs: HabilidadEquipo[], id: string) => hs.find((h) => h.id === id)?.nombre ?? CATALOGO.find((c) => c.id === id)?.nombre ?? id;

/** Etiquetas que se sugieren por las palabras del texto. */
export function sugerir(texto: string): string[] {
  const t = texto.toLowerCase();
  return CATALOGO.filter((c) => c.claves.some((k) => t.includes(k))).map((c) => c.id);
}

// ---- Etiquetas puestas a mano, por ejercicio o jugada (id → habilidades) ----

const CLAVE = 'horns.etiquetas';

export type Etiquetas = Record<string, string[]>;

export function limpiarEtiquetas(e: unknown): Etiquetas {
  const salida: Etiquetas = {};
  if (!e || typeof e !== 'object' || Array.isArray(e)) return salida;
  for (const [k, v] of Object.entries(e as Record<string, unknown>)) if (Array.isArray(v) && v.every(esTexto)) salida[k] = [...new Set(v)];
  return salida;
}

export function leerEtiquetas(): Etiquetas {
  try {
    return limpiarEtiquetas(JSON.parse(localStorage.getItem(CLAVE) ?? '{}'));
  } catch {
    return {};
  }
}

export function guardarEtiquetas(e: Etiquetas): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpiarEtiquetas(e)));
    return true;
  } catch {
    return false;
  }
}

/** Las puestas a mano, o las sugeridas por el nombre si nadie las ha tocado. */
export const etiquetasDe = (id: string, texto: string, manuales: Etiquetas = leerEtiquetas()): string[] => manuales[id] ?? sugerir(texto);

/** Pone o quita una etiqueta; guarda siempre la lista completa (así «ninguna» también es una decisión). */
export function alternarEtiqueta(id: string, texto: string, habilidad: string, manuales: Etiquetas = leerEtiquetas()): Etiquetas {
  const actuales = etiquetasDe(id, texto, manuales);
  return { ...manuales, [id]: actuales.includes(habilidad) ? actuales.filter((x) => x !== habilidad) : [...actuales, habilidad] };
}
