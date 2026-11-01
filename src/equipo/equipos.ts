// Montar y mover equipos enteros: el equipo activo, el asistente de «Nuevo equipo», el equipo de ejemplo,
// duplicar, heredar de otro, cerrar la temporada y empezar la siguiente. Todo son funciones puras sobre los datos;
// las pantallas guardan el resultado. Aquí no hay nombres reales: el ejemplo usa «Ejemplo Uno»…
import { leerDiario, nuevaJugadora, nuevoEquipo, type Diario, type Equipo, type Jugadora, type TipoEquipo } from '../diario/diario';
import { leerTexto } from '../diario/importar';
import type { Sesion } from '../sesiones/sesiones';
import { esFecha, lunesDe, sumarDias } from '../temporada/fechas';
import { balanceLiga, nuevaTemporada, nuevoFijo, type Archivada, type Temporada } from '../temporada/temporada';
import { escudoPorDefecto, etiquetaTemporada, limpiarEscudo, type Escudo, type Genero } from './modelo';

const CLAVE = 'horns.equipoActivo';

export function leerActivoId(): string {
  try {
    return localStorage.getItem(CLAVE) ?? '';
  } catch {
    return '';
  }
}

export function ponerActivoId(id: string): void {
  try {
    localStorage.setItem(CLAVE, id);
  } catch {
    /* sin almacenamiento: vuelve al primer equipo al reabrir */
  }
}

/** El equipo con el que se trabaja: el último elegido si sigue existiendo; si no, el primero. */
export const equipoActivo = (equipos: Equipo[], id: string): Equipo | undefined => equipos.find((e) => e.id === id) ?? equipos[0];

export interface EntrenoNuevo {
  /** 0 = lunes … 6 = domingo. */
  dia: number;
  hora: string;
  minutos: number;
  pista?: string;
  vestuario?: string;
}

export interface DatosNuevoEquipo {
  nombre: string;
  categoria?: string;
  genero: Genero;
  tipo: TipoEquipo;
  inicio: string;
  fin: string;
  color?: string;
  escudo?: Escudo;
  entrenos: EntrenoNuevo[];
  /** Lista pegada de la plantilla (un jugador por línea: dorsal, nombre y, si se quiere, posición). */
  lista: string;
}

export interface EquipoMontado {
  equipo: Equipo;
  jugadoras: Jugadora[];
  temporada: Temporada;
}

/** Qué falta para poder crear el equipo (vacío si ya se puede). */
export function problemasNuevoEquipo(d: Pick<DatosNuevoEquipo, 'nombre' | 'inicio' | 'fin'>, existentes: Pick<Equipo, 'nombre'>[] = []): string[] {
  const p: string[] = [];
  if (!d.nombre.trim()) p.push('Pon un nombre al equipo.');
  else if (existentes.some((e) => e.nombre.trim().toLowerCase() === d.nombre.trim().toLowerCase())) p.push('Ya tienes un equipo con ese nombre.');
  if (!esFecha(d.inicio) || !esFecha(d.fin)) p.push('Pon la fecha de inicio y la de fin de la temporada.');
  else if (d.fin < d.inicio) p.push('La temporada no puede acabar antes de empezar.');
  return p;
}

/** Con lo que se ha contestado en el asistente, el equipo, su plantilla y su temporada, listos para guardar. */
export function montarEquipo(d: DatosNuevoEquipo): EquipoMontado {
  const base = nuevoEquipo(d.nombre.trim().slice(0, 40), d.tipo);
  const escudo = limpiarEscudo(d.escudo) ?? escudoPorDefecto(base.nombre);
  const equipo: Equipo = {
    ...base,
    genero: d.genero,
    ...(d.categoria?.trim() ? { categoria: d.categoria.trim().slice(0, 30) } : {}),
    temporada: etiquetaTemporada(d.inicio),
    ...(d.color && /^#[0-9a-f]{6}$/i.test(d.color) ? { color: d.color.toLowerCase() } : {}),
    escudo,
  };
  const jugadoras = leerTexto(d.lista).slice(0, 30).map((c) => nuevaJugadora(equipo.id, c));
  let temporada = nuevaTemporada(equipo.id, d.inicio, d.fin < d.inicio ? d.inicio : d.fin);
  for (const e of d.entrenos) temporada = { ...temporada, fijos: [...temporada.fijos, { ...nuevoFijo(e.dia), hora: e.hora, minutos: e.minutos, ...(e.pista ? { pista: e.pista } : {}), ...(e.vestuario ? { vestuario: e.vestuario } : {}) }] };
  return { equipo, jugadoras, temporada };
}

/** Lista de ejemplo (10 jugadores, nombres inventados) para probar la app sin escribir nada. */
const NOMBRES = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez'];
const POSICIONES_EJEMPLO = ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'];

export function listaEjemplo(): string {
  return NOMBRES.map((n, i) => `${i + 4} Ejemplo ${n} ${POSICIONES_EJEMPLO[i % 5]}`).join('\n');
}

/** Equipo de ejemplo con plantilla, dos entrenos a la semana y algunos partidos de la temporada, para recorrer la app. */
export function equipoEjemplo(hoyTexto: string, genero: Genero, tipo: TipoEquipo): EquipoMontado {
  const año = Number(hoyTexto.slice(5, 7)) >= 7 ? Number(hoyTexto.slice(0, 4)) : Number(hoyTexto.slice(0, 4)) - 1;
  const m = montarEquipo({
    nombre: 'Equipo de ejemplo', categoria: tipo === 'senior' ? 'Senior' : 'Cadete', genero, tipo,
    inicio: `${año}-09-01`, fin: `${año + 1}-06-30`, color: '#f2b134',
    entrenos: [{ dia: 1, hora: '19:00', minutos: 90, pista: 'Pista 1' }, { dia: 3, hora: '19:00', minutos: 90, pista: 'Pista 1' }],
    lista: listaEjemplo(),
  });
  const lunes = lunesDe(hoyTexto);
  const rivales = ['Ejemplo Rival A', 'Ejemplo Rival B', 'Ejemplo Rival C'];
  const eventos = rivales.map((r, i) => ({
    id: `ev-ejemplo-${i}`, fecha: sumarDias(lunes, 5 + 7 * (i - 1)), hora: '11:00', tipo: 'partido' as const, titulo: r, casa: i % 2 === 0, lugar: i % 2 === 0 ? 'Pabellón' : 'Fuera',
    balance: '', jornada: i + 1,
    ...(i === 0 ? { resultado: { a: 58, c: 51 } } : {}),
  }));
  return { ...m, equipo: { ...m.equipo, ejemplo: true }, temporada: { ...m.temporada, eventos } };
}

/** Añade el equipo montado al diario. */
export const anadirEquipo = (d: Diario, m: EquipoMontado): Diario => ({ equipos: [...d.equipos, m.equipo], jugadoras: [...d.jugadoras, ...m.jugadoras] });

const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface Duplicado {
  equipo: Equipo;
  jugadoras: Jugadora[];
  temporada?: Temporada;
  sesiones: Sesion[];
}

/** Copia de un equipo con todo lo suyo y ids nuevos. Sin la lista de partidos ni la asistencia (eso es de esa temporada). Las lesiones no pasan a la copia. */
export function duplicarEquipo(d: Diario, temporadas: Temporada[], sesiones: Sesion[], id: string, nombre?: string): Duplicado | undefined {
  const origen = d.equipos.find((e) => e.id === id);
  if (!origen) return undefined;
  const suyas = d.jugadoras.filter((j) => j.equipoId === id);
  const nuevoEq = nuevoId('e');
  const mapa = new Map(suyas.map((j) => [j.id, nuevoId('j')]));
  const { rotacion: _r, puestos, ejemplo: _e, ...resto } = origen;
  const equipo: Equipo = {
    ...resto, id: nuevoEq, nombre: (nombre ?? `${origen.nombre} (copia)`).slice(0, 40),
    ...(puestos ? { puestos: Object.fromEntries(Object.entries(puestos).flatMap(([k, v]) => (v && mapa.has(v) ? [[k, mapa.get(v)!]] : []))) as Equipo['puestos'] } : {}),
    ...(origen.staff ? { staff: origen.staff.map((s) => ({ ...s, id: nuevoId('s') })) } : {}),
    ...(origen.objetivos ? { objetivos: origen.objetivos.map((o) => ({ id: nuevoId('o'), texto: o.texto })) } : {}),
  };
  const jugadoras = suyas.map(({ lesion: _l, ...j }) => ({ ...j, id: mapa.get(j.id)!, equipoId: nuevoEq }));
  const t = temporadas.find((x) => x.equipoId === id);
  const temporada = t ? { ...nuevaTemporada(nuevoEq, t.inicio, t.fin), fijos: t.fijos.map((f) => ({ ...f, id: nuevoId('x') })), fases: t.fases.map((f) => ({ ...f, id: nuevoId('f') })) } : undefined;
  const copiadas = sesionesDeEquipo(sesiones, origen).map((s) => ({ ...s, id: nuevoId('s'), equipoId: nuevoEq, equipo: equipo.nombre, bloques: s.bloques.map((b) => ({ ...b })) }));
  return { equipo, jugadoras, temporada, sesiones: copiadas };
}

const sesionesDeEquipo = (todas: Sesion[], e: Pick<Equipo, 'id' | 'nombre'>) => todas.filter((s) => (s.equipoId ? s.equipoId === e.id : s.equipo === e.nombre));

export interface QueHeredar {
  horarios: boolean;
  sesiones: boolean;
  reglas: boolean;
  forma: boolean;
  objetivos: boolean;
}

export const HEREDAR_TODO: QueHeredar = { horarios: true, sesiones: true, reglas: true, forma: true, objetivos: true };

/** «Plantilla de equipo»: lleva a un equipo ya creado lo que se elige de otro, sin jugadores ni partidos. No pisa lo que ya tiene escrito. */
export function heredarDe(
  d: Diario, temporadas: Temporada[], sesiones: Sesion[], deId: string, aId: string, que: QueHeredar,
): { diario: Diario; temporadas: Temporada[]; sesiones: Sesion[] } | undefined {
  const de = d.equipos.find((e) => e.id === deId);
  const a = d.equipos.find((e) => e.id === aId);
  if (!de || !a || deId === aId) return undefined;
  const nuevo: Equipo = { ...a };
  if (que.reglas && de.reglas && !a.reglas) nuevo.reglas = de.reglas;
  if (que.forma) {
    for (const k of ['forma', 'virtudes', 'trabajar', 'como'] as const) if (!a[k].trim()) nuevo[k] = de[k];
    if (de.habilidades && !a.habilidades) nuevo.habilidades = de.habilidades.map((h) => ({ ...h }));
  }
  if (que.objetivos && de.objetivos?.length && !a.objetivos?.length) nuevo.objetivos = de.objetivos.map((o) => ({ id: nuevoId('o'), texto: o.texto }));
  let ts = temporadas;
  const tDe = temporadas.find((t) => t.equipoId === deId);
  const tA = temporadas.find((t) => t.equipoId === aId);
  if (que.horarios && tDe) {
    const base = tA ?? nuevaTemporada(aId, tDe.inicio, tDe.fin);
    const ya = (f: { dia: number; hora: string }) => base.fijos.some((x) => x.dia === f.dia && x.hora === f.hora);
    const fijos = [...base.fijos, ...tDe.fijos.filter((f) => !ya(f)).map((f) => ({ ...f, id: nuevoId('x') }))];
    const t = { ...base, fijos };
    ts = tA ? temporadas.map((x) => (x.equipoId === aId ? t : x)) : [...temporadas, t];
  }
  const nuevasSesiones = que.sesiones
    ? sesionesDeEquipo(sesiones, de).map((s) => ({ ...s, id: nuevoId('s'), equipoId: aId, equipo: a.nombre, bloques: s.bloques.map((b) => ({ ...b })) }))
    : [];
  return { diario: { ...d, equipos: d.equipos.map((e) => (e.id === aId ? nuevo : e)) }, temporadas: ts, sesiones: [...sesiones, ...nuevasSesiones] };
}

/** Texto corto del balance de una temporada ya cerrada, para el historial. */
export function resumenArchivada(a: Archivada): string {
  const b = balanceLiga({ equipoId: '-', inicio: a.inicio, fin: a.fin, fases: [], fijos: [], eventos: a.eventos, excepciones: {} });
  const partidos = a.eventos.filter((e) => e.tipo === 'partido' && e.resultado).length;
  return partidos ? `${a.etiqueta}: ${b.g} ganados y ${b.p} perdidos en ${partidos} partidos` : `${a.etiqueta}: sin partidos apuntados`;
}

/** Cierra la temporada: se guarda lo jugado en el historial y queda la temporada vacía para apuntar, con los mismos horarios un año después. */
export function cerrarTemporada(t: Temporada, etiqueta: string): Temporada {
  const archivada: Archivada = {
    etiqueta: etiqueta.trim().slice(0, 12) || etiquetaTemporada(t.inicio) || 'Anterior', inicio: t.inicio, fin: t.fin, eventos: t.eventos,
    ...(t.asistencia ? { asistencia: t.asistencia } : {}), ...(t.clasificacion ? { clasificacion: t.clasificacion } : {}),
  };
  const salto = (f: string) => `${Number(f.slice(0, 4)) + 1}${f.slice(4)}`;
  const inicio = salto(t.inicio);
  const fin = salto(t.fin);
  return {
    equipoId: t.equipoId, inicio, fin, fases: [], fijos: t.fijos, eventos: [], excepciones: {},
    anteriores: [archivada, ...(t.anteriores ?? [])].slice(0, 10),
  };
}

/** El equipo pasa a la temporada siguiente: la plantilla se conserva, la rotación y los puestos del partido se vacían y las lesiones curadas siguen su curso. */
export function equipoSiguienteTemporada(e: Equipo): Equipo {
  const { rotacion: _r, ...resto } = e;
  const otra = e.temporada && /^\d{4}-\d{2}$/.test(e.temporada) ? `${Number(e.temporada.slice(0, 4)) + 1}-${String(Number(e.temporada.slice(5)) + 1).padStart(2, '0').slice(-2)}` : undefined;
  return { ...resto, ...(otra ? { temporada: otra } : {}), ...(e.objetivos ? { objetivos: e.objetivos.filter((o) => !o.hecho) } : {}) };
}

/** El equipo activo leído de lo guardado (para las pantallas que no reciben el equipo por parámetro). */
export const leerEquipoActivo = (): Equipo | undefined => equipoActivo(leerDiario().equipos, leerActivoId());
