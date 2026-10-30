// Guardar el ejercicio que ha dibujado Claude: el Sistema propio (la pizarra) y su ficha enlazada (sistemaId), con texto corto.
// Solo se llama al pulsar «Guardar»; mientras tanto el borrador vive en la pantalla y no toca el almacenamiento.
import { borrarMio, guardarMio } from '../sistemas/almacen';
import type { Sistema } from '../sistemas/tipos';
import { guardarFichas, leerFichas, nuevaFicha, type Ficha } from './fichas';
import type { Cuestionario } from './ia';
import type { Recurso } from './recursos';

export interface Ejercicio {
  sistema: Sistema;
  minutos?: number;
  material: string;
}

const corto = (t: string, max: number) => t.replace(/\s+/g, ' ').trim().slice(0, max);

/** La ficha de texto corto que acompaña a la pizarra. Con ella en la mano no se guarda nada. */
export function fichaDeEjercicio(e: Ejercicio, c: Cuestionario, recurso?: Recurso): Ficha {
  const base = nuevaFicha(recurso);
  const salen = e.sistema.visibles?.length ?? 5;
  return {
    ...base,
    nombre: e.sistema.nombre,
    objetivo: e.sistema.idea || corto(c.objetivo, 160),
    minutos: e.minutos ?? (Number(c.minutos) > 0 ? Math.min(120, Math.round(Number(c.minutos))) : 10),
    material: e.material || corto(c.material, 100),
    edad: corto(c.edad, 80),
    jugadoras: corto(c.jugadoras, 80) || `${salen}`,
    espacio: corto(c.espacio, 120),
    pasos: e.sistema.pasos.map((p) => p.texto),
    etiquetas: ['ejercicio-claude'],
    sistemaId: e.sistema.id,
  };
}

/** Añade la ficha al principio de la lista. Falso si el móvil no deja guardar. */
export function anadirFicha(f: Ficha): boolean {
  return guardarFichas([f, ...leerFichas().filter((x) => x.id !== f.id)]);
}

/** Guarda pizarra y ficha. Si una de las dos falla no queda la otra a medias. */
export function guardarEjercicio(e: Ejercicio, c: Cuestionario, recurso?: Recurso): { ok: true; ficha: Ficha } | { ok: false; motivo: string } {
  const ficha = fichaDeEjercicio(e, c, recurso);
  try {
    guardarMio(e.sistema);
  } catch {
    return { ok: false, motivo: 'El móvil no deja guardar: libera espacio e inténtalo otra vez.' };
  }
  if (!anadirFicha(ficha)) {
    try { borrarMio(e.sistema.id); } catch { /* ya no se puede hacer más */ }
    return { ok: false, motivo: 'El móvil no deja guardar: libera espacio e inténtalo otra vez.' };
  }
  return { ok: true, ficha };
}
