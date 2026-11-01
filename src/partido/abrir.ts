// Abrir el partido en directo desde cualquier pantalla (Inicio, la hoja de un día…) sin pasar la función de mano en mano.
const EVENTO = 'horns:partido';

export const pedirPartido = (eventoId: string) => window.dispatchEvent(new CustomEvent(EVENTO, { detail: eventoId }));

/** Avisa cuando alguna pantalla pide abrir un partido; devuelve la función que deja de escuchar. */
export function alPedirPartido(f: (eventoId: string) => void): () => void {
  const oyente = (ev: Event) => { const id = (ev as CustomEvent<unknown>).detail; if (typeof id === 'string') f(id); };
  window.addEventListener(EVENTO, oyente);
  return () => window.removeEventListener(EVENTO, oyente);
}
