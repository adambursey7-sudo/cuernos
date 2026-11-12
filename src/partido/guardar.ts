// Guardado del partido en directo dentro de la temporada, y aviso a las pantallas que la tienen abierta.
import { totalPuntos } from '../temporada/directo';
import { guardarEvento, guardarTemporada, guardarTemporadas, leerTemporadas, temporadaDe, type Evento } from '../temporada/temporada';
import type { Partido } from './vivo';

const EVENTO = 'horns:temporada-guardada';

/** ¿Hay algo que merezca guardarse? (un partido abierto y sin tocar no escribe nada). */
export const hayAlgo = (p: Partido) => p.vivo.cronologia.length > 0 || p.vivo.segundos > 0 || !!p.vivo.corre;

/**
 * Escribe el partido en su evento, sobre la temporada recién leída (así no pisa lo que otra pantalla haya cambiado).
 * Devuelve false SOLO si el móvil no ha dejado guardar; si no hay nada que guardar o el partido ya no existe, true.
 */
export function guardarPartido(equipoId: string, eventoId: string, base: Evento, p: Partido): boolean {
  if (!hayAlgo(p)) return true;
  const lista = leerTemporadas();
  const t = temporadaDe(lista, equipoId);
  if (!t) return true;
  const actual = t.eventos.find((x) => x.id === eventoId);
  const e: Evento = { ...base, ...(actual ?? {}), directo: p.directo, resultado: { a: totalPuntos(p.directo), c: p.rival }, vivo: p.vivo };
  const bien = guardarTemporadas(guardarTemporada(lista, guardarEvento(t, e)));
  if (bien) avisarTemporadaGuardada();
  return bien;
}

/** Avisa a las pantallas que tienen la temporada en memoria de que otra pantalla la ha guardado: deben volver a leerla. */
export function avisarTemporadaGuardada(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO));
}

/** Escucha ese aviso; devuelve la función que deja de escuchar. */
export function alGuardarTemporada(f: () => void): () => void {
  window.addEventListener(EVENTO, f);
  return () => window.removeEventListener(EVENTO, f);
}
