// Partido en directo (senior): puntos y faltas por jugador, y avisos para el banquillo. Reglas FIBA: 5 faltas y fuera.
export interface Linea {
  /** Puntos y faltas personales. */
  p: number;
  f: number;
}
export type Directo = Record<string, Linea>;

export const FALTAS_FUERA = 5;

const linea = (d: Directo | undefined, id: string): Linea => d?.[id] ?? { p: 0, f: 0 };

/** Suma (o resta con un número negativo) puntos a un jugador; nunca baja de 0. */
export function sumarPuntos(d: Directo | undefined, id: string, n: number): Directo {
  const l = linea(d, id);
  return { ...d, [id]: { ...l, p: Math.max(0, l.p + n) } };
}

/** Apunta (o quita) una falta; entre 0 y 5. */
export function ponerFalta(d: Directo | undefined, id: string, delta: 1 | -1): Directo {
  const l = linea(d, id);
  return { ...d, [id]: { ...l, f: Math.min(FALTAS_FUERA, Math.max(0, l.f + delta)) } };
}

export const totalPuntos = (d: Directo | undefined) => Object.values(d ?? {}).reduce((a, l) => a + l.p, 0);

export function estadoFaltas(f: number): 'fuera' | 'peligro' | 'ok' {
  return f >= FALTAS_FUERA ? 'fuera' : f === FALTAS_FUERA - 1 ? 'peligro' : 'ok';
}

/** Jugadores a vigilar desde el banquillo: ya fuera o con 4 faltas. */
export const avisosFaltas = (d: Directo | undefined) =>
  Object.entries(d ?? {}).flatMap(([id, l]) => (estadoFaltas(l.f) === 'ok' ? [] : [{ id, estado: estadoFaltas(l.f) as 'fuera' | 'peligro' }]));

/** Deja solo líneas válidas. */
export function limpiarDirecto(x: unknown): Directo | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const salida: Directo = {};
  for (const [id, v] of Object.entries(x as Record<string, Linea>)) {
    if (!id || !v || !Number.isInteger(v.p) || !Number.isInteger(v.f)) continue;
    const l = { p: Math.min(300, Math.max(0, v.p)), f: Math.min(FALTAS_FUERA, Math.max(0, v.f)) };
    if (l.p || l.f) salida[id] = l;
  }
  return Object.keys(salida).length ? salida : undefined;
}
