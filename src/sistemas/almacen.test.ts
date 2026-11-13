import { beforeEach, describe, expect, it } from 'vitest';
import { buscarEjercicio, todosLosEjercicios } from '../ejercicios/ejercicios';
import { borrarMio, buscarSistema, guardarMio, leerMios, todosLosSistemas } from './almacen';
import { SISTEMAS } from './datos';

let datos: Map<string, string>;
let lecturas = 0;
beforeEach(() => {
  datos = new Map();
  lecturas = 0;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => { lecturas++; return datos.get(k) ?? null; },
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  };
});

const propia = (id: string, nombre: string) => ({ ...SISTEMAS[0], id, nombre });

describe('jugadas propias recordadas en memoria', () => {
  it('lo guardado se ve enseguida: guardar, cambiar y borrar', () => {
    expect(leerMios()).toEqual([]);
    guardarMio(propia('mio-1', 'Primera'));
    expect(leerMios().map((s) => s.nombre)).toEqual(['Primera']);
    expect(buscarSistema('mio-1')?.propio).toBe(true);
    guardarMio(propia('mio-1', 'Primera cambiada'));
    expect(buscarSistema('mio-1')?.nombre).toBe('Primera cambiada');
    expect(todosLosSistemas().filter((s) => s.id === 'mio-1')).toHaveLength(1);
    borrarMio('mio-1');
    expect(buscarSistema('mio-1')).toBeUndefined();
  });

  it('los ejercicios de una jugada propia aparecen y desaparecen con ella', () => {
    const antes = todosLosEjercicios().length;
    guardarMio(propia('mio-2', 'Con ejercicios'));
    const suyos = todosLosEjercicios().filter((e) => e.sistema.id === 'mio-2');
    expect(suyos.length).toBeGreaterThan(0);
    expect(buscarEjercicio(suyos[0].id)?.sistema.nombre).toBe('Con ejercicios');
    borrarMio('mio-2');
    expect(todosLosEjercicios()).toHaveLength(antes);
    expect(buscarEjercicio(suyos[0].id)).toBeUndefined();
  });

  it('si otra pestaña cambia lo guardado, también se nota', () => {
    guardarMio(propia('mio-3', 'Una'));
    expect(leerMios()).toHaveLength(1);
    datos.set('cuernos.mios', '[]');
    expect(leerMios()).toHaveLength(0);
    datos.set('cuernos.mios', 'esto no es una lista');
    expect(leerMios()).toEqual([]);
  });

  it('quien recibe la lista puede ordenarla o recortarla sin estropear la recordada', () => {
    guardarMio(propia('mio-4', 'Una'));
    const lista = todosLosSistemas();
    lista.length = 0;
    const primero = todosLosEjercicios()[0].id;
    todosLosEjercicios().reverse();
    expect(todosLosSistemas().length).toBeGreaterThan(SISTEMAS.length);
    expect(todosLosEjercicios()[0].id).toBe(primero);
    expect(buscarSistema('mio-4')).toBeDefined();
  });

  it('buscar mil veces no vuelve a interpretar lo guardado', () => {
    guardarMio(propia('mio-5', 'Una'));
    const primero = buscarSistema('mio-5');
    for (let i = 0; i < 1000; i++) buscarEjercicio('no-existe');
    // Mismo objeto: no se ha vuelto a leer ni a validar (solo se compara el texto guardado).
    expect(buscarSistema('mio-5')).toBe(primero);
    expect(lecturas).toBeGreaterThan(0);
  });
});
