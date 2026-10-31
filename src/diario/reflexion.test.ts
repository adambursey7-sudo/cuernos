import { describe, expect, it } from 'vitest';
import { juntarReflexiones, limpiarReflexiones, nuevaReflexion, recientes, vacia } from './reflexion';

describe('diario de dos minutos', () => {
  const a = { ...nuevaReflexion('e1', '2026-10-29'), funciono: 'La salida rápida' };
  const b = { ...nuevaReflexion('e1', '2026-10-31'), no: 'Rebote' };

  it('una entrada sin texto está vacía', () => {
    expect(vacia(nuevaReflexion('e1', '2026-10-31'))).toBe(true);
    expect(vacia(a)).toBe(false);
  });

  it('ordena las más recientes primero y por equipo', () => {
    expect(recientes([a, b, { ...b, id: 'otro', equipoId: 'e2' }], 'e1').map((r) => r.fecha)).toEqual(['2026-10-31', '2026-10-29']);
  });

  it('limpia lo roto y junta con una copia (gana la copia)', () => {
    expect(limpiarReflexiones([a, { ...b, animo: 9 }, null, 'x'])).toEqual([a]);
    expect(limpiarReflexiones('nada')).toEqual([]);
    const nueva = { ...a, funciono: 'Cambiado' };
    expect(juntarReflexiones([a, b], [nueva]).find((r) => r.id === a.id)?.funciono).toBe('Cambiado');
    expect(juntarReflexiones([a, b], [nueva])).toHaveLength(2);
  });
});
