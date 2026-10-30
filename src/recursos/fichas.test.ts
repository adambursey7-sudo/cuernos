import { beforeEach, describe, expect, it } from 'vitest';
import { armarCopia, leerCopia } from '../copia';
import { fichaCompleta, fichasDe, guardarFichas, juntarFichas, leerFichas, limpiarFichas, nuevaFicha, pasosDe } from './fichas';
import { nuevoRecurso } from './recursos';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
};

describe('fichas de ejercicio', () => {
  beforeEach(memoria);

  it('nace del recurso con su fuente y su título', () => {
    const r = nuevoRecurso({ titulo: 'Ejemplo Uno', enlace: 'https://ejemplo.com/a' });
    const f = nuevaFicha(r);
    expect(f.nombre).toBe('Ejemplo Uno');
    expect(f.fuente).toBe('https://ejemplo.com/a');
    expect(fichaCompleta(f)).toBe(true);
    expect(fichaCompleta(nuevaFicha())).toBe(false);
  });

  it('un recurso puede dar varios ejercicios', () => {
    const r = nuevoRecurso({ titulo: 'Vídeo', enlace: 'https://ejemplo.com/v' });
    const a = nuevaFicha(r);
    const b = nuevaFicha(r);
    expect(a.id).not.toBe(b.id);
    expect(fichasDe([a, b, nuevaFicha()], r.id)).toHaveLength(2);
  });

  it('descarta fuentes que no son http/https y fichas sin nombre', () => {
    const buena = { ...nuevaFicha(), nombre: 'Bien' };
    const lista = limpiarFichas([buena, { ...buena, id: 'x', fuente: 'javascript:alert(1)' }, { ...buena, id: 'y', nombre: '  ' }, { ...buena, id: 'z', nivel: 'raro', minutos: 9999, pasos: ['a', 3] }]);
    expect(lista.map((f) => f.id)).toEqual([buena.id, 'z']);
    expect(lista[1].nivel).toBe('');
    expect(lista[1].minutos).toBe(120);
    expect(lista[1].pasos).toEqual(['a']);
  });

  it('los pasos vacíos no cuentan', () => {
    expect(pasosDe({ ...nuevaFicha(), pasos: ['  uno ', '', 'dos'] })).toEqual(['uno', 'dos']);
  });

  it('guarda, lee y junta; con datos rotos devuelve vacío', () => {
    const f = { ...nuevaFicha(), nombre: 'Ejemplo Dos' };
    expect(guardarFichas([f])).toBe(true);
    expect(leerFichas()).toEqual([f]);
    expect(juntarFichas([f], [{ ...f, nombre: 'Cambiado' }])[0].nombre).toBe('Cambiado');
    localStorage.setItem('horns.fichas', '{');
    expect(leerFichas()).toEqual([]);
  });

  it('entra en la copia de seguridad', () => {
    const f = { ...nuevaFicha(), nombre: 'Ejemplo Tres' };
    const colores = { principal: '#e8883a', fondo: '#14110e', pista: '#c98f55', jugadores: '#14110e' };
    expect(leerCopia(armarCopia([], colores, undefined, undefined, [], [f])).fichas).toEqual([f]);
    expect(leerCopia(JSON.stringify({ app: 'cuernos-copia', version: 2, mios: [] })).fichas).toBeUndefined();
  });
});
