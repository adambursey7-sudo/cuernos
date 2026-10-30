import { describe, expect, it } from 'vitest';
import { nuevaFicha } from './fichas';
import { textoColeccion, textoFicha } from './compartirTexto';

const ficha = () => ({ ...nuevaFicha(), nombre: 'Rueda de pases', categoria: 'Pase', minutos: 8, objetivo: 'Pasar y cortar', pasos: ['Pase', ' ', 'Corte'], fuente: 'https://ejemplo.com/v' });

describe('compartir como texto', () => {
  it('un ejercicio lleva sus datos, pasos numerados y la fuente', () => {
    const t = textoFicha(ficha());
    expect(t).toContain('*Rueda de pases*');
    expect(t).toContain('Pase · 8 min');
    expect(t).toContain('1. Pase\n2. Corte');
    expect(t.endsWith('Fuente: https://ejemplo.com/v')).toBe(true);
  });

  it('salta lo vacío y no enseña etiquetas ni identificadores', () => {
    const t = textoFicha({ ...nuevaFicha(), nombre: 'Solo nombre', etiquetas: ['secreto'], recursoId: 'r1' });
    expect(t).toBe('*Solo nombre*\n\n10 min');
    expect(t).not.toContain('secreto');
  });

  it('una colección junta los ejercicios con su nombre y el pie', () => {
    const t = textoColeccion('Calentamientos', [ficha(), { ...ficha(), nombre: 'Otro' }]);
    expect(t.startsWith('*Calentamientos* (2 ejercicios)')).toBe(true);
    expect(t).toContain('———');
    expect(t.endsWith('Hecho con Horns')).toBe(true);
  });
});
