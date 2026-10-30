import { describe, expect, it } from 'vitest';
import { construirEncargoEjercicio, construirPrompt, CUESTIONARIO_VACIO, PROMPT_BASE } from './ia';
import { CUESTIONARIO_NORMAL, elegir, esOtro, PREGUNTAS } from './opcionesEjercicio';

const pregunta = (k: string) => PREGUNTAS.find((p) => p.k === k)!;

describe('cuestionario con opciones', () => {
  it('lo normal viene marcado y cada marca es una opción de su fila', () => {
    for (const p of PREGUNTAS) {
      expect(p.opciones).toContain(CUESTIONARIO_NORMAL[p.k]);
      expect(esOtro(p, CUESTIONARIO_NORMAL[p.k])).toBe(false);
    }
  });

  it('tocar una opción cambia solo esa pregunta', () => {
    const c = elegir(CUESTIONARIO_NORMAL, pregunta('minutos'), '15');
    expect(c).toEqual({ ...CUESTIONARIO_NORMAL, minutos: '15' });
  });

  it('«Otro»: lo escrito a mano se reconoce y llega tal cual', () => {
    const c = { ...CUESTIONARIO_NORMAL, objetivo: 'Pase tras bote' };
    expect(esOtro(pregunta('objetivo'), c.objetivo)).toBe(true);
    expect(esOtro(pregunta('objetivo'), '')).toBe(false);
    expect(construirPrompt(PROMPT_BASE, c)).toContain('- Goal of the drill: Pase tras bote');
  });

  it('con lo normal el encargo lleva los seis datos y ninguno vacío', () => {
    const t = construirEncargoEjercicio(CUESTIONARIO_NORMAL);
    for (const x of ['Goal of the drill: Pase', 'Number of players: 5', 'Equipment available: 1 balón', 'Time available (minutes): 10', 'Level of the players: Medio', 'Space: Media pista']) {
      expect(t).toContain(x);
    }
    expect(construirPrompt(PROMPT_BASE, CUESTIONARIO_VACIO)).not.toContain('The coach says');
  });

  it('las opciones obligatorias no se pueden quitar tocándolas otra vez', () => {
    expect(elegir(CUESTIONARIO_NORMAL, pregunta('objetivo'), 'Pase').objetivo).toBe('Pase');
  });
});
