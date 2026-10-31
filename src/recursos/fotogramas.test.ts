import { describe, expect, it } from 'vitest';
import { cuantas, instantes, MAX_IMAGENES, MIN_IMAGENES } from './fotogramas';

describe('imágenes de un vídeo', () => {
  it('reparte los instantes entre el 5 % y el 95 % y en orden', () => {
    const t = instantes(20, 5);
    expect(t).toHaveLength(5);
    expect(t[0]).toBeCloseTo(1, 1);
    expect(t[4]).toBeCloseTo(19, 1);
    expect([...t].sort((a, b) => a - b)).toEqual(t);
  });
  it('nunca menos de 3 ni más de 10 imágenes', () => {
    expect(cuantas(2)).toBe(MIN_IMAGENES);
    expect(cuantas(600)).toBe(MAX_IMAGENES);
    expect(instantes(10, 99)).toHaveLength(MAX_IMAGENES);
    expect(instantes(10, 1)).toHaveLength(MIN_IMAGENES);
  });
  it('un vídeo sin duración no da instantes', () => {
    expect(instantes(0, 5)).toEqual([]);
    expect(instantes(NaN, 5)).toEqual([]);
  });
});
