// Temporada y calendario (tramo 3 del loop Diario). Una temporada por equipo, solo en este móvil y dentro de la copia.
// Fechas AAAA-MM-DD, horas HH:MM. Los entrenos fijos de la semana se calculan: no se guardan día a día.
import type { Candidata, ItemIcs } from './ics';
import { diaSemana, diasEntre, esFecha, esHora, sumarDias } from './fechas';
import { limpiarInforme, type InformeRival } from './rival';

const CLAVE = 'horns.temporada';

export type TipoEvento = 'partido' | 'entreno' | 'otro';

export interface Fase {
  id: string;
  nombre: string;
  desde: string;
  hasta: string;
  objetivo: string;
  /** Qué trabajar en esta fase. */
  trabajar: string;
  /** Parón: no se generan los entrenos fijos. */
  sinEntreno?: boolean;
}

export interface Evento {
  id: string;
  fecha: string;
  hora: string;
  tipo: TipoEvento;
  /** Rival en un partido; nombre en lo demás. */
  titulo: string;
  casa?: boolean;
  lugar: string;
  /** Puntos a favor y en contra. */
  resultado?: { a: number; c: number };
  /** Sesión de entrenamiento enlazada. */
  sesionId?: string;
  /** Frase corta del balance: qué funcionó y a quién mirar. */
  balance: string;
  /** Etiquetas de lo que funcionó y de lo que falló (de ETIQUETAS_BIEN y ETIQUETAS_MAL). */
  bien?: string[];
  mal?: string[];
  /** Jugadoras a mirar (ids) y a cuáles ya se les pasó la nota a su ficha. */
  mirar?: string[];
  pasadas?: string[];
  /** «Sin entreno»: un festivo quita los entrenos fijos de ese día. */
  libre?: boolean;
  /** Informe del rival (solo en un partido). */
  rival?: InformeRival;
}

export interface EntrenoFijo {
  id: string;
  /** 0 = lunes … 6 = domingo. */
  dia: number;
  hora: string;
  minutos: number;
}

/** Cambio de un entreno fijo en un día concreto. Clave: `idFijo|fecha`. */
export interface Excepcion {
  cancelado?: boolean;
  hora?: string;
  sesionId?: string;
}

export interface Temporada {
  equipoId: string;
  inicio: string;
  fin: string;
  fases: Fase[];
  fijos: EntrenoFijo[];
  eventos: Evento[];
  excepciones: Record<string, Excepcion>;
  /** Asistencia: por clave de entreno (la de `Item`), ids de las jugadoras que vinieron. Si no hay clave, no se ha pasado lista. */
  asistencia?: Record<string, string[]>;
}

export interface Item {
  /** Estable: id del evento o `idFijo|fecha`. */
  clave: string;
  fecha: string;
  hora: string;
  tipo: TipoEvento;
  titulo: string;
  evento?: Evento;
  fijo?: EntrenoFijo;
  cancelado?: boolean;
  sesionId?: string;
}

const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function nuevaTemporada(equipoId: string, inicio: string, fin: string): Temporada {
  return { equipoId, inicio, fin, fases: [], fijos: [], eventos: [], excepciones: {} };
}

export const nuevaFase = (desde: string, hasta: string): Fase => ({ id: nuevoId('f'), nombre: '', desde, hasta, objetivo: '', trabajar: '' });
export const nuevoEvento = (fecha: string, tipo: TipoEvento): Evento => ({
  id: nuevoId('v'), fecha, hora: tipo === 'partido' ? '11:00' : '18:30', tipo, titulo: '', casa: tipo === 'partido' ? true : undefined, lugar: '', balance: '',
});
export const nuevoFijo = (dia: number): EntrenoFijo => ({ id: nuevoId('x'), dia, hora: '18:30', minutos: 90 });

const TIPOS: TipoEvento[] = ['partido', 'entreno', 'otro'];
const txt = (x: unknown) => typeof x === 'string';

function limpiaFase(f: unknown): Fase | null {
  const x = f as Fase;
  if (!x || !txt(x.id) || !txt(x.nombre) || !esFecha(x.desde) || !esFecha(x.hasta) || !txt(x.objetivo) || !txt(x.trabajar)) return null;
  return { id: x.id, nombre: x.nombre, desde: x.desde, hasta: x.hasta < x.desde ? x.desde : x.hasta, objetivo: x.objetivo, trabajar: x.trabajar, ...(x.sinEntreno ? { sinEntreno: true } : {}) };
}

function limpiaEvento(e: unknown): Evento | null {
  const x = e as Evento;
  if (!x || !txt(x.id) || !esFecha(x.fecha) || !esHora(x.hora) || !TIPOS.includes(x.tipo) || !txt(x.titulo) || !txt(x.lugar) || !txt(x.balance)) return null;
  const r = x.resultado;
  const resultado = r && Number.isInteger(r.a) && Number.isInteger(r.c) && r.a >= 0 && r.c >= 0 ? { a: r.a, c: r.c } : undefined;
  const rival = x.tipo === 'partido' ? limpiarInforme(x.rival) : undefined;
  return {
    ...(rival ? { rival } : {}),
    id: x.id, fecha: x.fecha, hora: x.hora, tipo: x.tipo, titulo: x.titulo, lugar: x.lugar, balance: x.balance,
    ...(typeof x.casa === 'boolean' ? { casa: x.casa } : {}), ...(resultado ? { resultado } : {}),
    ...(txt(x.sesionId) ? { sesionId: x.sesionId } : {}), ...(x.libre ? { libre: true } : {}),
    ...listaTexto('bien', x.bien), ...listaTexto('mal', x.mal), ...listaTexto('mirar', x.mirar), ...listaTexto('pasadas', x.pasadas),
  };
}

const listaTexto = (clave: 'bien' | 'mal' | 'mirar' | 'pasadas', v: unknown) => {
  const a = Array.isArray(v) ? [...new Set(v.filter((s): s is string => txt(s) && s !== ''))] : [];
  return a.length ? { [clave]: a } : {};
};

export const ETIQUETAS_BIEN = ['Defensa', 'Ataque rápido', 'Rebote', 'Tiro', 'Pase', 'Ritmo'];
export const ETIQUETAS_MAL = ['Pérdidas', 'Rebote', 'Cierre', 'Tiro libre', 'Defensa', 'Ritmo'];

/** Notas que hay que pasar a las fichas: una por jugadora marcada «a mirar» (de las que existen) a la que aún no se le pasó. */
export function notasDelBalance(e: Evento, existentes: string[]): { id: string; texto: string }[] {
  const marcador = e.resultado ? ` ${e.resultado.a}–${e.resultado.c}` : '';
  const cabecera = `Partido${e.titulo ? ` vs ${e.titulo}` : ''}${marcador}`;
  const resto = [e.bien?.length && `Funcionó: ${e.bien.join(', ')}`, e.mal?.length && `Falló: ${e.mal.join(', ')}`, e.balance.trim()].filter(Boolean).join('. ');
  return (e.mirar ?? [])
    .filter((id) => existentes.includes(id) && !(e.pasadas ?? []).includes(id))
    .map((id) => ({ id, texto: `${cabecera}. A mirar${resto ? `. ${resto}` : ''}` }));
}

function limpiaFijo(f: unknown): EntrenoFijo | null {
  const x = f as EntrenoFijo;
  if (!x || !txt(x.id) || !Number.isInteger(x.dia) || x.dia < 0 || x.dia > 6 || !esHora(x.hora) || !Number.isFinite(x.minutos) || x.minutos <= 0) return null;
  return { id: x.id, dia: x.dia, hora: x.hora, minutos: x.minutos };
}

/** Deja solo lo válido de una temporada (también al cargar una copia). */
export function limpiarTemporada(t: unknown): Temporada | null {
  const x = t as Temporada;
  if (!x || !txt(x.equipoId) || !esFecha(x.inicio) || !esFecha(x.fin)) return null;
  const ex: Record<string, Excepcion> = {};
  for (const [k, v] of Object.entries(x.excepciones && typeof x.excepciones === 'object' ? x.excepciones : {})) {
    const e = v as Excepcion;
    if (!e || typeof e !== 'object' || !/^.+\|\d{4}-\d{2}-\d{2}$/.test(k)) continue;
    ex[k] = { ...(e.cancelado === true ? { cancelado: true } : {}), ...(esHora(e.hora) ? { hora: e.hora } : {}), ...(txt(e.sesionId) ? { sesionId: e.sesionId } : {}) };
  }
  const asistencia: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(x.asistencia && typeof x.asistencia === 'object' ? x.asistencia : {})) {
    if (k && Array.isArray(v)) asistencia[k] = [...new Set(v.filter((id): id is string => txt(id) && id !== ''))];
  }
  const lista = <T,>(a: unknown, f: (x: unknown) => T | null): T[] => (Array.isArray(a) ? a.map(f).filter((y): y is T => y !== null) : []);
  return {
    equipoId: x.equipoId, inicio: x.inicio, fin: x.fin < x.inicio ? x.inicio : x.fin,
    fases: lista(x.fases, limpiaFase), fijos: lista(x.fijos, limpiaFijo), eventos: lista(x.eventos, limpiaEvento), excepciones: ex,
    ...(Object.keys(asistencia).length ? { asistencia } : {}),
  };
}

export function limpiarTemporadas(l: unknown): Temporada[] {
  const vistos = new Set<string>();
  return (Array.isArray(l) ? l : []).map(limpiarTemporada).filter((t): t is Temporada => {
    if (!t || vistos.has(t.equipoId)) return false;
    vistos.add(t.equipoId);
    return true;
  });
}

export function leerTemporadas(): Temporada[] {
  try {
    return limpiarTemporadas(JSON.parse(localStorage.getItem(CLAVE) ?? '[]'));
  } catch {
    return [];
  }
}

/** Devuelve false si el móvil no deja guardar. */
export function guardarTemporadas(l: Temporada[]): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpiarTemporadas(l)));
    return true;
  } catch {
    return false;
  }
}

export const temporadaDe = (l: Temporada[], equipoId: string) => l.find((t) => t.equipoId === equipoId);

export const guardarTemporada = (l: Temporada[], t: Temporada): Temporada[] =>
  l.some((x) => x.equipoId === t.equipoId) ? l.map((x) => (x.equipoId === t.equipoId ? t : x)) : [...l, t];

/** Junta lo de una copia con lo actual: si es el mismo equipo, gana la copia. */
export const juntarTemporadas = (actual: Temporada[], copia: Temporada[]): Temporada[] => {
  const ids = new Set(copia.map((t) => t.equipoId));
  return [...actual.filter((t) => !ids.has(t.equipoId)), ...copia];
};

/** Temporada sin las de equipos que ya no existen. */
export const soloDeEquipos = (l: Temporada[], equipoIds: string[]) => l.filter((t) => equipoIds.includes(t.equipoId));

export const faseDe = (t: Temporada, fecha: string): Fase | undefined => t.fases.find((f) => f.desde <= fecha && fecha <= f.hasta);

const claveFijo = (f: EntrenoFijo, fecha: string) => `${f.id}|${fecha}`;

/** Todo lo que pasa un día: eventos y entrenos fijos (con los cambios), ordenado por hora. */
export function agendaDia(t: Temporada, fecha: string): Item[] {
  const items: Item[] = t.eventos
    .filter((e) => e.fecha === fecha)
    .map((e) => ({ clave: e.id, fecha, hora: e.hora, tipo: e.tipo, titulo: e.titulo, evento: e, sesionId: e.sesionId }));
  const libre = t.eventos.some((e) => e.fecha === fecha && e.libre);
  const paron = faseDe(t, fecha)?.sinEntreno;
  if (!libre && !paron && fecha >= t.inicio && fecha <= t.fin) {
    for (const f of t.fijos) {
      if (f.dia !== diaSemana(fecha)) continue;
      const ex = t.excepciones[claveFijo(f, fecha)] ?? {};
      items.push({ clave: claveFijo(f, fecha), fecha, hora: ex.hora ?? f.hora, tipo: 'entreno', titulo: 'Entreno', fijo: f, cancelado: ex.cancelado, sesionId: ex.sesionId });
    }
  }
  return items.sort((a, b) => a.hora.localeCompare(b.hora));
}

/** Tipos que se pintan en el calendario ese día (los entrenos cancelados no cuentan). */
export function marcasDia(t: Temporada, fecha: string): { partido: boolean; entreno: boolean; otro: boolean } {
  const v = agendaDia(t, fecha).filter((i) => !i.cancelado);
  return { partido: v.some((i) => i.tipo === 'partido'), entreno: v.some((i) => i.tipo === 'entreno'), otro: v.some((i) => i.tipo === 'otro') };
}

export const guardarEvento = (t: Temporada, e: Evento): Temporada => ({
  ...t, eventos: t.eventos.some((x) => x.id === e.id) ? t.eventos.map((x) => (x.id === e.id ? e : x)) : [...t.eventos, e],
});
export const quitarEvento = (t: Temporada, id: string): Temporada => ({ ...t, eventos: t.eventos.filter((e) => e.id !== id), ...sinAsistencia(t, (k) => k === id) });

function sinAsistencia(t: Temporada, quitar: (clave: string) => boolean): Pick<Temporada, 'asistencia'> {
  if (!t.asistencia) return {};
  const resto = Object.fromEntries(Object.entries(t.asistencia).filter(([k]) => !quitar(k)));
  return Object.keys(resto).length ? { asistencia: resto } : { asistencia: undefined };
}

/** Guarda quién vino a un entreno; `null` borra la lista de ese día. */
export function ponerAsistencia(t: Temporada, clave: string, ids: string[] | null): Temporada {
  const { asistencia: _, ...resto } = t;
  const a = { ...t.asistencia };
  if (ids) a[clave] = ids;
  else delete a[clave];
  return Object.keys(a).length ? { ...resto, asistencia: a } : resto;
}

/** A cuántos entrenos con lista vino una jugadora. */
export function resumenAsistencia(t: Temporada | undefined, jugadoraId: string): { vino: number; de: number } {
  const listas = Object.values(t?.asistencia ?? {});
  return { vino: listas.filter((l) => l.includes(jugadoraId)).length, de: listas.length };
}

export const guardarFase = (t: Temporada, f: Fase): Temporada => ({
  ...t, fases: (t.fases.some((x) => x.id === f.id) ? t.fases.map((x) => (x.id === f.id ? f : x)) : [...t.fases, f]).sort((a, b) => a.desde.localeCompare(b.desde)),
});
export const quitarFase = (t: Temporada, id: string): Temporada => ({ ...t, fases: t.fases.filter((f) => f.id !== id) });

export const guardarFijo = (t: Temporada, f: EntrenoFijo): Temporada => ({
  ...t, fijos: t.fijos.some((x) => x.id === f.id) ? t.fijos.map((x) => (x.id === f.id ? f : x)) : [...t.fijos, f],
});
/** Al quitar un entreno fijo se van también sus cambios sueltos. */
export const quitarFijo = (t: Temporada, id: string): Temporada => ({
  ...t,
  fijos: t.fijos.filter((f) => f.id !== id),
  excepciones: Object.fromEntries(Object.entries(t.excepciones).filter(([k]) => !k.startsWith(`${id}|`))),
  ...sinAsistencia(t, (k) => k.startsWith(`${id}|`)),
});

export function cambiarFijoDia(t: Temporada, item: Item, cambio: Excepcion): Temporada {
  const previo = t.excepciones[item.clave] ?? {};
  const nuevo = { ...previo, ...cambio };
  const excepciones = { ...t.excepciones };
  if (!nuevo.cancelado && !nuevo.hora && !nuevo.sesionId) delete excepciones[item.clave];
  else excepciones[item.clave] = nuevo;
  return { ...t, excepciones };
}

/** Fecha de inicio y fin por defecto de una temporada: de septiembre a junio. */
export function temporadaPorDefecto(hoyTexto: string): { inicio: string; fin: string } {
  const a = Number(hoyTexto.slice(0, 4));
  const m = Number(hoyTexto.slice(5, 7));
  const ini = m >= 7 ? a : a - 1;
  return { inicio: `${ini}-09-01`, fin: `${ini + 1}-06-30` };
}

/** Los próximos partidos no jugados, para avisar en Inicio. */
export const proximoPartido = (t: Temporada, desde: string): Evento | undefined =>
  t.eventos.filter((e) => e.tipo === 'partido' && e.fecha >= desde).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))[0];

/** Mete en la temporada lo que salió de un .ics o de una lista: sin repetir lo que ya está. */
export function aplicarCandidatas(t: Temporada, cs: Candidata[]): Temporada {
  let r = t;
  for (const c of cs) {
    if (c.semanal) {
      const dia = diaSemana(c.fecha);
      if (!r.fijos.some((f) => f.dia === dia && f.hora === c.hora)) r = guardarFijo(r, { ...nuevoFijo(dia), hora: c.hora, minutos: c.minutos ?? 90 });
      continue;
    }
    const repetido = r.eventos.some((e) => e.fecha === c.fecha && e.hora === c.hora && e.tipo === c.tipo && e.titulo === c.titulo);
    if (repetido) continue;
    r = guardarEvento(r, { ...nuevoEvento(c.fecha, c.tipo), hora: c.hora, titulo: c.titulo, lugar: c.lugar, ...(c.tipo === 'partido' ? { casa: c.casa ?? true } : { casa: undefined }) });
  }
  return r;
}

const MINUTOS: Record<TipoEvento, number> = { partido: 90, entreno: 90, otro: 60 };

/** Todo lo de la temporada, día a día, listo para escribir en .ics (como mucho dos años). */
export function itemsParaIcs(t: Temporada) {
  const fuera: ItemIcs[] = [];
  const dias = Math.min(diasEntre(t.inicio, t.fin), 730);
  const fechas = new Set<string>(t.eventos.map((e) => e.fecha));
  for (let i = 0; i <= dias; i++) fechas.add(sumarDias(t.inicio, i));
  for (const fecha of [...fechas].sort()) {
    for (const i of agendaDia(t, fecha)) {
      if (i.cancelado) continue;
      fuera.push({ fecha, hora: i.hora, tipo: i.tipo, titulo: i.evento?.titulo ?? i.titulo, casa: i.evento?.casa, lugar: i.evento?.lugar, minutos: i.fijo?.minutos ?? MINUTOS[i.tipo], uid: i.clave });
    }
  }
  return fuera;
}
