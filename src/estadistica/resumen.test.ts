import { describe, expect, it } from 'vitest';
import { asistenciaSemana, balance, cuentaAtras, haceCuanto, jugados, racha, textoRacha } from './resumen';
import type { Evento, Temporada } from '../temporada/temporada';

const partido = (id: string, fecha: string, a?: number, c?: number): Evento => ({ id, fecha, hora: '11:00', tipo: 'partido', titulo: id, lugar: '', balance: '', ...(a === undefined ? {} : { resultado: { a, c: c! } }) });
const temp = (eventos: Evento[], asistencia?: Record<string, string[]>): Temporada => ({ equipoId: 'e', inicio: '2026-09-01', fin: '2027-06-30', fases: [], fijos: [], eventos, excepciones: {}, ...(asistencia ? { asistencia } : {}) });

describe('resumen del equipo', () => {
  const t = temp([partido('a', '2026-10-03', 50, 40), partido('b', '2026-10-10', 60, 41), partido('c', '2026-10-17', 40, 55), partido('d', '2026-10-24', 70, 50), partido('futuro', '2026-11-30'), partido('e', '2026-10-31', 61, 40)]);

  it('solo cuenta los partidos con resultado y los ordena por fecha', () => {
    expect(jugados(t).map((j) => j.evento.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('balance: ganados, perdidos y diferencia de puntos', () => {
    expect(balance(jugados(t))).toMatchObject({ g: 4, p: 1, e: 0, pf: 281, pc: 226, dif: 55, jugados: 5 });
  });

  it('racha: partidos seguidos con el mismo resultado desde el último', () => {
    expect(racha(jugados(t))).toEqual({ marca: 'G', n: 2 });
    expect(textoRacha({ marca: 'G', n: 2 })).toBe('2 victorias seguidas');
    expect(textoRacha({ marca: 'P', n: 1 })).toBe('1 derrota');
    expect(textoRacha(racha([]))).toBe('Sin partidos');
  });

  it('un empate corta la racha', () => {
    expect(racha(jugados(temp([partido('a', '2026-10-03', 50, 40), partido('b', '2026-10-10', 40, 40)])))).toEqual({ marca: 'E', n: 1 });
  });
});

describe('cuenta atrás', () => {
  it('días, horas y minutos que faltan', () => {
    expect(cuentaAtras('2026-11-03', '17:30', new Date(2026, 10, 1, 14, 0))).toEqual({ dias: 2, horas: 3, minutos: 30, enMarcha: false });
  });
  it('si acaba de empezar, está en marcha; si pasó hace mucho, no', () => {
    expect(cuentaAtras('2026-11-01', '14:00', new Date(2026, 10, 1, 14, 30))).toMatchObject({ dias: 0, horas: 0, minutos: 0, enMarcha: true });
    expect(cuentaAtras('2026-11-01', '14:00', new Date(2026, 10, 1, 18, 0)).enMarcha).toBe(false);
  });
});

describe('asistencia de la semana', () => {
  const t = temp([partido('p1', '2026-11-04')], { 'f1|2026-11-02': ['1', '2', '3', '4'], 'f1|2026-10-26': ['1'], p1: ['1', '2'] });
  it('suma los entrenos con lista de lunes a domingo', () => {
    // semana del 2 al 8 de noviembre: 4 de 5 y 2 de 5 son 6 de 10
    expect(asistenciaSemana(t, '2026-11-05', 5)).toEqual({ sesiones: 2, pct: 60 });
  });
  it('sin listas esa semana o sin plantilla, no hay porcentaje', () => {
    expect(asistenciaSemana(t, '2026-11-20', 5)).toEqual({ sesiones: 0, pct: null });
    expect(asistenciaSemana(t, '2026-11-05', 0)).toEqual({ sesiones: 0, pct: null });
    expect(asistenciaSemana(undefined, '2026-11-05', 5).pct).toBeNull();
  });
});

describe('haceCuanto', () => {
  it('hoy, ayer y hace n días', () => {
    expect(haceCuanto('2026-11-01', '2026-11-01')).toBe('Hoy');
    expect(haceCuanto('2026-10-31', '2026-11-01')).toBe('Ayer');
    expect(haceCuanto('2026-10-28', '2026-11-01')).toBe('Hace 4 días');
  });
});
