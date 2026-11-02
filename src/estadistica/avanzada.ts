// Estadística avanzada (loop Herramienta diaria, tramo 4): más/menos (+/-), valoración, quintetos más usados,
// tendencia de la temporada y valoración por edad. Todo sale de la cronología del partido en directo; no se guarda nada nuevo.
// Solo ids de jugadora: los nombres se ponen en la pantalla, nunca aquí.
import { boxScore, type FilaBox, type Vivo } from '../partido/vivo';
import type { Evento, Temporada } from '../temporada/temporada';

/** Quién empezó en pista: se deshacen los cambios desde el final. */
export function quintetoInicial(v: Vivo): string[] {
  let pista = [...v.enPista];
  for (const j of [...v.cronologia].reverse()) {
    if (j.tipo !== 'cambio' || !j.j || !j.k) continue;
    pista = pista.filter((id) => id !== j.j);
    if (!pista.includes(j.k)) pista.push(j.k);
  }
  return pista;
}

export interface Tramo {
  jugadores: string[];
  /** Segundos juntos en pista. */
  seg: number;
  /** Puntos a favor y en contra mientras estuvieron juntos. */
  a: number;
  c: number;
}

export const llaveQuinteto = (ids: string[]) => [...ids].sort().join('|');

/** Recorre el partido y devuelve cada tramo entre cambios con su quinteto, su tiempo y sus puntos. */
export function tramosDe(v: Vivo | undefined): Tramo[] {
  if (!v || v.cronologia.length === 0) return [];
  let pista = quintetoInicial(v);
  let abierto: Tramo = { jugadores: pista, seg: 0, a: 0, c: 0 };
  const tramos: Tramo[] = [];
  let cuarto = v.cronologia[0].c;
  let previo = 0;
  const avanzar = (c: number, s: number) => {
    if (c !== cuarto) { cuarto = c; previo = 0; }
    abierto.seg += Math.max(0, s - previo);
    previo = Math.max(previo, s);
  };
  for (const j of v.cronologia) {
    avanzar(j.c, j.s);
    if (j.tipo === 'cambio' && j.j && j.k) {
      tramos.push(abierto);
      pista = [...pista.filter((id) => id !== j.k), j.j];
      abierto = { jugadores: pista, seg: 0, a: 0, c: 0 };
    } else if (j.tipo === 'c1' || j.tipo === 'c2' || j.tipo === 'c3') abierto.a += j.tipo === 'c1' ? 1 : j.tipo === 'c2' ? 2 : 3;
    else if (j.tipo === 'rival') abierto.c += j.v ?? 0;
  }
  avanzar(v.cuarto, v.segundos);
  tramos.push(abierto);
  return tramos.filter((t) => t.seg > 0 || t.a > 0 || t.c > 0);
}

/** +/- de cada jugadora en un partido: puntos a favor menos en contra mientras estuvo en pista. */
export function masMenos(v: Vivo | undefined): Record<string, number> {
  const pm: Record<string, number> = {};
  for (const t of tramosDe(v)) for (const id of t.jugadores) pm[id] = (pm[id] ?? 0) + t.a - t.c;
  return pm;
}

export interface QuintetoUsado extends Tramo {
  /** Diferencia de puntos (a favor menos en contra). */
  dif: number;
}

/** Los quintetos que más han jugado juntos en uno o varios partidos. Solo cuentan los de cinco. */
export function quintetosMasUsados(eventos: Pick<Evento, 'vivo'>[], max = 5): QuintetoUsado[] {
  const por = new Map<string, Tramo>();
  for (const e of eventos) {
    for (const t of tramosDe(e.vivo)) {
      if (t.jugadores.length !== 5) continue;
      const k = llaveQuinteto(t.jugadores);
      const x = por.get(k) ?? { jugadores: [...t.jugadores].sort(), seg: 0, a: 0, c: 0 };
      por.set(k, { ...x, seg: x.seg + t.seg, a: x.a + t.a, c: x.c + t.c });
    }
  }
  return [...por.values()].map((t) => ({ ...t, dif: t.a - t.c })).sort((x, y) => y.seg - x.seg).slice(0, max);
}

/** Valoración: puntos + rebotes + asistencias + robos − pérdidas − tiros de campo y libres fallados − faltas. */
export const valoracion = (f: Pick<FilaBox, 'p' | 'reb' | 'ast' | 'rob' | 'per' | 'f' | 'tcA' | 'tcI' | 'tlA' | 'tlI'>): number =>
  f.p + f.reb + f.ast + f.rob - f.per - (f.tcI - f.tcA) - (f.tlI - f.tlA) - f.f;

export interface Avanzada {
  id: string;
  partidos: number;
  /** Segundos jugados. */
  seg: number;
  mm: number;
  val: number;
  /** Valoración por 40 minutos; null si no jugó lo suficiente para que valga (menos de 10 minutos). */
  val40: number | null;
}

/** Por jugadora, sumando los partidos de la temporada que se apuntaron en directo. */
export function resumenAvanzado(t: Pick<Temporada, 'eventos'> | undefined): Avanzada[] {
  const acc = new Map<string, Avanzada>();
  for (const e of t?.eventos ?? []) {
    if (e.tipo !== 'partido' || !e.vivo || !e.directo) continue;
    const pm = masMenos(e.vivo);
    for (const f of boxScore(e.directo, e.vivo)) {
      const x = acc.get(f.id) ?? { id: f.id, partidos: 0, seg: 0, mm: 0, val: 0, val40: null };
      acc.set(f.id, { ...x, partidos: x.partidos + 1, seg: x.seg + f.min, mm: x.mm + (pm[f.id] ?? 0), val: x.val + valoracion(f) });
    }
  }
  return [...acc.values()].map((x) => ({ ...x, val40: x.seg >= 600 ? Math.round((x.val / x.seg) * 2400 * 10) / 10 : null })).sort((a, b) => b.val - a.val);
}

/** Media móvil de los últimos `ventana` valores (para ver la tendencia sin que un partido suelto la mueva). */
export function tendencia(valores: number[], ventana = 3): number[] {
  return valores.map((_, i) => {
    const trozo = valores.slice(Math.max(0, i - ventana + 1), i + 1);
    return Math.round((trozo.reduce((s, v) => s + v, 0) / trozo.length) * 10) / 10;
  });
}

/** Si la tendencia sube, baja o se queda igual entre el principio y el final de la serie. */
export function sentido(serie: number[], margen = 1): 'sube' | 'baja' | 'igual' {
  if (serie.length < 4) return 'igual';
  const mitad = Math.floor(serie.length / 2);
  const media = (l: number[]) => l.reduce((s, v) => s + v, 0) / l.length;
  const d = media(serie.slice(-mitad)) - media(serie.slice(0, mitad));
  return d > margen ? 'sube' : d < -margen ? 'baja' : 'igual';
}

/** Valoración por 40 minutos según la edad (año de la temporada menos año de nacimiento). Sin nombres. */
export function valoracionPorEdad(av: Avanzada[], nacimientos: Record<string, number | undefined>, anyo: number): { edad: number; jugadoras: number; val40: number }[] {
  const por = new Map<number, number[]>();
  for (const a of av) {
    const n = nacimientos[a.id];
    if (!n || a.val40 === null) continue;
    por.set(anyo - n, [...(por.get(anyo - n) ?? []), a.val40]);
  }
  return [...por.entries()].sort((x, y) => x[0] - y[0]).map(([edad, l]) => ({ edad, jugadoras: l.length, val40: Math.round((l.reduce((s, v) => s + v, 0) / l.length) * 10) / 10 }));
}
