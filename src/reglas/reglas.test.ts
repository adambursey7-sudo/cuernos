import { describe, expect, it } from 'vitest';
import { limpiarReglas, reglasDe, REGLAS_FIBA, resumenReglas, sonFiba } from './reglas';

describe('reglas de la competición', () => {
  it('sin reglas, las de FIBA', () => {
    expect(reglasDe(undefined)).toEqual(REGLAS_FIBA);
    expect(reglasDe({ reglas: { periodos: 0, minutos: 8, faltas: 5 } })).toEqual(REGLAS_FIBA);
  });
  it('acepta 3 x 8 y rechaza lo fuera de rango o roto', () => {
    expect(limpiarReglas({ periodos: 3, minutos: 8, faltas: 5, notas: '  Descanso 2 min ' })).toEqual({ periodos: 3, minutos: 8, faltas: 5, notas: 'Descanso 2 min' });
    expect(limpiarReglas({ periodos: 9, minutos: 8, faltas: 5 })).toBeUndefined();
    expect(limpiarReglas({ periodos: 3.5, minutos: 8, faltas: 5 })).toBeUndefined();
    expect(limpiarReglas('x')).toBeUndefined();
  });
  it('resume y reconoce las de FIBA', () => {
    expect(resumenReglas({ periodos: 3, minutos: 8, faltas: 5 })).toBe('3 × 8 min · 5 faltas');
    expect(sonFiba(REGLAS_FIBA)).toBe(true);
    expect(sonFiba({ ...REGLAS_FIBA, notas: 'x' })).toBe(false);
  });
});
