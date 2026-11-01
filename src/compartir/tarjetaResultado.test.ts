import { describe, expect, it } from 'vitest';
import { conAlfa, datosTarjeta } from './tarjetaResultado';
import { hojaPartido } from '../temporada/hojaPartido';
import type { Equipo } from '../diario/diario';
import type { Evento } from '../temporada/temporada';

const equipo: Equipo = { id: 'e', nombre: 'Equipo de ejemplo', forma: '', virtudes: '', trabajar: '', como: '', color: '#f2b134' };
const roster = [{ id: 'a', numero: '4', nombre: 'Ejemplo Uno' }, { id: 'b', numero: '7', nombre: 'Ejemplo Dos' }, { id: 'c', numero: '9', nombre: 'Ejemplo Tres' }];
const partido: Evento = {
  id: 'p', fecha: '2026-11-07', hora: '11:00', tipo: 'partido', titulo: 'Ejemplo Rival A', lugar: 'Pabellón', balance: '', jornada: 3, casa: false, resultado: { a: 58, c: 51 },
  directo: { a: { p: 12, f: 1, reb: 3 }, b: { p: 20, f: 2, ast: 5, reb: 8 } },
};

describe('tarjeta del resultado', () => {
  it('lleva el marcador, el rival y lo mejor con DORSAL, sin ningún nombre', () => {
    const d = datosTarjeta(equipo, partido, roster)!;
    expect(d).toMatchObject({ a: 58, c: 51, marca: 'G', rival: 'Ejemplo Rival A', detalle: 'Liga · Jornada 3 · Fuera' });
    expect(d.destacadas).toEqual([{ etiqueta: 'Puntos', dorsal: '7', valor: 20 }, { etiqueta: 'Rebotes', dorsal: '7', valor: 8 }, { etiqueta: 'Asistencias', dorsal: '7', valor: 5 }]);
    const todo = JSON.stringify(d);
    for (const j of roster) expect(todo).not.toContain(j.nombre);
  });
  it('sin resultado no hay tarjeta; un partido sin estadística solo lleva el marcador', () => {
    expect(datosTarjeta(equipo, { ...partido, resultado: undefined }, roster)).toBeUndefined();
    expect(datosTarjeta(equipo, { ...partido, directo: undefined }, roster)!.destacadas).toEqual([]);
    expect(datosTarjeta(equipo, { ...partido, tipo: 'entreno' }, roster)).toBeUndefined();
  });
  it('una derrota y un empate se marcan como tales', () => {
    expect(datosTarjeta(equipo, { ...partido, resultado: { a: 40, c: 50 } }, roster)!.marca).toBe('P');
    expect(datosTarjeta(equipo, { ...partido, resultado: { a: 50, c: 50 } }, roster)!.marca).toBe('E');
  });
});

describe('hoja del partido', () => {
  it('por defecto solo lleva dorsales; con «nombres» salen los nombres y se escapan', () => {
    const sin = hojaPartido(partido, equipo.nombre, roster, { nombres: false });
    expect(sin).not.toContain('Ejemplo Uno');
    expect(sin).toContain('<td class="num">7</td>');
    const con = hojaPartido(partido, equipo.nombre, [{ id: 'a', numero: '4', nombre: '<b>Ejemplo</b>' }], { nombres: true });
    expect(con).toContain('&lt;b&gt;Ejemplo&lt;/b&gt;');
    expect(con).not.toContain('<b>Ejemplo');
  });
  it('si hay convocatoria solo salen las convocadas y el quinteto va marcado', () => {
    const h = hojaPartido({ ...partido, convocados: ['b'], quinteto: ['b'] }, equipo.nombre, roster, { nombres: false });
    expect(h).toContain('<td class="num">7</td><td class="c">●</td>');
    expect(h).not.toContain('<td class="num">4</td>');
  });
  it('siempre sale con 12 filas para apuntar a mano', () => {
    expect((hojaPartido(partido, equipo.nombre, roster, { nombres: false }).match(/<td class="pts">/g) ?? []).length).toBe(12);
  });
});

describe('color con transparencia', () => {
  it('acepta #rrggbb y #rgb', () => {
    expect(conAlfa('#fff8ee', 0.5)).toBe('rgba(255, 248, 238, 0.5)');
    expect(conAlfa('#fff', 0.13)).toBe('rgba(255, 255, 255, 0.13)');
  });
});
