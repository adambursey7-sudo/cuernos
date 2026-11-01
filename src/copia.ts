// Copia de seguridad: un archivo con las jugadas propias y los colores, para pasarlas a otro móvil
// o recuperarlas si se borra Safari (todo vive solo en el móvil, sin cuentas).
import { esSistemaValido } from './sistemas/almacen';
import type { Sistema } from './sistemas/tipos';
import type { Colores } from './temas';
import { limpiar, sinSalud, type Diario } from './diario/diario';
import { limpiarReflexiones, type Reflexion } from './diario/reflexion';
import { limpiarEtiquetas, type Etiquetas } from './habilidades/habilidades';
import { limpiarFichas, type Ficha } from './recursos/fichas';
import { limpiarRecursos, type Recurso } from './recursos/recursos';
import { limpiarPorEquipo } from './equipo/porEquipo';
import { limpiarSesiones, type Sesion } from './sesiones/sesiones';
import { limpiarTemporadas, soloDeEquipos, type Temporada } from './temporada/temporada';

// Se queda «cuernos» (nombre antiguo de la app) para que sigan valiendo las copias ya guardadas.
const MARCA = 'cuernos-copia';

/** Lo que se añadió después (versión 3): sesiones, estrellas y libro de la semana. Una copia vieja no lo trae y no pasa nada. */
export interface ExtraCopia {
  sesiones?: Sesion[];
  favoritos?: string[];
  semana?: string[];
  /** Estrellas y libro de la semana propios de cada equipo (por id de equipo). */
  porEquipo?: PorEquipo;
}

export interface PorEquipo {
  favoritos: Record<string, string[]>;
  semana: Record<string, string[]>;
}

/** Las lesiones (dato de salud) solo entran en la copia si se piden (`conSalud`). */
export function armarCopia(mios: Sistema[], colores: Colores, diario?: Diario, temporadas?: Temporada[], recursos?: Recurso[], fichas?: Ficha[], conSalud = false, etiquetas?: Etiquetas, reflexiones?: Reflexion[], extra?: ExtraCopia): string {
  // Solo lo de equipos que existen: lo que quedara suelto de un equipo borrado no viaja en la copia.
  const ids = diario ? new Set(diario.equipos.map((e) => e.id)) : undefined;
  const sesiones = extra?.sesiones && ids ? extra.sesiones.filter((s) => !s.equipoId || ids.has(s.equipoId)) : extra?.sesiones;
  return JSON.stringify({
    app: MARCA, version: extra ? 3 : 2, fecha: new Date().toISOString(), mios, colores, diario: diario && !conSalud ? sinSalud(diario) : diario,
    temporadas: temporadas && ids ? soloDeEquipos(temporadas, [...ids]) : temporadas, recursos, fichas, etiquetas,
    reflexiones: reflexiones && ids ? reflexiones.filter((r) => ids.has(r.equipoId)) : reflexiones, ...extra, ...(sesiones ? { sesiones } : {}),
  }, null, 1);
}

const textos = (x: unknown): string[] | undefined => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string' && s.length < 200).slice(0, 1000) : undefined);

/** Lee un archivo de copia. Lanza un error con un mensaje para el entrenador si no vale. */
export function leerCopia(texto: string): { mios: Sistema[]; colores?: Colores; diario?: Diario; temporadas?: Temporada[]; recursos?: Recurso[]; fichas?: Ficha[]; etiquetas?: Etiquetas; reflexiones?: Reflexion[]; sesiones?: Sesion[]; favoritos?: string[]; semana?: string[]; porEquipo?: PorEquipo } {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('Ese archivo no es una copia de Horns.');
  }
  const d = datos as { app?: string; mios?: unknown; colores?: Colores; diario?: unknown; temporadas?: unknown; recursos?: unknown; fichas?: unknown; etiquetas?: unknown; reflexiones?: unknown; sesiones?: unknown; favoritos?: unknown; semana?: unknown; porEquipo?: { favoritos?: unknown; semana?: unknown } };
  if (d?.app !== MARCA || !Array.isArray(d.mios)) throw new Error('Ese archivo no es una copia de Horns.');
  const mios = d.mios.filter(esSistemaValido);
  const hex = /^#[0-9a-f]{6}$/i;
  const colores = d.colores && ['principal', 'fondo', 'pista', 'jugadores'].every((k) => hex.test(String(d.colores![k as keyof Colores]))) ? d.colores : undefined;
  const diario = d.diario ? limpiar(d.diario) : undefined;
  // Una temporada sin su equipo no sirve: si la copia trae plantilla, solo valen las de esos equipos.
  const temporadas = d.temporadas ? limpiarTemporadas(d.temporadas) : undefined;
  const recursos = d.recursos ? limpiarRecursos(d.recursos) : undefined;
  const fichas = d.fichas ? limpiarFichas(d.fichas) : undefined;
  const etiquetas = d.etiquetas ? limpiarEtiquetas(d.etiquetas) : undefined;
  const reflexiones = d.reflexiones ? limpiarReflexiones(d.reflexiones) : undefined;
  const sesiones = d.sesiones ? limpiarSesiones(d.sesiones) : undefined;
  const ids = diario ? new Set(diario.equipos.map((e) => e.id)) : undefined;
  const porEquipo = d.porEquipo ? { favoritos: limpiarPorEquipo(d.porEquipo.favoritos, ids), semana: limpiarPorEquipo(d.porEquipo.semana, ids) } : undefined;
  return {
    mios, colores, diario, recursos, fichas, etiquetas, favoritos: textos(d.favoritos), semana: textos(d.semana), porEquipo,
    reflexiones: reflexiones && ids ? reflexiones.filter((r) => ids.has(r.equipoId)) : reflexiones,
    sesiones: sesiones && ids ? sesiones.filter((s) => !s.equipoId || ids.has(s.equipoId)) : sesiones,
    temporadas: temporadas && diario ? soloDeEquipos(temporadas, diario.equipos.map((e) => e.id)) : temporadas,
  };
}

/** Junta las jugadas de la copia con las que ya hay: si coinciden, gana la de la copia. */
export function juntar(actuales: Sistema[], deLaCopia: Sistema[]): Sistema[] {
  const ids = new Set(deLaCopia.map((s) => s.id));
  return [...actuales.filter((s) => !ids.has(s.id)), ...deLaCopia];
}

/** Une dos listas de ids sin repetir, conservando el orden. */
export const unirTextos = (actual: string[], copia: string[] = []): string[] => [...new Set([...actual, ...copia])];

/** De todo lo guardado, solo lo de un equipo (para la copia de un único equipo). */
export function recortarAEquipo(id: string, todo: { diario: Diario; temporadas: Temporada[]; sesiones: Sesion[]; reflexiones: Reflexion[] }) {
  const equipo = todo.diario.equipos.find((e) => e.id === id);
  if (!equipo) return undefined;
  return {
    diario: { equipos: [equipo], jugadoras: todo.diario.jugadoras.filter((j) => j.equipoId === id) },
    temporadas: todo.temporadas.filter((t) => t.equipoId === id),
    sesiones: todo.sesiones.filter((s) => (s.equipoId ? s.equipoId === id : s.equipo === equipo.nombre)),
    reflexiones: todo.reflexiones.filter((r) => r.equipoId === id),
  };
}
