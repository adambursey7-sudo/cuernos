import { describe, expect, it } from 'vitest';
import {
  balanceLiga, guardarEvento, guardarFijo, guardarFila, itemsParaIcs, limpiarTemporada, nuevaFila, nuevaTemporada, nuevoEvento, nuevoFijo, ordenarClasificacion, puntosClasificacion, quitarFila,
} from './temporada';

const base = () => ({ ...nuevaTemporada('e1', '2026-09-01', '2027-06-30') });

describe('senior: entrenos con pista, jornadas, viaje y clasificación', () => {
  it('el entreno fijo guarda pista, vestuario y objetivo, y sin ellos queda como antes', () => {
    const f = { ...nuevoFijo(1), pista: ' Pista B ', vestuario: 'Vestuario 2', objetivo: 'Bloqueo directo' };
    const t = limpiarTemporada(guardarFijo(base(), f))!;
    expect(t.fijos[0]).toMatchObject({ pista: 'Pista B', vestuario: 'Vestuario 2', objetivo: 'Bloqueo directo' });
    const viejo = limpiarTemporada(guardarFijo(base(), nuevoFijo(2)))!;
    expect('pista' in viejo.fijos[0]).toBe(false);
    expect(limpiarTemporada(guardarFijo(base(), { ...nuevoFijo(2), pista: '   ', objetivo: 5 as never }))!.fijos[0].pista).toBeUndefined();
  });

  it('la pista del entreno sale como lugar en el .ics', () => {
    const t = guardarFijo(base(), { ...nuevoFijo(0), pista: 'Pista B' });
    expect(itemsParaIcs(t).find((i) => i.tipo === 'entreno')?.lugar).toBe('Pista B');
  });

  it('un partido guarda jornada y salida; fuera de un partido se descartan y lo raro también', () => {
    const p = { ...nuevoEvento('2026-10-17', 'partido'), titulo: 'Ejemplo CB', casa: false, jornada: 5, salida: '17:30' };
    const e = limpiarTemporada(guardarEvento(base(), p))!.eventos[0];
    expect(e).toMatchObject({ jornada: 5, salida: '17:30' });
    const raro = limpiarTemporada(guardarEvento(base(), { ...p, jornada: 0, salida: '25:99' }))!.eventos[0];
    expect(raro.jornada).toBeUndefined();
    expect(raro.salida).toBeUndefined();
    const entreno = limpiarTemporada(guardarEvento(base(), { ...nuevoEvento('2026-10-17', 'entreno'), jornada: 3, salida: '10:00' }))!.eventos[0];
    expect(entreno.jornada).toBeUndefined();
    expect(entreno.salida).toBeUndefined();
  });

  it('el balance cuenta solo partidos con resultado', () => {
    let t = base();
    const partido = (f: string, a: number, c: number) => ({ ...nuevoEvento(f, 'partido'), titulo: 'X', resultado: { a, c } });
    t = guardarEvento(t, partido('2026-10-03', 80, 70));
    t = guardarEvento(t, partido('2026-10-10', 60, 75));
    t = guardarEvento(t, partido('2026-10-17', 90, 85));
    t = guardarEvento(t, { ...nuevoEvento('2026-10-24', 'partido'), titulo: 'Sin jugar' });
    t = guardarEvento(t, { ...nuevoEvento('2026-10-25', 'entreno'), resultado: { a: 1, c: 0 } });
    expect(balanceLiga(t)).toEqual({ g: 2, p: 1, pf: 230, pc: 230 });
  });

  it('la clasificación suma 2 por victoria y 1 por derrota y se ordena', () => {
    const a = { ...nuevaFila(), equipo: 'Ejemplo Uno', g: 3, p: 1 };
    const b = { ...nuevaFila(), equipo: 'Ejemplo Dos', g: 4, p: 0 };
    const c = { ...nuevaFila(), equipo: 'Ejemplo Ces', g: 3, p: 1 };
    expect(puntosClasificacion(a)).toBe(7);
    expect(ordenarClasificacion([a, b, c]).map((f) => f.equipo)).toEqual(['Ejemplo Dos', 'Ejemplo Ces', 'Ejemplo Uno']);
  });

  it('la clasificación se guarda, se limpia y se puede vaciar', () => {
    let t = guardarFila(base(), { ...nuevaFila(), equipo: 'Ejemplo Uno', g: 2, p: 1 });
    const mala = { ...nuevaFila(), equipo: 'Roto', g: -1, p: 0 };
    t = { ...t, clasificacion: [...t.clasificacion!, mala] };
    const limpia = limpiarTemporada(t)!;
    expect(limpia.clasificacion).toHaveLength(1);
    expect('clasificacion' in quitarFila(limpia, limpia.clasificacion![0].id)).toBe(false);
    expect('clasificacion' in limpiarTemporada(base())!).toBe(false);
  });
});
