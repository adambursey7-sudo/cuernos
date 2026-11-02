import { describe, expect, it, vi } from 'vitest';
import { actualizarAhora, avisarVersionNueva, hayVersionNueva, suscribirVersion } from './version';

describe('aviso de versión nueva', () => {
  it('no hay versión nueva hasta que el service worker avisa, y actualizar la aplica', () => {
    expect(hayVersionNueva()).toBe(false);
    const oyente = vi.fn();
    const baja = suscribirVersion(oyente);
    const aplicar = vi.fn();
    avisarVersionNueva(aplicar);
    expect(oyente).toHaveBeenCalledTimes(1);
    expect(hayVersionNueva()).toBe(true);
    actualizarAhora();
    expect(aplicar).toHaveBeenCalledTimes(1);
    baja();
  });
});
