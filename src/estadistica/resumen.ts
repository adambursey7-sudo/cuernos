// Resumen del equipo para el panel de inicio: balance, racha, último resultado, cuenta atrás y asistencia de la semana.
// Todo se calcula en el móvil con lo que ya hay en la temporada; no se guarda nada nuevo.
import { diasEntre, lunesDe, sumarDias } from '../temporada/fechas';
import type { Evento, Temporada } from '../temporada/temporada';

export type Marca = 'G' | 'P' | 'E';

export interface Jugado {
  evento: Evento;
  marca: Marca;
  a: number;
  c: number;
}

const marcaDe = (a: number, c: number): Marca => (a > c ? 'G' : a < c ? 'P' : 'E');

/** Partidos con resultado, del más antiguo al más reciente. */
export function jugados(t: Pick<Temporada, 'eventos'> | undefined): Jugado[] {
  return (t?.eventos ?? [])
    .flatMap((evento) => (evento.tipo === 'partido' && evento.resultado ? [{ evento, marca: marcaDe(evento.resultado.a, evento.resultado.c), a: evento.resultado.a, c: evento.resultado.c }] : []))
    .sort((x, y) => (x.evento.fecha + x.evento.hora).localeCompare(y.evento.fecha + y.evento.hora));
}

export function balance(js: Jugado[]) {
  const g = js.filter((j) => j.marca === 'G').length;
  const p = js.filter((j) => j.marca === 'P').length;
  const pf = js.reduce((n, j) => n + j.a, 0);
  const pc = js.reduce((n, j) => n + j.c, 0);
  return { g, p, e: js.length - g - p, pf, pc, dif: pf - pc, jugados: js.length };
}

/** Lo que dura la racha actual: «3 victorias seguidas». Vacío si no hay partidos. */
export function racha(js: Jugado[]): { marca: Marca; n: number } | undefined {
  const ultimo = js[js.length - 1];
  if (!ultimo) return undefined;
  let n = 0;
  for (let i = js.length - 1; i >= 0 && js[i].marca === ultimo.marca; i--) n++;
  return { marca: ultimo.marca, n };
}

export function textoRacha(r: { marca: Marca; n: number } | undefined): string {
  if (!r) return 'Sin partidos';
  const nombre = r.marca === 'G' ? (r.n === 1 ? 'victoria' : 'victorias') : r.marca === 'P' ? (r.n === 1 ? 'derrota' : 'derrotas') : (r.n === 1 ? 'empate' : 'empates');
  return `${r.n} ${nombre}${r.n === 1 ? '' : ' seguidas'}`;
}

export interface CuentaAtras {
  dias: number;
  horas: number;
  minutos: number;
  /** Ya ha empezado (hace menos de 90 minutos). */
  enMarcha: boolean;
}

/** Tiempo que falta para una fecha y hora locales (AAAA-MM-DD, HH:MM). Nunca sale negativo. */
export function cuentaAtras(fecha: string, hora: string, ahora: Date): CuentaAtras {
  const [a, m, d] = fecha.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  const falta = new Date(a, m - 1, d, h, min).getTime() - ahora.getTime();
  if (falta <= 0) return { dias: 0, horas: 0, minutos: 0, enMarcha: falta > -90 * 60_000 };
  const total = Math.floor(falta / 60_000);
  return { dias: Math.floor(total / 1440), horas: Math.floor((total % 1440) / 60), minutos: total % 60, enMarcha: false };
}

/** Fecha de una clave de asistencia: `idFijo|AAAA-MM-DD` o el id de un evento. */
function fechaDeClave(t: Temporada, clave: string): string | undefined {
  const i = clave.indexOf('|');
  return i >= 0 ? clave.slice(i + 1) : t.eventos.find((e) => e.id === clave)?.fecha;
}

export interface AsistenciaSemana {
  /** Entrenos de la semana con lista pasada. */
  sesiones: number;
  /** De 0 a 100; sin listas, null. */
  pct: number | null;
}

/** Asistencia de la semana (lunes a domingo) de la fecha dada: de cada entreno con lista, cuántas de las jugadoras vinieron. */
export function asistenciaSemana(t: Temporada | undefined, fecha: string, jugadoras: number): AsistenciaSemana {
  if (!t || jugadoras <= 0) return { sesiones: 0, pct: null };
  const lunes = lunesDe(fecha);
  const domingo = sumarDias(lunes, 6);
  const listas = Object.entries(t.asistencia ?? {}).filter(([clave]) => {
    const f = fechaDeClave(t, clave);
    return f !== undefined && f >= lunes && f <= domingo;
  });
  if (!listas.length) return { sesiones: 0, pct: null };
  const vinieron = listas.reduce((n, [, ids]) => n + Math.min(ids.length, jugadoras), 0);
  return { sesiones: listas.length, pct: Math.round((vinieron / (listas.length * jugadoras)) * 100) };
}

/** «Hace 3 días», «Ayer», «Hoy» para un partido ya jugado. */
export function haceCuanto(fecha: string, hoyTexto: string): string {
  const d = diasEntre(fecha, hoyTexto);
  return d <= 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`;
}
