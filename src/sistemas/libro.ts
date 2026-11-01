// Libro de jugadas del equipo: las favoritas (estrella) y las que se trabajan «esta semana». Solo en este móvil, por equipo.
import { guardarLista, leerLista } from '../equipo/porEquipo';

export const leerSemana = (): string[] => leerLista('semana');

/** Devuelve la lista con la jugada puesta o quitada de «esta semana» y la guarda (en la lista del equipo activo). */
export function alternarSemana(lista: string[], id: string): string[] {
  const nueva = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  guardarLista('semana', nueva); // sin almacenamiento: dura hasta cerrar la app
  return nueva;
}

/** Guarda la lista entera (al cargar una copia). Devuelve false si el móvil no deja. */
export const guardarSemana = (lista: string[]): boolean => guardarLista('semana', lista);

/** Quita las jugadas que ya no existen (una propia borrada). */
export const semanaVigente = (lista: string[], existentes: ReadonlySet<string>) => lista.filter((id) => existentes.has(id));
