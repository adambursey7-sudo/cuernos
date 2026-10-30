// Preferencias de lectura: tamaño de letra y reducir movimiento. Se guardan en este móvil y se aplican al abrir.
const CLAVE = 'horns-lectura';

export type Letra = 'normal' | 'grande' | 'enorme';
export interface Lectura {
  letra: Letra;
  quieto: boolean;
}

export const ESCALAS: Record<Letra, number> = { normal: 1, grande: 1.15, enorme: 1.3 };
export const NOMBRES_LETRA: Record<Letra, string> = { normal: 'Normal', grande: 'Grande', enorme: 'Enorme' };

/** Lee lo guardado; cualquier cosa rara vuelve a lo normal. */
export function leerLectura(): Lectura {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    return { letra: typeof x?.letra === 'string' && x.letra in ESCALAS ? x.letra : 'normal', quieto: x?.quieto === true };
  } catch {
    return { letra: 'normal', quieto: false };
  }
}

export function aplicarLectura(l: Lectura, guardar = true) {
  const raiz = document.documentElement;
  raiz.style.setProperty('--escala', String(ESCALAS[l.letra]));
  if (l.quieto) raiz.dataset.quieto = 'si';
  else delete raiz.dataset.quieto;
  if (!guardar) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(l));
  } catch {
    /* sin espacio: se aplica en esta sesión y ya */
  }
}

/** Movimiento reducido: lo pide el sistema o lo ha elegido el entrenador. */
export const sinMovimiento = () =>
  document.documentElement.dataset.quieto === 'si' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
