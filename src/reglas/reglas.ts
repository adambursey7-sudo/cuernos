// Reglas de la competición de cada equipo: periodos, minutos y faltas. Por defecto, las de FIBA (4 x 10, 5 faltas).
// Sirven para la rotación (columnas y minutos), el partido en directo (faltas) y para que cada competición tenga las suyas.
export interface Reglas {
  periodos: number;
  /** Minutos de cada periodo. */
  minutos: number;
  /** Faltas personales para quedar fuera. */
  faltas: number;
  /** Notas libres de la competición (descansos, tiempos muertos, categoría…). */
  notas?: string;
}

export const REGLAS_FIBA: Reglas = { periodos: 4, minutos: 10, faltas: 5 };

export const PLANTILLAS_REGLAS: { id: string; nombre: string; reglas: Reglas }[] = [
  { id: 'fiba', nombre: 'FIBA 4 × 10', reglas: REGLAS_FIBA },
  { id: 'formacion', nombre: 'Formación 4 × 8', reglas: { periodos: 4, minutos: 8, faltas: 5 } },
  { id: 'tres', nombre: '3 × 8', reglas: { periodos: 3, minutos: 8, faltas: 5 } },
];

const entre = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : undefined);

/** Deja unas reglas válidas o undefined si no hay nada que valga. */
export function limpiarReglas(x: unknown): Reglas | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const r = x as Reglas;
  const periodos = entre(r.periodos, 1, 6);
  const minutos = entre(r.minutos, 1, 20);
  const faltas = entre(r.faltas, 3, 7);
  if (periodos === undefined || minutos === undefined || faltas === undefined) return undefined;
  const notas = typeof r.notas === 'string' && r.notas.trim() ? r.notas.trim().slice(0, 400) : undefined;
  return { periodos, minutos, faltas, ...(notas ? { notas } : {}) };
}

/** Las del equipo, o las de FIBA si no ha puesto otras. */
export const reglasDe = (e?: { reglas?: Reglas }): Reglas => limpiarReglas(e?.reglas) ?? REGLAS_FIBA;

/** Texto corto: «3 × 8 min · 5 faltas». */
export const resumenReglas = (r: Reglas) => `${r.periodos} × ${r.minutos} min · ${r.faltas} faltas`;

export const sonFiba = (r: Reglas) => r.periodos === REGLAS_FIBA.periodos && r.minutos === REGLAS_FIBA.minutos && r.faltas === REGLAS_FIBA.faltas && !r.notas;
