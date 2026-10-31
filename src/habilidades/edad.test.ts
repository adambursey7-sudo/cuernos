import { describe, expect, it } from 'vitest';
import { categoriaDeEquipo, porEdad, tocaPriorizar } from './edad';

describe('habilidades por edad', () => {
  it('reconoce la categoría por el nombre del equipo, sin tildes ni mayúsculas', () => {
    expect(categoriaDeEquipo('Cadete femenino')?.id).toBe('cadete');
    expect(categoriaDeEquipo('JÚNIOR masculino')?.id).toBe('junior');
    expect(categoriaDeEquipo('Premini A')?.id).toBe('premini');
    expect(categoriaDeEquipo('Minibasket')?.id).toBe('mini');
    expect(categoriaDeEquipo('Infantil B')?.id).toBe('infantil');
    expect(categoriaDeEquipo('Equipo de los martes')).toBeUndefined();
  });

  it('marca lo que toca priorizar solo si hay categoría', () => {
    const cadete = categoriaDeEquipo('Cadete femenino');
    expect(tocaPriorizar(cadete, 'tiro')).toBe(true);
    expect(tocaPriorizar(cadete, 'zona')).toBe(false);
    expect(tocaPriorizar(undefined, 'tiro')).toBe(false);
  });

  it('deja fuera lo que viene más adelante y dice qué ha quitado', () => {
    const lista = [{ h: { id: 'tiro', nombre: 'Tiro exterior' } }, { h: { id: 'bloqueos', nombre: 'Bloqueos' } }];
    const mini = categoriaDeEquipo('Mini');
    expect(porEdad(lista, mini, true)).toEqual({ flojos: [lista[0]], quitadas: ['Bloqueos'] });
    expect(porEdad(lista, mini, false)).toEqual({ flojos: lista, quitadas: [] });
    expect(porEdad(lista, undefined, true)).toEqual({ flojos: lista, quitadas: [] });
    expect(porEdad(lista, categoriaDeEquipo('Cadete'), true).quitadas).toEqual([]);
  });
});
