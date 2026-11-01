// Estadística y progreso (loop Pro, tramo 5): tendencias por partido, por jugadora y por equipo, comparación de dos partidos,
// récords y rachas de asistencia. Todo se calcula en el móvil con lo que ya hay en la temporada; no se guarda nada nuevo.
import { diasEntre, lunesDe, sumarDias } from '../temporada/fechas';
import type { Evento, Temporada } from '../temporada/temporada';
import type { Vivo } from '../partido/vivo';
import { asistenciaSemana, jugados, type Marca } from './resumen';

export interface FilaPartido {
  id: string;
  fecha: string;
  rival: string;
  marca: Marca;
  a: number;
  c: number;
  /** Tiros de campo (2 y 3), triples y libres: anotados e intentados. Solo hay si el partido se apuntó en directo. */
  tcA: number; tcI: number; t3A: number; t3I: number; tlA: number; tlI: number;
  reb: number; ast: number; rob: number; per: number; f: number;
  /** El partido se apuntó con jugadas (tiros): si no, solo se sabe el resultado y los puntos de cada una. */
  detalle: boolean;
}

const cuentaTipos = (v: Vivo | undefined, ...t: string[]) => (v?.cronologia ?? []).filter((j) => t.includes(j.tipo)).length;
const suma = (e: Evento, campo: 'reb' | 'ast' | 'rob' | 'per' | 'f') => Object.values(e.directo ?? {}).reduce((n, l) => n + (l[campo] ?? 0), 0);

/** Un partido jugado, con todo lo que se sepa de él, del más antiguo al más reciente. */
export function filasPartidos(t: Pick<Temporada, 'eventos'> | undefined): FilaPartido[] {
  return jugados(t).map(({ evento: e, marca, a, c }) => ({
    id: e.id, fecha: e.fecha, rival: e.titulo || 'Sin rival', marca, a, c,
    tcA: cuentaTipos(e.vivo, 'c2', 'c3'), tcI: cuentaTipos(e.vivo, 'c2', 'c3', 'f2', 'f3'),
    t3A: cuentaTipos(e.vivo, 'c3'), t3I: cuentaTipos(e.vivo, 'c3', 'f3'),
    tlA: cuentaTipos(e.vivo, 'c1'), tlI: cuentaTipos(e.vivo, 'c1', 'f1'),
    reb: suma(e, 'reb'), ast: suma(e, 'ast'), rob: suma(e, 'rob'), per: suma(e, 'per'), f: suma(e, 'f'),
    detalle: !!e.vivo && e.vivo.cronologia.length > 0,
  }));
}

export const pct = (a: number, i: number): number | null => (i > 0 ? Math.round((a / i) * 100) : null);

export interface PuntoSerie {
  fecha: string;
  etiqueta: string;
  valor: number | null;
}

export type MetricaEquipo = 'puntos' | 'recibidos' | 'tc' | 't3' | 'tl' | 'diferencia';
export const METRICAS_EQUIPO: [MetricaEquipo, string][] = [['puntos', 'Puntos'], ['recibidos', 'Recibidos'], ['diferencia', 'Diferencia'], ['tc', '% tiro'], ['t3', '% triples'], ['tl', '% libres']];

export function valorMetrica(f: FilaPartido, m: MetricaEquipo): number | null {
  switch (m) {
    case 'puntos': return f.a;
    case 'recibidos': return f.c;
    case 'diferencia': return f.a - f.c;
    case 'tc': return pct(f.tcA, f.tcI);
    case 't3': return pct(f.t3A, f.t3I);
    case 'tl': return pct(f.tlA, f.tlI);
  }
}

export const serieEquipo = (filas: FilaPartido[], m: MetricaEquipo): PuntoSerie[] => filas.map((f) => ({ fecha: f.fecha, etiqueta: f.rival, valor: valorMetrica(f, m) }));

export type MetricaJugadora = 'p' | 'reb' | 'ast' | 'rob' | 'min' | 'tc';
export const METRICAS_JUGADORA: [MetricaJugadora, string][] = [['p', 'Puntos'], ['reb', 'Rebotes'], ['ast', 'Asistencias'], ['rob', 'Robos'], ['min', 'Minutos'], ['tc', '% tiro']];

export interface PartidoJugadora {
  fecha: string;
  rival: string;
  p: number; reb: number; ast: number; rob: number; per: number; f: number;
  /** Minutos redondeados (0 si no se apuntaron). */
  min: number;
  tcA: number; tcI: number;
  /** Jugó o sumó algo: si no hay nada apuntado, no cuenta como partido suyo. */
  jugo: boolean;
}

/** Lo que hizo una jugadora en cada partido en que hay algo apuntado de ella. */
export function partidosDe(t: Pick<Temporada, 'eventos'> | undefined, id: string): PartidoJugadora[] {
  return jugados(t).flatMap(({ evento: e }) => {
    const l = e.directo?.[id];
    const seg = e.vivo?.min[id] ?? 0;
    const suyas = (e.vivo?.cronologia ?? []).filter((j) => j.j === id);
    if (!l && !seg && !suyas.length) return [];
    return [{
      fecha: e.fecha, rival: e.titulo || 'Sin rival', p: l?.p ?? 0, reb: l?.reb ?? 0, ast: l?.ast ?? 0, rob: l?.rob ?? 0, per: l?.per ?? 0, f: l?.f ?? 0, min: Math.round(seg / 60),
      tcA: suyas.filter((j) => j.tipo === 'c2' || j.tipo === 'c3').length, tcI: suyas.filter((j) => ['c2', 'c3', 'f2', 'f3'].includes(j.tipo)).length, jugo: true,
    }];
  });
}

export function valorJugadora(p: PartidoJugadora, m: MetricaJugadora): number | null {
  return m === 'tc' ? pct(p.tcA, p.tcI) : p[m];
}

/** Récords personales: el mejor valor de cada apartado y cuándo fue. */
export function recordsJugadora(ps: PartidoJugadora[]): { clave: MetricaJugadora; nombre: string; valor: number; fecha: string }[] {
  const salida: { clave: MetricaJugadora; nombre: string; valor: number; fecha: string }[] = [];
  for (const [clave, nombre] of METRICAS_JUGADORA) {
    if (clave === 'tc') continue;
    let mejor: PartidoJugadora | undefined;
    for (const p of ps) if (p[clave] > 0 && (!mejor || p[clave] > mejor[clave])) mejor = p;
    if (mejor) salida.push({ clave, nombre, valor: mejor[clave], fecha: mejor.fecha });
  }
  return salida;
}

export interface Record {
  nombre: string;
  valor: string;
  /** Contra quién y cuándo. */
  detalle: string;
}

/** Récords del equipo en lo que va de temporada. */
export function recordsEquipo(filas: FilaPartido[]): Record[] {
  if (!filas.length) return [];
  const mayor = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((m, x) => (f(x) > f(m) ? x : m));
  const menor = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((m, x) => (f(x) < f(m) ? x : m));
  const donde = (f: FilaPartido) => `vs ${f.rival} · ${f.fecha.slice(8)}/${f.fecha.slice(5, 7)}`;
  const salida: Record[] = [];
  const mas = mayor(filas, (f) => f.a);
  salida.push({ nombre: 'Más puntos', valor: String(mas.a), detalle: donde(mas) });
  const ganados = filas.filter((f) => f.marca === 'G');
  if (ganados.length) { const g = mayor(ganados, (f) => f.a - f.c); salida.push({ nombre: 'Mayor victoria', valor: `+${g.a - g.c}`, detalle: donde(g) }); }
  const def = menor(filas, (f) => f.c);
  salida.push({ nombre: 'Menos puntos recibidos', valor: String(def.c), detalle: donde(def) });
  let racha = 0, mejor = 0;
  for (const f of filas) { racha = f.marca === 'G' ? racha + 1 : 0; mejor = Math.max(mejor, racha); }
  if (mejor > 0) salida.push({ nombre: 'Mejor racha', valor: `${mejor} ${mejor === 1 ? 'victoria' : 'seguidas'}`, detalle: 'de la temporada' });
  const con3 = filas.filter((f) => f.t3A > 0);
  if (con3.length) { const t = mayor(con3, (f) => f.t3A); salida.push({ nombre: 'Más triples', valor: String(t.t3A), detalle: donde(t) }); }
  return salida;
}

export interface LineaComparar {
  nombre: string;
  a: number | null;
  b: number | null;
  /** Ganar la comparación es tener más (true) o menos (false). */
  masEsMejor: boolean;
  porcentaje?: boolean;
}

/** Dos partidos lado a lado. Lo que no se apuntó en directo sale vacío, no cero. */
export function compararPartidos(x: FilaPartido, y: FilaPartido): LineaComparar[] {
  const det = (f: FilaPartido, v: number) => (f.detalle ? v : null);
  const lineas: LineaComparar[] = [
    { nombre: 'Puntos a favor', a: x.a, b: y.a, masEsMejor: true },
    { nombre: 'Puntos en contra', a: x.c, b: y.c, masEsMejor: false },
    { nombre: 'Diferencia', a: x.a - x.c, b: y.a - y.c, masEsMejor: true },
    { nombre: '% tiro de campo', a: pct(x.tcA, x.tcI), b: pct(y.tcA, y.tcI), masEsMejor: true, porcentaje: true },
    { nombre: '% triples', a: pct(x.t3A, x.t3I), b: pct(y.t3A, y.t3I), masEsMejor: true, porcentaje: true },
    { nombre: '% libres', a: pct(x.tlA, x.tlI), b: pct(y.tlA, y.tlI), masEsMejor: true, porcentaje: true },
    { nombre: 'Rebotes', a: det(x, x.reb), b: det(y, y.reb), masEsMejor: true },
    { nombre: 'Asistencias', a: det(x, x.ast), b: det(y, y.ast), masEsMejor: true },
    { nombre: 'Robos', a: det(x, x.rob), b: det(y, y.rob), masEsMejor: true },
    { nombre: 'Pérdidas', a: det(x, x.per), b: det(y, y.per), masEsMejor: false },
    { nombre: 'Faltas', a: det(x, x.f), b: det(y, y.f), masEsMejor: false },
  ];
  return lineas;
}

/** Qué lado gana una línea de la comparación: 'a', 'b' o ninguno si empatan o falta el dato. */
export function ganaLinea(l: LineaComparar): 'a' | 'b' | null {
  if (l.a === null || l.b === null || l.a === l.b) return null;
  return (l.a > l.b) === l.masEsMejor ? 'a' : 'b';
}

/** Asistencia de las últimas semanas (la más antigua primero): una por lunes. */
export function asistenciaPorSemana(t: Temporada | undefined, hoyTexto: string, jugadoras: number, semanas = 8): { lunes: string; pct: number | null }[] {
  const lunes = lunesDe(hoyTexto);
  return Array.from({ length: semanas }, (_, i) => {
    const l = sumarDias(lunes, -7 * (semanas - 1 - i));
    return { lunes: l, pct: asistenciaSemana(t, l, jugadoras).pct };
  });
}

/** Racha de entrenos seguidos con asistencia hasta hoy, y la mejor de la temporada. Solo cuentan los entrenos con lista. */
export function rachaAsistencia(t: Temporada | undefined, id: string, hoyTexto: string): { actual: number; mejor: number; vino: number; de: number } {
  const lista = Object.entries(t?.asistencia ?? {})
    .map(([clave, ids]) => ({ fecha: clave.includes('|') ? clave.slice(clave.indexOf('|') + 1) : t?.eventos.find((e) => e.id === clave)?.fecha ?? '', ids }))
    .filter((x) => x.fecha && x.fecha <= hoyTexto)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  let actual = 0, mejor = 0;
  for (const x of lista) { actual = x.ids.includes(id) ? actual + 1 : 0; mejor = Math.max(mejor, actual); }
  return { actual, mejor, vino: lista.filter((x) => x.ids.includes(id)).length, de: lista.length };
}

/** Días desde la fecha hasta hoy en palabras, para los récords: «hace 3 semanas». */
export function hace(fecha: string, hoyTexto: string): string {
  const d = diasEntre(fecha, hoyTexto);
  return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : d < 14 ? `hace ${d} días` : d < 60 ? `hace ${Math.round(d / 7)} semanas` : `hace ${Math.round(d / 30)} meses`;
}
