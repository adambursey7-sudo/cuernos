// Fechas como texto AAAA-MM-DD (sin horas ni zonas), con cuentas en UTC para que el cambio de hora no mueva un día.
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
export const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const aDate = (f: string) => {
  const m = RE.exec(f);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
};
const aTexto = (d: Date) => d.toISOString().slice(0, 10);

/** ¿Es una fecha que existe (no el 31 de febrero)? */
export function esFecha(f: unknown): f is string {
  if (typeof f !== 'string') return false;
  const d = aDate(f);
  return !!d && aTexto(d) === f;
}

export function crearFecha(a: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const f = `${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return esFecha(f) ? f : null;
}

export function sumarDias(f: string, n: number): string {
  const d = aDate(f)!;
  d.setUTCDate(d.getUTCDate() + n);
  return aTexto(d);
}

/** 0 = lunes … 6 = domingo. */
export const diaSemana = (f: string): number => (aDate(f)!.getUTCDay() + 6) % 7;

export const lunesDe = (f: string): string => sumarDias(f, -diaSemana(f));

/** Cuántos días de f1 a f2 (negativo si f2 es anterior). */
export const diasEntre = (f1: string, f2: string): number => Math.round((aDate(f2)!.getTime() - aDate(f1)!.getTime()) / 86_400_000);

export const mesDe = (f: string) => f.slice(0, 7);

/** Primer día del mes `delta` meses después. */
export function sumarMeses(f: string, delta: number): string {
  const d = aDate(f)!;
  return aTexto(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1)));
}

/** Semanas del mes (lunes a domingo) con `null` en los huecos de otros meses. */
export function cuadriculaMes(f: string): (string | null)[][] {
  const [a, m] = [Number(f.slice(0, 4)), Number(f.slice(5, 7))];
  const primero = `${f.slice(0, 7)}-01`;
  const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const celdas: (string | null)[] = Array(diaSemana(primero)).fill(null);
  for (let i = 1; i <= dias; i++) celdas.push(`${f.slice(0, 7)}-${String(i).padStart(2, '0')}`);
  while (celdas.length % 7) celdas.push(null);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

export const nombreMes = (f: string) => `${MESES[Number(f.slice(5, 7)) - 1]} ${f.slice(0, 4)}`;

/** «sáb 13 oct». */
export const corta = (f: string) => `${DIAS[diaSemana(f)]} ${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1].slice(0, 3)}`;

export const esHora = (h: unknown): h is string => typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
