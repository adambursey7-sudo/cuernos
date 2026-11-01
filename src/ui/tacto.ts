// Respuesta táctil: una vibración muy corta al apuntar algo. En los móviles que no la tienen (el iPhone, por ahora) no pasa nada.
export function tocar(ms = 8): void {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch {
    /* sin vibración */
  }
}
