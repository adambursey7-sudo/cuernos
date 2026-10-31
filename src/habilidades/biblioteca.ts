// Qué ejercicios y jugadas de la biblioteca trabajan cada habilidad (por etiqueta), y qué le falta al equipo.
import { todosLosEjercicios, type Ejercicio } from '../ejercicios/ejercicios';
import { todosLosSistemas } from '../sistemas/almacen';
import { bloqueDe, nuevaSesion, type Sesion } from '../sesiones/sesiones';
import type { Sistema } from '../sistemas/tipos';
import { etiquetasDe, leerEtiquetas, type Etiquetas, type HabilidadEquipo } from './habilidades';

const textoEjercicio = (e: Ejercicio) => `${e.formato} ${e.nombre} ${e.sistema.nombre}`;
const textoSistema = (s: Sistema) => `${s.nombre} ${s.idea}`;

export const etiquetasDeEjercicio = (e: Ejercicio, m?: Etiquetas) => etiquetasDe(e.id, textoEjercicio(e), m);
export const etiquetasDeSistema = (s: Sistema, m?: Etiquetas) => etiquetasDe(s.id, textoSistema(s), m);

export function ejerciciosDeHabilidad(habilidad: string, m: Etiquetas = leerEtiquetas()): Ejercicio[] {
  return todosLosEjercicios().filter((e) => etiquetasDeEjercicio(e, m).includes(habilidad));
}

export function sistemasDeHabilidad(habilidad: string, m: Etiquetas = leerEtiquetas()): Sistema[] {
  return todosLosSistemas().filter((s) => etiquetasDeSistema(s, m).includes(habilidad));
}

/** Lo que más falta al equipo: las «a trabajar», con cuántos ejercicios hay para cada una. */
export function loMasFlojo(hs: HabilidadEquipo[], m: Etiquetas = leerEtiquetas()) {
  return hs.filter((h) => h.estado === 'trabajar').map((h) => ({ h, ejercicios: ejerciciosDeHabilidad(h.id, m) }));
}

/** Una sesión con 1 o 2 ejercicios de cada habilidad «a trabajar» (máximo `tope`), repartidos por turnos para que ninguna se quede sin sitio. */
export function sesionDeLoFlojo(equipo: string, flojos: ReturnType<typeof loMasFlojo>, tope = 6): Sesion | undefined {
  const cola = flojos.map((f) => [...f.ejercicios]);
  const elegidos: Ejercicio[] = [];
  for (let vuelta = 0; vuelta < 2; vuelta++)
    for (const c of cola) {
      const e = c.shift();
      if (e && elegidos.length < tope && !elegidos.some((x) => x.id === e.id)) elegidos.push(e);
    }
  if (elegidos.length === 0) return undefined;
  const s = nuevaSesion(equipo, 'Lo que toca trabajar');
  return { ...s, bloques: elegidos.map((e) => bloqueDe(e.id, e.minutos, e.tipo)) };
}
