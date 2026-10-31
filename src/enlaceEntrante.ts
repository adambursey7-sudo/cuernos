// Enlace que llega a la app desde fuera (el atajo del iPhone abre …/?enlace=<enlace>). Se guarda en el móvil nada más
// abrir, antes del acceso, el vídeo de entrada o una recarga por versión nueva, y no se borra hasta guardarlo o cancelarlo.
import { primerEnlace } from './recursos/recursos';

const CLAVE = 'horns.enlace-pendiente';
/** Se lanza cuando el enlace pendiente se guarda o se descarta. */
export const EVENTO_OLVIDADO = 'horns-enlace-olvidado';
const CADUCA_MS = 10 * 60 * 1000;

/** El enlace de una dirección tipo «?enlace=…» (también vale «url» o «text», como comparte el móvil). */
export function enlaceDeBusqueda(busqueda: string): string | undefined {
  try {
    const q = new URLSearchParams(busqueda);
    return primerEnlace(q.get('enlace') ?? q.get('url') ?? q.get('text') ?? '');
  } catch {
    return undefined;
  }
}

/** Lee la dirección actual: si trae un enlace lo deja pendiente y limpia la dirección. Devuelve si había uno. */
export function recogerEnlaceDeLaDireccion(ahora = Date.now()): boolean {
  const e = enlaceDeBusqueda(location.search);
  if (!e) return false;
  try { localStorage.setItem(CLAVE, JSON.stringify({ e, t: ahora })); } catch { /* sin almacenamiento: queda en memoria */ memoria = { e, t: ahora }; }
  try { history.replaceState(null, '', location.pathname + location.hash); } catch { /* nada */ }
  return true;
}

let memoria: { e: string; t: number } | null = null;

export function enlacePendiente(ahora = Date.now()): string | undefined {
  let p: { e?: unknown; t?: unknown } | null = memoria;
  try { p = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') ?? p; } catch { /* nada */ }
  if (!p || typeof p.e !== 'string' || typeof p.t !== 'number' || ahora - p.t > CADUCA_MS) return undefined;
  return p.e;
}

export function olvidarEnlacePendiente(): void {
  memoria = null;
  try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
  // La app avisa a quien tenga el enlace en pantalla de que ya no hace falta.
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO_OLVIDADO));
}
