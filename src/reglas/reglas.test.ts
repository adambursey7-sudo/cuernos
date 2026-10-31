import { describe, expect, it } from 'vitest';
import { limpiarReglas, reglasDeTexto, reglasDe, REGLAS_FIBA, resumenReglas, sonFiba } from './reglas';

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
  it('encuentra periodos y minutos en el texto de unas normas', () => {
    expect(reglasDeTexto('El partido tendrá 3 periodos de 8 minutos con descanso de 2 min.')).toEqual({ periodos: 3, minutos: 8, faltas: 5 });
    expect(reglasDeTexto('Duración: 4 x 10 min. Un jugador con 5 faltas personales queda excluido.')).toEqual({ periodos: 4, minutos: 10, faltas: 5 });
    expect(reglasDeTexto('Cuatro cuartos')).toBeUndefined();
  });
});
