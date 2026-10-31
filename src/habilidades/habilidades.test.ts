import { beforeEach, describe, expect, it } from 'vitest';
import { limpiar, nuevoEquipo } from '../diario/diario';
import { ejerciciosDeHabilidad, loMasFlojo, sesionDeLoFlojo, sistemasDeHabilidad } from './biblioteca';
import { alternarEtiqueta, etiquetasDe, guardarEtiquetas, leerEtiquetas, limpiarEtiquetas, limpiarHabilidades, nuevaHabilidad, sugerir } from './habilidades';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
};

beforeEach(memoria);

describe('habilidades del equipo', () => {
  it('sugiere etiquetas por las palabras del ejercicio', () => {
    expect(sugerir('2x0 Bloqueo directo y continuación')).toEqual(expect.arrayContaining(['bloqueos', 'finalizacion']));
    expect(sugerir('Defensa de zona 2-3')).toContain('zona');
    expect(sugerir('Algo sin relación')).toEqual([]);
  });

  it('limpia habilidades: sin ids repetidos, estados raros ni niveles fuera de 1 a 5', () => {
    const buenas = limpiarHabilidades([
      { id: 'tiro', nombre: 'Tiro exterior', estado: 'trabajar', como: '', nivel: 2 },
      { id: 'tiro', nombre: 'Repetida', estado: 'fuerte', como: '' },
      { id: 'x', nombre: 'Mala', estado: 'rojo', como: '' },
      { id: 'y', nombre: 'Nivel malo', estado: 'normal', como: '', nivel: 9 },
      { id: 'z', nombre: '  ', estado: 'normal', como: '' },
      null,
    ]);
    expect(buenas.map((h) => h.id)).toEqual(['tiro']);
    expect(limpiarHabilidades('nada')).toEqual([]);
  });

  it('el diario conserva las habilidades válidas del equipo y descarta las malas', () => {
    const e = { ...nuevoEquipo('Ejemplo'), habilidades: [nuevaHabilidad('Presión', 'presion'), { id: 'q', nombre: '', estado: 'normal', como: '' }] };
    const d = limpiar({ equipos: [e], jugadoras: [] });
    expect(d.equipos[0].habilidades?.map((h) => h.id)).toEqual(['presion']);
    expect(limpiar({ equipos: [nuevoEquipo('Sin')], jugadoras: [] }).equipos[0].habilidades).toBeUndefined();
  });

  it('las etiquetas puestas a mano mandan sobre las sugeridas, y «ninguna» también vale', () => {
    const texto = 'Bloqueo directo';
    expect(etiquetasDe('a~0', texto)).toContain('bloqueos');
    let m = alternarEtiqueta('a~0', texto, 'bloqueos');
    expect(m['a~0']).not.toContain('bloqueos');
    expect(guardarEtiquetas(m)).toBe(true);
    expect(etiquetasDe('a~0', texto, leerEtiquetas())).not.toContain('bloqueos');
    m = alternarEtiqueta('a~0', texto, 'tiro', leerEtiquetas());
    expect(m['a~0']).toContain('tiro');
  });

  it('limpia etiquetas guardadas rotas', () => {
    expect(limpiarEtiquetas({ a: ['x', 'x'], b: 3, c: [1] })).toEqual({ a: ['x'] });
    expect(limpiarEtiquetas([1])).toEqual({});
  });

  it('busca en la biblioteca por etiqueta y señala lo más flojo', () => {
    const conBloqueo = ejerciciosDeHabilidad('bloqueos');
    expect(conBloqueo.length).toBeGreaterThan(0);
    expect(sistemasDeHabilidad('bloqueos').length).toBeGreaterThan(0);
    const flojo = loMasFlojo([{ ...nuevaHabilidad('Bloqueos', 'bloqueos'), estado: 'trabajar' }, nuevaHabilidad('Pase', 'pase')]);
    expect(flojo).toHaveLength(1);
    expect(flojo[0].ejercicios.length).toBe(conBloqueo.length);
  });

  it('monta una sesión con lo más flojo, sin repetir ejercicios y respetando el tope', () => {
    const flojos = loMasFlojo([{ ...nuevaHabilidad('Bloqueos', 'bloqueos'), estado: 'trabajar' }, { ...nuevaHabilidad('Zona', 'zona'), estado: 'trabajar' }]);
    const s = sesionDeLoFlojo('Ejemplo', flojos, 3)!;
    expect(s.bloques.length).toBeLessThanOrEqual(3);
    expect(new Set(s.bloques.map((b) => b.ejercicio)).size).toBe(s.bloques.length);
    expect(sesionDeLoFlojo('Ejemplo', [])).toBeUndefined();
  });
});
