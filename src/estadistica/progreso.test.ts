import { describe, expect, it } from 'vitest';
import { asistenciaPorSemana, compararPartidos, filasPartidos, ganaLinea, hace, partidosDe, rachaAsistencia, recordsEquipo, recordsJugadora, serieEquipo, valorMetrica } from './progreso';
import { nuevoVivo, registrar, type Partido } from '../partido/vivo';
import type { Evento, Temporada } from '../temporada/temporada';

const conDetalle = (): Partido => {
  let p: Partido = { directo: {}, rival: 40, vivo: nuevoVivo(['a', 'b']) };
  for (const j of [{ tipo: 'c3', j: 'a' }, { tipo: 'f3', j: 'a' }, { tipo: 'c2', j: 'b' }, { tipo: 'f2', j: 'b' }, { tipo: 'c1', j: 'b' }, { tipo: 'reb', j: 'a' }, { tipo: 'ast', j: 'b' }] as const) p = registrar(p, j, 0);
  return p;
};

const partido = (id: string, fecha: string, a: number, c: number, p?: Partido): Evento => ({
  id, fecha, hora: '11:00', tipo: 'partido', titulo: `R${id}`, lugar: '', balance: '', resultado: { a, c },
  ...(p ? { directo: p.directo, vivo: { ...p.vivo, min: { a: 600, b: 300 } } } : {}),
});
const temp = (eventos: Evento[], asistencia?: Record<string, string[]>): Temporada => ({ equipoId: 'e', inicio: '2026-09-01', fin: '2027-06-30', fases: [], fijos: [], eventos, excepciones: {}, ...(asistencia ? { asistencia } : {}) });

describe('filas de partido', () => {
  const t = temp([partido('1', '2026-10-03', 50, 40), partido('2', '2026-10-10', 60, 41, conDetalle())]);
  it('sin directo solo hay resultado; con directo hay tiros y porcentajes', () => {
    const [x, y] = filasPartidos(t);
    expect(x).toMatchObject({ detalle: false, tcI: 0, a: 50 });
    expect(y).toMatchObject({ detalle: true, tcA: 2, tcI: 4, t3A: 1, t3I: 2, tlA: 1, tlI: 1, reb: 1, ast: 1 });
    expect(valorMetrica(y, 'tc')).toBe(50);
    expect(valorMetrica(y, 't3')).toBe(50);
    expect(valorMetrica(x, 'tc')).toBeNull();
    expect(valorMetrica(y, 'diferencia')).toBe(19);
  });
  it('la serie sigue el orden de los partidos y deja huecos donde no hay dato', () => {
    expect(serieEquipo(filasPartidos(t), 'tc').map((p) => p.valor)).toEqual([null, 50]);
  });
});

describe('por jugadora', () => {
  const t = temp([partido('1', '2026-10-03', 50, 40), partido('2', '2026-10-10', 60, 41, conDetalle())]);
  it('solo salen los partidos en que hay algo de ella y los récords cogen el mejor', () => {
    const ps = partidosDe(t, 'b');
    expect(ps).toHaveLength(1);
    expect(ps[0]).toMatchObject({ p: 3, ast: 1, min: 5, tcA: 1, tcI: 2 });
    expect(recordsJugadora(ps).find((r) => r.clave === 'p')).toMatchObject({ valor: 3, fecha: '2026-10-10' });
    expect(partidosDe(t, 'nadie')).toEqual([]);
  });
});

describe('récords del equipo', () => {
  it('más puntos, mayor victoria, menos recibidos, racha y triples', () => {
    const t = temp([partido('1', '2026-10-03', 50, 40), partido('2', '2026-10-10', 60, 41, conDetalle()), partido('3', '2026-10-17', 30, 45), partido('4', '2026-10-24', 70, 30)]);
    const r = Object.fromEntries(recordsEquipo(filasPartidos(t)).map((x) => [x.nombre, x]));
    expect(r['Más puntos'].valor).toBe('70');
    expect(r['Mayor victoria'].valor).toBe('+40');
    expect(r['Menos puntos recibidos'].valor).toBe('30');
    expect(r['Mejor racha'].valor).toBe('2 seguidas');
    expect(r['Más triples'].valor).toBe('1');
    expect(recordsEquipo([])).toEqual([]);
  });
});

describe('comparar dos partidos', () => {
  const [x, y] = filasPartidos(temp([partido('1', '2026-10-03', 50, 40), partido('2', '2026-10-10', 60, 41, conDetalle())]));
  it('quien gana cada línea depende de si más es mejor, y lo que falta no gana nadie', () => {
    const l = Object.fromEntries(compararPartidos(x, y).map((z) => [z.nombre, z]));
    expect(ganaLinea(l['Puntos a favor'])).toBe('b');
    expect(ganaLinea(l['Puntos en contra'])).toBe('a');
    expect(ganaLinea(l['% tiro de campo'])).toBeNull();
    expect(l['Rebotes'].a).toBeNull();
    expect(ganaLinea({ nombre: 'x', a: 2, b: 2, masEsMejor: true })).toBeNull();
  });
});

describe('asistencia', () => {
  const t = temp([], { 'f|2026-10-27': ['1', '2', '3'], 'f|2026-10-29': ['1', '2'], 'f|2026-10-20': ['1', '3'], 'f|2026-11-20': ['1'] });
  it('racha de entrenos seguidos hasta hoy y la mejor; los de fechas futuras no cuentan', () => {
    expect(rachaAsistencia(t, '1', '2026-11-01')).toEqual({ actual: 3, mejor: 3, vino: 3, de: 3 });
    expect(rachaAsistencia(t, '3', '2026-11-01')).toEqual({ actual: 0, mejor: 2, vino: 2, de: 3 });
  });
  it('una cifra por semana, la más antigua primero', () => {
    const s = asistenciaPorSemana(t, '2026-11-01', 3, 3);
    expect(s.map((x) => x.lunes)).toEqual(['2026-10-12', '2026-10-19', '2026-10-26']);
    expect(s.map((x) => x.pct)).toEqual([null, 67, 83]);
  });
  it('hace cuánto', () => {
    expect(hace('2026-10-31', '2026-11-01')).toBe('ayer');
    expect(hace('2026-10-01', '2026-11-01')).toBe('hace 4 semanas');
  });
});
