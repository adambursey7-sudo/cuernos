// Partido en directo (loop Pro, tramo 3): reloj, cuartos, en pista, minutos, faltas, tiempos muertos y cronología.
// Cada acción es una jugada que se puede deshacer: el marcador y la estadística se mueven con ella, y al deshacer vuelven atrás.
// Solo ids de jugadora: ningún nombre entra en lo que se guarda ni en lo que se comparte.
import { FALTAS_FUERA, type Directo, type Linea } from '../temporada/directo';

export type Tipo = 'c1' | 'c2' | 'c3' | 'f1' | 'f2' | 'f3' | 'reb' | 'ast' | 'rob' | 'per' | 'fal' | 'tm' | 'cambio' | 'rival' | 'cuarto';

export const TIPOS: readonly Tipo[] = ['c1', 'c2', 'c3', 'f1', 'f2', 'f3', 'reb', 'ast', 'rob', 'per', 'fal', 'tm', 'cambio', 'rival', 'cuarto'];

export interface Jugada {
  /** Número de orden dentro del partido. */
  n: number;
  /** Cuarto (5 en adelante: prórroga) y segundos jugados de ese cuarto cuando pasó. */
  c: number;
  s: number;
  tipo: Tipo;
  /** Jugadora (en un cambio, la que entra). */
  j?: string;
  /** En un cambio, la que sale. */
  k?: string;
  /** Puntos del rival (1, 2 o 3) o, en `cuarto`, el cuarto del que se viene. */
  v?: number;
  /** Dónde se tiró, de 0 a 100 sobre la media pista de Horns (x a lo ancho, y de aro hacia mitad de pista). */
  x?: number;
  y?: number;
}

export interface Vivo {
  cuarto: number;
  /** Minutos de cada cuarto. */
  duracion: number;
  /** Segundos jugados del cuarto actual (los que ya se cerraron; si corre, falta sumar lo que lleva). */
  segundos: number;
  /** Cuándo arrancó el reloj (ms), si está corriendo. */
  corre?: number;
  enPista: string[];
  /** Segundos en pista de cada jugadora en todo el partido. */
  min: Record<string, number>;
  /** Faltas de equipo por cuarto. */
  faltasEq: Record<number, number>;
  /** Tiempos muertos pedidos. */
  tm: number;
  cronologia: Jugada[];
  /** Partido terminado. */
  fin?: boolean;
}

/** Lo que cambia con cada jugada: la estadística, el marcador del rival y el estado del partido. */
export interface Partido {
  directo: Directo;
  /** Puntos del rival. */
  rival: number;
  vivo: Vivo;
}

export const TIEMPOS_MUERTOS = 5;
export const EN_PISTA = 5;

export function nuevoVivo(quinteto: string[], duracion = 10): Vivo {
  return { cuarto: 1, duracion, segundos: 0, enPista: quinteto.slice(0, EN_PISTA), min: {}, faltasEq: {}, tm: 0, cronologia: [] };
}

const lineaDe = (d: Directo, id: string): Linea => d[id] ?? { p: 0, f: 0 };

function sumar(d: Directo, id: string, campo: keyof Linea, n: number): Directo {
  const l = lineaDe(d, id);
  return { ...d, [id]: { ...l, [campo]: Math.max(0, (l[campo] ?? 0) + n) } };
}

const PUNTOS: Partial<Record<Tipo, number>> = { c1: 1, c2: 2, c3: 3 };
const CAMPO: Partial<Record<Tipo, keyof Linea>> = { reb: 'reb', ast: 'ast', rob: 'rob', per: 'per' };

/** Segundos del cuarto actual, contando lo que lleva el reloj si está en marcha. */
export function segundosCuarto(v: Vivo, ahora: number): number {
  return v.segundos + rodado(v, ahora);
}

/** Lo que lleva el reloj en marcha, sin pasarse de lo que queda del cuarto (si se cierra la app con el reloj puesto, no cuenta horas). */
function rodado(v: Vivo, ahora: number): number {
  if (!v.corre) return 0;
  return Math.min(Math.max(0, Math.floor((ahora - v.corre) / 1000)), Math.max(0, v.duracion * 60 - v.segundos));
}

/** Lo que falta para acabar el cuarto (nunca negativo). */
export const restante = (v: Vivo, ahora: number): number => Math.max(0, v.duracion * 60 - segundosCuarto(v, ahora));

/** Para el reloj y reparte lo jugado entre quienes están en pista. */
export function parar(v: Vivo, ahora: number): Vivo {
  if (!v.corre) return v;
  const delta = rodado(v, ahora);
  const min = { ...v.min };
  for (const id of v.enPista) min[id] = (min[id] ?? 0) + delta;
  const { corre: _c, ...resto } = v;
  return { ...resto, segundos: v.segundos + delta, min };
}

export const arrancar = (v: Vivo, ahora: number): Vivo => (v.corre || v.fin ? v : { ...v, corre: ahora });

/** Mismo instante, reloj reiniciado: cierra el tramo que llevaba para que lo siguiente (un cambio) cuente desde ahora. */
const cortar = (v: Vivo, ahora: number): { v: Vivo; seguia: boolean } => ({ v: parar(v, ahora), seguia: !!v.corre });
const reanudar = (v: Vivo, ahora: number, seguia: boolean): Vivo => (seguia ? { ...v, corre: ahora } : v);

function anotar(v: Vivo, j: Omit<Jugada, 'n' | 'c' | 's'>, ahora: number): Vivo {
  const n = (v.cronologia[v.cronologia.length - 1]?.n ?? 0) + 1;
  return { ...v, cronologia: [...v.cronologia, { n, c: v.cuarto, s: segundosCuarto(v, ahora), ...j }] };
}

/** Apunta una jugada (puntos, fallo, rebote, asistencia, robo, pérdida, falta, tiempo muerto o puntos del rival). */
export function registrar(p: Partido, j: Omit<Jugada, 'n' | 'c' | 's'>, ahora: number): Partido {
  if (p.vivo.fin) return p;
  let { directo, rival } = p;
  let vivo = anotar(p.vivo, j, ahora);
  const puntos = PUNTOS[j.tipo];
  if (j.tipo === 'rival') rival += j.v ?? 0;
  else if (j.tipo === 'tm') vivo = { ...vivo, tm: Math.min(TIEMPOS_MUERTOS, vivo.tm + 1) };
  else if (j.j && puntos) directo = sumar(directo, j.j, 'p', puntos);
  else if (j.j && CAMPO[j.tipo]) directo = sumar(directo, j.j, CAMPO[j.tipo]!, 1);
  else if (j.j && j.tipo === 'fal') {
    directo = sumar(directo, j.j, 'f', 1);
    vivo = { ...vivo, faltasEq: { ...vivo.faltasEq, [vivo.cuarto]: (vivo.faltasEq[vivo.cuarto] ?? 0) + 1 } };
  }
  return { directo, rival, vivo };
}

/** Deshace la última jugada: el marcador, la estadística y el estado vuelven a como estaban. */
export function deshacer(p: Partido, ahora: number): Partido {
  const ultima = p.vivo.cronologia[p.vivo.cronologia.length - 1];
  if (!ultima || p.vivo.fin) return p;
  let { directo, rival } = p;
  let vivo: Vivo = { ...p.vivo, cronologia: p.vivo.cronologia.slice(0, -1) };
  const puntos = PUNTOS[ultima.tipo];
  if (ultima.tipo === 'rival') rival = Math.max(0, rival - (ultima.v ?? 0));
  else if (ultima.tipo === 'tm') vivo = { ...vivo, tm: Math.max(0, vivo.tm - 1) };
  else if (ultima.tipo === 'cuarto') vivo = { ...parar(vivo, ahora), cuarto: ultima.v ?? vivo.cuarto, segundos: ultima.s };
  else if (ultima.tipo === 'cambio' && ultima.j && ultima.k) {
    const t = cortar(vivo, ahora);
    vivo = reanudar({ ...t.v, enPista: t.v.enPista.map((id) => (id === ultima.j ? ultima.k! : id)) }, ahora, t.seguia);
  } else if (ultima.j && puntos) directo = sumar(directo, ultima.j, 'p', -puntos);
  else if (ultima.j && CAMPO[ultima.tipo]) directo = sumar(directo, ultima.j, CAMPO[ultima.tipo]!, -1);
  else if (ultima.j && ultima.tipo === 'fal') {
    directo = sumar(directo, ultima.j, 'f', -1);
    const { [ultima.c]: antes = 0, ...otras } = vivo.faltasEq;
    vivo = { ...vivo, faltasEq: antes > 1 ? { ...otras, [ultima.c]: antes - 1 } : otras };
  }
  return { directo, rival, vivo };
}

/** Cambio: entra una jugadora del banquillo y sale una de la pista. Los minutos se reparten justo hasta ese momento. */
export function cambiar(p: Partido, entra: string, sale: string, ahora: number): Partido {
  const v = p.vivo;
  if (v.fin || !v.enPista.includes(sale) || v.enPista.includes(entra)) return p;
  const t = cortar(v, ahora);
  const nuevo = reanudar({ ...t.v, enPista: t.v.enPista.map((id) => (id === sale ? entra : id)) }, ahora, t.seguia);
  return { ...p, vivo: anotar(nuevo, { tipo: 'cambio', j: entra, k: sale }, ahora) };
}

/** Pasa al cuarto siguiente (o a una prórroga) con el reloj parado y a cero. */
export function cuartoSiguiente(p: Partido, ahora: number): Partido {
  const v = parar(p.vivo, ahora);
  if (v.fin) return p;
  const anotado = anotar(v, { tipo: 'cuarto', v: v.cuarto }, ahora);
  return { ...p, vivo: { ...anotado, cuarto: v.cuarto + 1, segundos: 0 } };
}

export const nombreCuarto = (c: number) => (c <= 4 ? `C${c}` : c === 5 ? 'PR' : `PR${c - 4}`);

/** Termina el partido: reloj parado y ya no se apunta más. */
export const terminar = (p: Partido, ahora: number): Partido => ({ ...p, vivo: { ...parar(p.vivo, ahora), fin: true } });

/** Si el partido se reabre, vuelve a poder apuntarse. */
export const reabrir = (p: Partido): Partido => {
  const { fin: _f, ...v } = p.vivo;
  return { ...p, vivo: v };
};

export const faltasEquipo = (v: Vivo, cuarto = v.cuarto) => v.faltasEq[cuarto] ?? 0;
/** A partir de cinco faltas de equipo en un cuarto, cada falta rival da tiros libres. */
export const enBonus = (v: Vivo) => faltasEquipo(v) >= 5;

export const estaFuera = (d: Directo, id: string, tope = FALTAS_FUERA) => lineaDe(d, id).f >= tope;

export interface FilaBox {
  id: string;
  /** Segundos en pista. */
  min: number;
  p: number;
  reb: number;
  ast: number;
  rob: number;
  per: number;
  f: number;
  /** Tiros de campo (2 y 3 puntos) y tiros libres: anotados y de los que se apuntó fallo o acierto. */
  tcA: number;
  tcI: number;
  tlA: number;
  tlI: number;
}

/** Estadística final por jugadora (solo las que jugaron o sumaron algo), de más a menos puntos. */
export function boxScore(d: Directo, v: Vivo): FilaBox[] {
  const ids = new Set([...Object.keys(d), ...Object.keys(v.min), ...v.cronologia.flatMap((j) => (j.j && j.tipo !== 'cambio' ? [j.j] : []))]);
  return [...ids]
    .map((id) => {
      const l = lineaDe(d, id);
      const suyas = v.cronologia.filter((j) => j.j === id);
      const cuenta = (...t: Tipo[]) => suyas.filter((j) => t.includes(j.tipo)).length;
      return { id, min: v.min[id] ?? 0, p: l.p, reb: l.reb ?? 0, ast: l.ast ?? 0, rob: l.rob ?? 0, per: l.per ?? 0, f: l.f, tcA: cuenta('c2', 'c3'), tcI: cuenta('c2', 'c3', 'f2', 'f3'), tlA: cuenta('c1'), tlI: cuenta('c1', 'f1') };
    })
    .filter((f) => f.min > 0 || f.p || f.reb || f.ast || f.rob || f.per || f.f || f.tcI || f.tlI)
    .sort((a, b) => b.p - a.p || b.min - a.min);
}

export type Categoria = 'p' | 'reb' | 'ast' | 'rob';
export const CATEGORIAS: [Categoria, string][] = [['p', 'Puntos'], ['reb', 'Rebotes'], ['ast', 'Asistencias'], ['rob', 'Robos']];

/** El mejor de cada apartado (varios si empatan); no cuenta si nadie sumó nada. */
export function mejores(filas: FilaBox[]): Record<Categoria, string[]> {
  const salida = { p: [], reb: [], ast: [], rob: [] } as Record<Categoria, string[]>;
  for (const [c] of CATEGORIAS) {
    const max = Math.max(0, ...filas.map((f) => f[c]));
    if (max > 0) salida[c] = filas.filter((f) => f[c] === max).map((f) => f.id);
  }
  return salida;
}

/** «7:05» para unos segundos. */
export const reloj = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
/** Minutos redondeados para la tabla final. */
export const minutos = (s: number) => Math.round(s / 60);

export const TEXTO: Record<Tipo, string> = {
  c1: 'tiro libre anotado', c2: 'canasta de 2', c3: 'triple', f1: 'tiro libre fallado', f2: 'tiro de 2 fallado', f3: 'triple fallado',
  reb: 'rebote', ast: 'asistencia', rob: 'robo', per: 'pérdida', fal: 'falta', tm: 'tiempo muerto', cambio: 'cambio', rival: 'puntos del rival', cuarto: 'fin de cuarto',
};

/** Deja solo un partido en directo válido (al cargar la temporada o una copia). */
export function limpiarVivo(x: unknown): Vivo | undefined {
  const v = x as Vivo | undefined;
  if (!v || typeof v !== 'object') return undefined;
  const num = (n: unknown, min: number, max: number, por: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n as number))) : por);
  const texto = (s: unknown): s is string => typeof s === 'string' && s !== '' && s.length < 80;
  const enPista = Array.isArray(v.enPista) ? [...new Set(v.enPista.filter(texto))].slice(0, EN_PISTA) : [];
  const min: Record<string, number> = {};
  for (const [id, s] of Object.entries(v.min && typeof v.min === 'object' ? v.min : {})) if (texto(id) && Number.isFinite(s) && (s as number) > 0) min[id] = Math.min(60 * 600, Math.trunc(s as number));
  const faltasEq: Record<number, number> = {};
  for (const [c, n] of Object.entries(v.faltasEq && typeof v.faltasEq === 'object' ? v.faltasEq : {})) if (Number.isInteger(+c) && +c >= 1 && +c <= 12 && Number.isFinite(n) && (n as number) > 0) faltasEq[+c] = Math.min(30, Math.trunc(n as number));
  const cronologia: Jugada[] = [];
  for (const j of Array.isArray(v.cronologia) ? v.cronologia.slice(0, 2000) : []) {
    if (!j || !TIPOS.includes(j.tipo)) continue;
    const c = num(j.c, 1, 12, 1);
    cronologia.push({
      n: num(j.n, 1, 100000, cronologia.length + 1), c, s: num(j.s, 0, 3600, 0), tipo: j.tipo,
      ...(texto(j.j) ? { j: j.j } : {}), ...(texto(j.k) ? { k: j.k } : {}), ...(Number.isFinite(j.v) ? { v: num(j.v, 0, 12, 0) } : {}),
      ...(Number.isFinite(j.x) && Number.isFinite(j.y) ? { x: num(j.x, 0, 100, 50), y: num(j.y, 0, 100, 50) } : {}),
    });
  }
  return {
    cuarto: num(v.cuarto, 1, 12, 1), duracion: num(v.duracion, 1, 20, 10), segundos: num(v.segundos, 0, 1200, 0),
    ...(Number.isFinite(v.corre) && (v.corre as number) > 0 ? { corre: v.corre } : {}),
    enPista, min, faltasEq, tm: num(v.tm, 0, TIEMPOS_MUERTOS, 0), cronologia, ...(v.fin ? { fin: true } : {}),
  };
}
