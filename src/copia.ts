// Copia de seguridad: un archivo con las jugadas propias y los colores, para pasarlas a otro móvil
// o recuperarlas si se borra Safari (todo vive solo en el móvil, sin cuentas).
import { esSistemaValido } from './sistemas/almacen';
import type { Sistema } from './sistemas/tipos';
import type { Colores } from './temas';
import { limpiar, type Diario } from './diario/diario';
import { limpiarFichas, type Ficha } from './recursos/fichas';
import { limpiarRecursos, type Recurso } from './recursos/recursos';
import { limpiarTemporadas, soloDeEquipos, type Temporada } from './temporada/temporada';

// Se queda «cuernos» (nombre antiguo de la app) para que sigan valiendo las copias ya guardadas.
const MARCA = 'cuernos-copia';

export function armarCopia(mios: Sistema[], colores: Colores, diario?: Diario, temporadas?: Temporada[], recursos?: Recurso[], fichas?: Ficha[]): string {
  return JSON.stringify({ app: MARCA, version: 2, fecha: new Date().toISOString(), mios, colores, diario, temporadas, recursos, fichas }, null, 1);
}

/** Lee un archivo de copia. Lanza un error con un mensaje para el entrenador si no vale. */
export function leerCopia(texto: string): { mios: Sistema[]; colores?: Colores; diario?: Diario; temporadas?: Temporada[]; recursos?: Recurso[]; fichas?: Ficha[] } {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('Ese archivo no es una copia de Horns.');
  }
  const d = datos as { app?: string; mios?: unknown; colores?: Colores; diario?: unknown; temporadas?: unknown; recursos?: unknown; fichas?: unknown };
  if (d?.app !== MARCA || !Array.isArray(d.mios)) throw new Error('Ese archivo no es una copia de Horns.');
  const mios = d.mios.filter(esSistemaValido);
  const hex = /^#[0-9a-f]{6}$/i;
  const colores = d.colores && ['principal', 'fondo', 'pista', 'jugadores'].every((k) => hex.test(String(d.colores![k as keyof Colores]))) ? d.colores : undefined;
  const diario = d.diario ? limpiar(d.diario) : undefined;
  // Una temporada sin su equipo no sirve: si la copia trae plantilla, solo valen las de esos equipos.
  const temporadas = d.temporadas ? limpiarTemporadas(d.temporadas) : undefined;
  const recursos = d.recursos ? limpiarRecursos(d.recursos) : undefined;
  const fichas = d.fichas ? limpiarFichas(d.fichas) : undefined;
  return { mios, colores, diario, recursos, fichas, temporadas: temporadas && diario ? soloDeEquipos(temporadas, diario.equipos.map((e) => e.id)) : temporadas };
}

/** Junta las jugadas de la copia con las que ya hay: si coinciden, gana la de la copia. */
export function juntar(actuales: Sistema[], deLaCopia: Sistema[]): Sistema[] {
  const ids = new Set(deLaCopia.map((s) => s.id));
  return [...actuales.filter((s) => !ids.has(s.id)), ...deLaCopia];
}
