import { describe, expect, it } from 'vitest';
import { momentoDelBucle, PAUSA_FINAL } from './bucle';

describe('bucle de las miniaturas', () => {
  it('empieza en 0 y avanza despacio (un paso tarda 3,2 s)', () => {
    expect(momentoDelBucle(0, 4)).toBe(0);
    expect(momentoDelBucle(1600, 4)).toBeCloseTo(0.5);
    expect(momentoDelBucle(3200, 4)).toBeCloseTo(1);
  });

  it('se queda quieta al final y vuelve a empezar', () => {
    const fin = 4 * 3200;
    expect(momentoDelBucle(fin, 4)).toBe(4);
    expect(momentoDelBucle(fin + PAUSA_FINAL - 1, 4)).toBe(4);
    expect(momentoDelBucle(fin + PAUSA_FINAL, 4)).toBe(0);
  });

  it('sin pasos o con tiempos raros no se rompe', () => {
    expect(momentoDelBucle(5000, 0)).toBe(0);
    expect(momentoDelBucle(-100, 3)).toBeGreaterThanOrEqual(0);
  });
});
