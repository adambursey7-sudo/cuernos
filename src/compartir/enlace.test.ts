import { describe, expect, it } from 'vitest';
import { SISTEMAS } from '../sistemas/datos';
import { PALETAS } from '../temas';
import { crearEnlace, desempaquetar, leerEnlace } from './enlace';

const BASE = 'https://adambursey7-sudo.github.io/cuernos/';
const colores = PALETAS[2];
const propia = { ...SISTEMAS[1], id: 'mio-prueba', nombre: 'Mi variante', propio: true };

describe('jugada en el enlace', () => {
  it('una jugada del libro lleva solo su id y se abre igual', async () => {
    const url = await crearEnlace(SISTEMAS[0], true, colores, BASE);
    expect(url).toBe(`${BASE}#j=cuernos&d=1&c=f2d35b.1d2b25.24463a.f2f1e8`);
    const leida = await leerEnlace(new URL(url).hash);
    expect(leida?.sistema).toBe(SISTEMAS[0]);
    expect(leida?.delLibro).toBe(true);
    expect(leida?.colores).toEqual({ principal: '#f2d35b', fondo: '#1d2b25', pista: '#24463a', jugadores: '#f2f1e8' });
  });

  it('una jugada propia viaja entera y vuelve igual', async () => {
    const url = await crearEnlace(propia, false, colores, BASE);
    expect(url.length).toBeLessThan(900);
    const leida = await leerEnlace(new URL(url).hash);
    expect(leida?.delLibro).toBe(false);
    expect(leida?.conDefensa).toBe(false);
    expect(leida?.sistema.nombre).toBe('Mi variante');
    expect(leida?.sistema.inicio).toEqual(propia.inicio);
    expect(leida?.sistema.pasos).toEqual(propia.pasos.map((p) => ({ texto: p.texto, movimientos: p.movimientos })));
  });

  it('sin «#» de jugada no es un enlace de jugada', async () => {
    expect(await leerEnlace('')).toBeNull();
    expect(await leerEnlace('#algo=1')).toBeNull();
  });

  it('un enlace roto o de una jugada que no existe no se abre', async () => {
    await expect(leerEnlace('#j=no-existe')).rejects.toThrow();
    await expect(leerEnlace('#p=esto-no-es-nada')).rejects.toThrow();
  });

  it('colores raros se ignoran y la jugada se abre igual', async () => {
    const leida = await leerEnlace('#j=cuernos&c=red.blue');
    expect(leida?.colores).toBeNull();
    expect(leida?.conDefensa).toBe(true);
  });

  it('rechaza jugadas con movimientos que romperían la pizarra', () => {
    const bien = { n: 'X', t: 'ataque', nv: 'cadete', i: SISTEMAS[0].inicio, b: '1', p: [['Paso', [{ tipo: 'corte', jugador: '2', a: [10, 10] }]]] };
    expect(desempaquetar(bien)?.pasos).toHaveLength(1);
    expect(desempaquetar({ ...bien, p: [['Paso', [{ tipo: 'corte', jugador: '7', a: [10, 10] }]]] })).toBeNull();
    expect(desempaquetar({ ...bien, p: [['Paso', [{ tipo: 'vuelo', jugador: '2', a: [10, 10] }]]] })).toBeNull();
    expect(desempaquetar({ ...bien, p: [['Paso', [{ tipo: 'bote', jugador: '2', a: ['x', 10] }]]] })).toBeNull();
    expect(desempaquetar({ ...bien, b: '9' })).toBeNull();
    expect(desempaquetar({ ...bien, p: [] })).toBeNull();
  });
});
