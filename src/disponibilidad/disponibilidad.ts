// Disponibilidad (loop Pro, tramo 6): «voy / no voy / quizá» de cada jugadora para un partido o entreno.
// Sin servidor: el entrenador manda el mensaje al grupo, las familias contestan con el dorsal y él lo apunta (o pega las respuestas).
// Los mensajes llevan solo dorsales, nunca nombres.
export type Respuesta = 'si' | 'no' | 'quiza';
export const RESPUESTAS: readonly [Respuesta, string][] = [['si', 'Voy'], ['no', 'No voy'], ['quiza', 'Quizá']];
const esRespuesta = (x: unknown): x is Respuesta => x === 'si' || x === 'no' || x === 'quiza';

/** Por clave de partido o entreno (la de `Item`), la respuesta de cada jugadora (id). Sin respuesta, no hay entrada. */
export type Disponibilidad = Record<string, Record<string, Respuesta>>;

export function ponerRespuesta(d: Disponibilidad | undefined, clave: string, id: string, r: Respuesta | null): Disponibilidad | undefined {
  const actual = { ...(d?.[clave] ?? {}) };
  if (r) actual[id] = r;
  else delete actual[id];
  const resto = Object.fromEntries(Object.entries(d ?? {}).filter(([k]) => k !== clave));
  const nuevo = Object.keys(actual).length ? { ...resto, [clave]: actual } : resto;
  return Object.keys(nuevo).length ? nuevo : undefined;
}

/** Quita las respuestas de un día (o de varios, con el filtro). */
export function sinRespuestas(d: Disponibilidad | undefined, quitar: (clave: string) => boolean): Disponibilidad | undefined {
  const resto = Object.fromEntries(Object.entries(d ?? {}).filter(([k]) => !quitar(k)));
  return Object.keys(resto).length ? resto : undefined;
}

export interface ResumenDisponibilidad {
  si: string[];
  no: string[];
  quiza: string[];
  /** Todavía sin contestar. */
  faltan: string[];
}

/** Reparte a las jugadoras (ids) según lo que han contestado; las que ya no existen se ignoran. */
export function resumir(respuestas: Record<string, Respuesta> | undefined, ids: string[]): ResumenDisponibilidad {
  const r = respuestas ?? {};
  return {
    si: ids.filter((id) => r[id] === 'si'),
    no: ids.filter((id) => r[id] === 'no'),
    quiza: ids.filter((id) => r[id] === 'quiza'),
    faltan: ids.filter((id) => !r[id]),
  };
}

/** Deja solo respuestas válidas de jugadoras (al cargar o importar una copia). */
export function limpiarDisponibilidad(x: unknown): Disponibilidad | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const salida: Disponibilidad = {};
  for (const [clave, v] of Object.entries(x as Record<string, unknown>)) {
    if (!clave || !v || typeof v !== 'object') continue;
    const dia: Record<string, Respuesta> = {};
    for (const [id, r] of Object.entries(v as Record<string, unknown>)) if (id && esRespuesta(r)) dia[id] = r;
    if (Object.keys(dia).length) salida[clave] = dia;
  }
  return Object.keys(salida).length ? salida : undefined;
}

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const fechaLarga = (f: string) => {
  const d = new Date(Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10)));
  return `${DIAS[(d.getUTCDay() + 6) % 7]} ${+f.slice(8, 10)}/${+f.slice(5, 7)}`;
};

export interface Cita {
  tipo: 'partido' | 'entreno' | 'otro';
  titulo: string;
  fecha: string;
  hora: string;
  lugar?: string;
  casa?: boolean;
}

const dorsales = (ds: string[]) => ds.map((d) => `#${d}`).join(' ');

/** Mensaje para el grupo: qué es, cuándo y cómo contestar. Sin nombres. */
export function mensajePedir(c: Cita, equipo: string): string {
  const que = c.tipo === 'partido' ? `Partido contra ${c.titulo || 'el rival'}` : c.titulo || 'Entreno';
  const donde = c.tipo === 'partido' ? ` · ${c.casa === false ? 'Fuera' : 'En casa'}` : '';
  return [
    equipo,
    que,
    `${fechaLarga(c.fecha)} a las ${c.hora}${donde}${c.lugar ? ` (${c.lugar})` : ''}`,
    '¿Puede venir? Contestad con el dorsal: «7 voy», «7 no voy» o «7 quizá».',
  ].join('\n');
}

/** Recordatorio solo para quien no ha contestado. */
export function mensajeRecordar(c: Cita, equipo: string, faltan: string[]): string {
  if (!faltan.length) return '';
  const que = c.tipo === 'partido' ? `el partido contra ${c.titulo || 'el rival'}` : (c.titulo || 'el entreno').toLowerCase();
  return `${equipo}\nFaltan por confirmar para ${que} del ${fechaLarga(c.fecha)}: ${dorsales(faltan)}.\nContestad con el dorsal y «voy», «no voy» o «quizá».`;
}

/** Resumen para el entrenador (también se puede pasar al cuerpo técnico). Solo dorsales. */
export function mensajeResumen(c: Cita, equipo: string, r: Record<'si' | 'no' | 'quiza' | 'faltan', string[]>): string {
  const que = c.tipo === 'partido' ? `vs ${c.titulo || 'rival'}` : c.titulo || 'Entreno';
  return [
    `${equipo} · ${que} · ${fechaLarga(c.fecha)} ${c.hora}`,
    `Van ${r.si.length}${r.si.length ? `: ${dorsales(r.si)}` : ''}`,
    `No van ${r.no.length}${r.no.length ? `: ${dorsales(r.no)}` : ''}`,
    `Quizá ${r.quiza.length}${r.quiza.length ? `: ${dorsales(r.quiza)}` : ''}`,
    `Sin contestar ${r.faltan.length}${r.faltan.length ? `: ${dorsales(r.faltan)}` : ''}`,
  ].join('\n');
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lee respuestas pegadas del grupo («7 voy», «#12 no puede», «4 quizá») y devuelve dorsal y respuesta. La última de cada dorsal manda. */
export function interpretarRespuestas(texto: string): { numero: string; r: Respuesta }[] {
  const ultimo = new Map<string, Respuesta>();
  for (const linea of texto.split(/\r?\n/)) {
    // Fuera lo que no es dorsal: «[12:30]», horas, fechas y el nombre de quien escribe antes de los dos puntos.
    const t = sinTildes(linea).replace(/\[[^\]]*\]/g, ' ').replace(/\b\d{1,2}[:.]\d{2}\b/g, ' ').replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, ' ').replace(/^[^:\d#]*:\s*/, '');
    const n = t.match(/#?\b(\d{1,3})\b/);
    if (!n) continue;
    const resto = t.replace(n[0], ' ');
    let r: Respuesta | undefined;
    if (/quiz|igual|duda|no se\b|ni idea|depende|a ver/.test(resto)) r = 'quiza';
    else if (/\bno\b/.test(resto)) r = 'no';
    else if (/\b(voy|va|vamos|si|vale|ok|vengo|ire|iremos|claro|presente|puede)\b/.test(resto)) r = 'si';
    if (r) ultimo.set(String(Number(n[1])), r);
  }
  return [...ultimo].map(([numero, r]) => ({ numero, r }));
}
