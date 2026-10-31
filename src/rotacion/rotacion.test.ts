import { describe, expect, it } from 'vitest';
import { alternar, cuartosIncompletos, limpiarRotacion, minutos, repartir, vacia } from './rotacion';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);

describe('rotación del partido', () => {
  it('reparte 5 por cuarto y minutos parejos (máximo 10 de diferencia)', () => {
    for (const n of [5, 7, 8, 10, 13]) {
      const r = repartir(ids(n));
      expect(r.every((q) => q.length === 5)).toBe(true);
      const m = ids(n).map((id) => minutos(r, id));
      expect(Math.max(...m) - Math.min(...m)).toBeLessThanOrEqual(10);
      expect(m.reduce((a, b) => a + b, 0)).toBe(200);
    }
  });

  it('con menos de 5 jugadoras avisa de los cuartos incompletos, y sin nadie no rompe', () => {
    expect(cuartosIncompletos(repartir(ids(3)))).toEqual([0, 1, 2, 3]);
    expect(repartir([])).toEqual(vacia());
    expect(cuartosIncompletos(repartir(ids(5)))).toEqual([]);
  });

  it('alternar pone y quita, y no deja más de 5 en pista', () => {
    let r = vacia();
    for (const id of ids(6)) r = alternar(r, 0, id);
    expect(r[0]).toHaveLength(5);
    expect(alternar(r, 0, 'j1')[0]).not.toContain('j1');
    expect(r[1]).toEqual([]);
  });

  it('limpia lo roto: cuartos que faltan, ids desconocidos, repetidos y de más', () => {
    const validos = new Set(ids(8));
    expect(limpiarRotacion('x', validos)).toBeUndefined();
    expect(limpiarRotacion([[], []], validos)).toBeUndefined();
    const r = limpiarRotacion([['j1', 'j1', 'zz', 3, 'j2', 'j3', 'j4', 'j5', 'j6'], null, [], ['j8']], validos)!;
    expect(r[0]).toEqual(['j1', 'j2', 'j3', 'j4', 'j5']);
    expect(r[1]).toEqual([]);
    expect(r[3]).toEqual(['j8']);
  });
});
