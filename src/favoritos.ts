// Favoritos: las jugadas y ejercicios marcados con la estrella (solo en este móvil, por equipo). Cada id lleva su tipo delante: «j:» o «e:».
import { guardarLista, leerLista } from './equipo/porEquipo';

export const leerFavoritos = (): string[] => leerLista('favoritos');

/** Devuelve la lista nueva con el id puesto o quitado y la guarda (en la lista del equipo activo). */
export function alternarFavorito(lista: string[], id: string): string[] {
  const nueva = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  guardarLista('favoritos', nueva); // sin almacenamiento: dura hasta cerrar la app
  return nueva;
}

/** Guarda la lista entera (al cargar una copia). Devuelve false si el móvil no deja. */
export const guardarFavoritos = (lista: string[]): boolean => guardarLista('favoritos', lista);

/** Quita acentos y mayúsculas para que «defensa» encuentre «Defensa» y «junior» a «Júnior». */
export const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const coincide = (q: string, ...textos: (string | undefined)[]) => {
  const buscado = plano(q.trim());
  return !buscado || plano(textos.filter(Boolean).join(' ')).includes(buscado);
};
