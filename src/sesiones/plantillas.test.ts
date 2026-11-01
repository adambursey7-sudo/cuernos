import { describe, expect, it } from 'vitest';
import { cargaSegunPartido, desdePlantilla, PLANTILLAS } from './plantillas';
import { total } from './sesiones';
import { tituloBloque } from './sesiones';

describe('plantillas de sesión', () => {
  it('la sesión normal dura 90 minutos y todos sus ejercicios existen', () => {
    const s = desdePlantilla(PLANTILLAS[0], 'Senior A');
    expect(s.duracion).toBe(90);
    expect(total(s)).toBe(90);
    expect(s.bloques.every((b) => tituloBloque(b.ejercicio))).toBe(true);
    expect(new Set(s.bloques.map((b) => b.ejercicio)).size).toBe(s.bloques.length);
  });
  it('si falta un ejercicio, no pone hueco vacío', () => {
    const s = desdePlantilla(PLANTILLAS[1], 'Senior A', []);
    expect(s.bloques).toEqual([]);
  });
  it('la carga baja según se acerca el partido', () => {
    expect(cargaSegunPartido(5).nivel).toBe('alta');
    expect(cargaSegunPartido(2).nivel).toBe('media');
    expect(cargaSegunPartido(1).nivel).toBe('baja');
    expect(cargaSegunPartido(0).nivel).toBe('baja');
  });
});
