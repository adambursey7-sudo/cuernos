// Calendario: leer un .ics (Google Calendar, Apple, Outlook), leer una lista de jornadas pegada y escribir la temporada en .ics.
// Hecho a mano, sin librerías. Todo lo que se lee entra como candidato y se enseña en una vista previa antes de guardar.
import { crearFecha, sumarDias } from './fechas';
import type { TipoEvento } from './temporada';

export interface Candidata {
  tipo: TipoEvento;
  fecha: string;
  hora: string;
  titulo: string;
  casa?: boolean;
  lugar: string;
  /** Se repite cada semana (solo entrenos): se importa como entreno fijo. */
  semanal?: boolean;
  minutos?: number;
  /** El programa no está seguro: se enseña con «?» para que Adam lo revise. */
  dudosa?: boolean;
}

const quitaTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Casa o fuera según marcas como (C), (F), «casa», «fuera», «local» o «visitante». */
export function casaFuera(texto: string): boolean | undefined {
  const t = quitaTildes(texto.toLowerCase());
  if (/\(\s*c\s*\)|\bcasa\b|\blocal\b/.test(t)) return true;
  if (/\(\s*f\s*\)|\bfuera\b|\bvisitante\b/.test(t)) return false;
  return undefined;
}

/** Quita jornada, marcas de casa/fuera y «vs» para dejar el nombre del rival. */
export function rivalDe(texto: string): string {
  return texto
    .replace(/\(\s*([cf]|casa|fuera|local|visitante)\s*\)/gi, ' ')
    .replace(/\b(j(ornada)?\.?\s*\d+|partido|casa|fuera|local|visitante)\b/gi, ' ')
    .replace(/^\s*(vs\.?|v\.?s\.?|contra)\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–:·]+|[\s\-–:·]+$/g, '');
}

const ES_PARTIDO = /(\bvs\.?\b|\bv\.s\.|\bjornada\b|\bj\d+\b|\bpartido\b|\bcontra\b|\s[-–]\s)/i;
const ES_ENTRENO = /(entren|sesi[oó]n|pr[aá]ctica|training)/i;

export function adivinarTipo(titulo: string): TipoEvento {
  if (ES_ENTRENO.test(titulo)) return 'entreno';
  if (ES_PARTIDO.test(titulo)) return 'partido';
  return 'otro';
}

/* ---------- .ics ---------- */

function desdoblar(texto: string): string[] {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
  const fuera: string[] = [];
  for (const l of lineas) {
    if ((l.startsWith(' ') || l.startsWith('\t')) && fuera.length) fuera[fuera.length - 1] += l.slice(1);
    else fuera.push(l);
  }
  return fuera;
}

const desescapar = (s: string) => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

/** 20261013 o 20261013T110000(Z) → fecha y hora locales. Con «Z» (UTC) se pasa a la hora del móvil. */
function fechaIcs(v: string): { fecha: string; hora: string; dia: boolean } | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v.trim());
  if (!m) return null;
  const dia = m[4] === undefined;
  if (m[7]) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    const p = (n: number) => String(n).padStart(2, '0');
    return { fecha: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, hora: `${p(d.getHours())}:${p(d.getMinutes())}`, dia: false };
  }
  const fecha = crearFecha(+m[1], +m[2], +m[3]);
  if (!fecha) return null;
  return { fecha, hora: dia ? '00:00' : `${m[4]}:${m[5]}`, dia };
}

const minutosEntre = (a: string, b: string) => {
  const [h1, m1] = a.split(':').map(Number);
  const [h2, m2] = b.split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
};

export function leerIcs(texto: string): Candidata[] {
  const lineas = desdoblar(texto);
  const fuera: Candidata[] = [];
  let ev: Record<string, string> | null = null;
  for (const l of lineas) {
    if (/^BEGIN:VEVENT/i.test(l)) { ev = {}; continue; }
    if (/^END:VEVENT/i.test(l)) {
      if (ev) {
        const c = candidataDeEvento(ev);
        if (c) fuera.push(c);
      }
      ev = null;
      continue;
    }
    if (!ev) continue;
    const i = l.indexOf(':');
    if (i < 0) continue;
    const nombre = l.slice(0, i).split(';')[0].toUpperCase();
    if (['SUMMARY', 'DTSTART', 'DTEND', 'LOCATION', 'RRULE', 'STATUS'].includes(nombre) && !(nombre in ev)) ev[nombre] = l.slice(i + 1);
  }
  return fuera.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
}

function candidataDeEvento(ev: Record<string, string>): Candidata | null {
  if (!ev.DTSTART || /CANCELLED/i.test(ev.STATUS ?? '')) return null;
  const ini = fechaIcs(ev.DTSTART);
  if (!ini) return null;
  const titulo = desescapar(ev.SUMMARY ?? '');
  const lugar = desescapar(ev.LOCATION ?? '');
  const tipo = adivinarTipo(titulo);
  const fin = ev.DTEND ? fechaIcs(ev.DTEND) : null;
  const dur = fin && !ini.dia && fin.fecha === ini.fecha ? minutosEntre(ini.hora, fin.hora) : undefined;
  const semanal = /FREQ=WEEKLY/i.test(ev.RRULE ?? '') && tipo === 'entreno';
  const base: Candidata = { tipo, fecha: ini.fecha, hora: ini.dia ? '18:30' : ini.hora, titulo: titulo || 'Sin título', lugar, ...(dur && dur > 0 ? { minutos: dur } : {}) };
  if (semanal) return { ...base, semanal: true };
  if (tipo === 'partido') return { ...base, titulo: rivalDe(titulo) || titulo, casa: casaFuera(`${titulo} ${lugar}`), dudosa: casaFuera(`${titulo} ${lugar}`) === undefined };
  return { ...base, dudosa: tipo === 'otro' };
}

/* ---------- Lista pegada de jornadas ---------- */

/** «J1 13/10 11:00 Ejemplo CB (C)». Sin año, se toma el que deja la fecha dentro de la temporada. */
export function leerLista(texto: string, inicioTemporada: string): Candidata[] {
  const fuera: Candidata[] = [];
  for (const crudo of texto.split(/\r?\n/)) {
    const linea = crudo.trim();
    if (!linea) continue;
    const f = /(\d{1,2})\s*[/.\-]\s*(\d{1,2})(?:\s*[/.\-]\s*(\d{2,4}))?/.exec(linea);
    const h = /\b([01]?\d|2[0-3])[:.h]([0-5]\d)\b/.exec(linea.replace(f?.[0] ?? '', ' '));
    let fecha: string | null = null;
    if (f) {
      const d = Number(f[1]);
      const m = Number(f[2]);
      let a = f[3] ? Number(f[3]) : undefined;
      if (a !== undefined && a < 100) a += 2000;
      if (a === undefined) {
        const base = Number(inicioTemporada.slice(0, 4));
        const mesIni = Number(inicioTemporada.slice(5, 7));
        a = m >= mesIni ? base : base + 1;
      }
      fecha = crearFecha(a, m, d);
    }
    const resto = linea.replace(f?.[0] ?? '', ' ').replace(h?.[0] ?? '', ' ');
    const rival = rivalDe(resto);
    if (!rival && !fecha) continue;
    const casa = casaFuera(linea);
    fuera.push({
      tipo: 'partido', fecha: fecha ?? inicioTemporada, hora: h ? `${h[1].padStart(2, '0')}:${h[2]}` : '11:00', titulo: rival, casa, lugar: '',
      dudosa: !fecha || !rival || !h || casa === undefined,
    });
  }
  return fuera;
}

/* ---------- Escribir .ics ---------- */

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n?|\n/g, '\\n');
const sinGuiones = (f: string) => f.replace(/-/g, '');
const sinPuntos = (h: string) => `${h.replace(':', '')}00`;
const sumarMin = (f: string, h: string, min: number) => {
  const total = Number(h.slice(0, 2)) * 60 + Number(h.slice(3)) + min;
  const dias = Math.floor(total / 1440);
  const r = total - dias * 1440;
  return { f: sumarDias(f, dias), h: `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}` };
};

/** Parte una línea larga como pide el formato (75 caracteres). */
const plegar = (l: string) => (l.length <= 75 ? l : (l.match(/.{1,74}/g) ?? [l]).join('\r\n '));

export interface ItemIcs {
  fecha: string;
  hora: string;
  tipo: TipoEvento;
  titulo: string;
  casa?: boolean;
  lugar?: string;
  minutos: number;
  uid: string;
}

/** La temporada como .ics: partidos, otros eventos y los entrenos de cada semana (con sus cambios) hasta el final. */
export interface OpcionesIcs {
  /** Recordatorio: minutos antes de cada cosa (0 o sin dato: sin recordatorio). */
  avisarMin?: number;
  /** Solo partidos y eventos (para las familias, que no necesitan los entrenos). */
  sinEntrenos?: boolean;
}

export function escribirIcs(equipo: string, items: ItemIcs[], opciones: OpcionesIcs = {}): string {
  const marca = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const aviso = opciones.avisarMin && opciones.avisarMin > 0 ? Math.min(opciones.avisarMin, 10_080) : 0;
  const cuerpo = items.filter((i) => !(opciones.sinEntrenos && i.tipo === 'entreno')).map((i) => {
    const fin = sumarMin(i.fecha, i.hora, i.minutos);
    const nombre = i.tipo === 'partido' ? `Partido vs ${i.titulo || 'rival'}${i.casa === true ? ' (casa)' : i.casa === false ? ' (fuera)' : ''}` : i.tipo === 'entreno' ? `Entreno ${equipo}`.trim() : i.titulo || 'Evento';
    return [
      'BEGIN:VEVENT', `UID:${esc(i.uid)}@horns`, `DTSTAMP:${marca}`,
      `DTSTART:${sinGuiones(i.fecha)}T${sinPuntos(i.hora)}`, `DTEND:${sinGuiones(fin.f)}T${sinPuntos(fin.h)}`,
      `SUMMARY:${esc(nombre)}`, ...(i.lugar ? [`LOCATION:${esc(i.lugar)}`] : []),
      ...(aviso ? ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(nombre)}`, `TRIGGER:-PT${aviso}M`, 'END:VALARM'] : []),
      'END:VEVENT',
    ].map(plegar).join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Horns//Temporada//ES', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(equipo)}`, ...cuerpo, 'END:VCALENDAR', ''].join('\r\n');
}
