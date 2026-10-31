// Rotación del partido (vuelta 6, opciones A+C de Adam): 4 cuartos de 10 minutos, 5 en pista por cuarto.
// Una rotación es la lista de jugadoras (por id) que juegan cada cuarto. Sin nombres, sin habilidades.
export const CUARTOS = 4;
export const MIN_CUARTO = 10;
export const EN_PISTA = 5;

export type Rotacion = string[][];

export const vacia = (): Rotacion => Array.from({ length: CUARTOS }, () => []);

/** Deja una rotación válida: 4 cuartos, solo ids conocidos, sin repetir y con 5 como máximo. */
export function limpiarRotacion(x: unknown, validos: ReadonlySet<string>): Rotacion | undefined {
  if (!Array.isArray(x) || x.length !== CUARTOS) return undefined;
  return x.map((q) => (Array.isArray(q) ? [...new Set(q.filter((id): id is string => typeof id === 'string' && validos.has(id)))].slice(0, EN_PISTA) : []));
}

export const minutos = (r: Rotacion, id: string) => r.filter((q) => q.includes(id)).length * MIN_CUARTO;

/** Poner o quitar a una jugadora de un cuarto; no deja pasar de 5 en pista. */
export function alternar(r: Rotacion, cuarto: number, id: string): Rotacion {
  const q = r[cuarto] ?? [];
  if (!q.includes(id) && q.length >= EN_PISTA) return r;
  return r.map((c, i) => (i !== cuarto ? c : c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
}

/** Reparte los cuartos lo más parejo posible: en cada uno entran las que menos han jugado y, a igualdad, las que se sentaron el cuarto anterior. */
export function repartir(ids: string[]): Rotacion {
  const jugados = new Map(ids.map((id) => [id, 0]));
  let anterior = new Set<string>();
  return Array.from({ length: CUARTOS }, () => {
    const orden = ids
      .map((id, i) => ({ id, i }))
      .sort((a, b) => jugados.get(a.id)! - jugados.get(b.id)! || Number(!anterior.has(a.id)) - Number(!anterior.has(b.id)) || a.i - b.i);
    const cuarto = orden.slice(0, EN_PISTA).map((o) => o.id);
    cuarto.forEach((id) => jugados.set(id, jugados.get(id)! + 1));
    anterior = new Set(cuarto);
    return cuarto;
  });
}

/** Cuartos que no tienen exactamente 5 en pista (para marcarlos en rojo). */
export const cuartosIncompletos = (r: Rotacion) => r.flatMap((q, i) => (q.length === EN_PISTA ? [] : [i]));
