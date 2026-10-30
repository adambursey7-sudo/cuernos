// Copia de seguridad: un archivo con las jugadas propias y los colores, para pasarlas a otro móvil
// o recuperarlas si se borra Safari (todo vive solo en el móvil, sin cuentas).
import { esSistemaValido } from './sistemas/almacen';
import type { Sistema } from './sistemas/tipos';
import type { Colores } from './temas';
import { limpiar, type Diario } from './diario/diario';

// Se queda «cuernos» (nombre antiguo de la app) para que sigan valiendo las copias ya guardadas.
const MARCA = 'cuernos-copia';

export function armarCopia(mios: Sistema[], colores: Colores, diario?: Diario): string {
  return JSON.stringify({ app: MARCA, version: 2, fecha: new Date().toISOString(), mios, colores, diario }, null, 1);
}

/** Lee un archivo de copia. Lanza un error con un mensaje para el entrenador si no vale. */
export function leerCopia(texto: string): { mios: Sistema[]; colores?: Colores; diario?: Diario } {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('Ese archivo no es una copia de Horns.');
  }
  const d = datos as { app?: string; mios?: unknown; colores?: Colores; diario?: unknown };
  if (d?.app !== MARCA || !Array.isArray(d.mios)) throw new Error('Ese archivo no es una copia de Horns.');
  const mios = d.mios.filter(esSistemaValido);
  const hex = /^#[0-9a-f]{6}$/i;
  const colores = d.colores && ['principal', 'fondo', 'pista', 'jugadores'].every((k) => hex.test(String(d.colores![k as keyof Colores]))) ? d.colores : undefined;
  const diario = d.diario ? limpiar(d.diario) : undefined;
  return { mios, colores, diario };
}

/** Junta las jugadas de la copia con las que ya hay: si coinciden, gana la de la copia. */
export function juntar(actuales: Sistema[], deLaCopia: Sistema[]): Sistema[] {
  const ids = new Set(deLaCopia.map((s) => s.id));
  return [...actuales.filter((s) => !ids.has(s.id)), ...deLaCopia];
}
