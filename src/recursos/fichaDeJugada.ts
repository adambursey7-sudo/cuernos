// Mandar una jugada a una sesión (loop Pro, tramo 7): las sesiones se arman con fichas de ejercicio,
// así que la jugada se convierte en una ficha con su pizarra (una sola vez: si ya la hay, se usa esa).
import { FAMILIAS, type Sistema } from '../sistemas/tipos';
import { anadirFicha } from './guardarEjercicioIA';
import { leerFichas, nuevaFicha, type Ficha } from './fichas';

/** La ficha que representa a una jugada, sin guardarla. */
export function fichaDeJugada(s: Sistema): Ficha {
  const familia = FAMILIAS.find((f) => f.id === s.familia)?.nombre;
  return {
    ...nuevaFicha(),
    nombre: s.nombre,
    objetivo: s.idea.slice(0, 160),
    categoria: familia ?? (s.tipo === 'defensa' ? 'Defensa' : 'Ataque'),
    nivel: s.nivelMinimo,
    minutos: 10,
    pasos: s.pasos.map((p) => p.texto).filter(Boolean),
    sistemaId: s.id,
    etiquetas: ['jugada'],
  };
}

/** La ficha de esa jugada: la que ya existía o una nueva, ya guardada. `undefined` si el móvil no deja guardar. */
export function fichaParaSesion(s: Sistema): Ficha | undefined {
  const existente = leerFichas().find((f) => f.sistemaId === s.id && !f.recursoId && f.etiquetas.includes('jugada'));
  if (existente) return existente;
  const nueva = fichaDeJugada(s);
  return anadirFicha(nueva) ? nueva : undefined;
}
