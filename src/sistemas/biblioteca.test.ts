import { describe, expect, it } from 'vitest';
import { agrupar } from '../pantallas/Sistemas';
import { todosLosSistemas } from './almacen';
import { SISTEMAS_BIBLIOTECA } from './datosBiblioteca';
import { FAMILIAS, NIVELES, type Jugador, type Movimiento, type Punto } from './tipos';

const JUGADORES: Jugador[] = ['1', '2', '3', '4', '5'];
const dentro = ([x, y]: Punto) => x >= 0 && x <= 150 && y >= 0 && y <= 140;
const puntos = (m: Movimiento): Punto[] => (m.tipo === 'pase' ? [] : m.por ? [m.a, m.por] : [m.a]);

describe('biblioteca ampliada de sistemas', () => {
  it('todo queda dentro de la pista y los pases y movimientos usan jugadores que existen', () => {
    for (const s of SISTEMAS_BIBLIOTECA) {
      for (const j of JUGADORES) expect(dentro(s.inicio[j]), `${s.id} inicio ${j}`).toBe(true);
      for (const p of s.pasos) for (const m of p.movimientos) {
        for (const q of puntos(m)) expect(dentro(q), `${s.id}: ${p.texto}`).toBe(true);
        if (m.tipo === 'pase') expect(JUGADORES.includes(m.de) && JUGADORES.includes(m.a), s.id).toBe(true);
        else expect(JUGADORES.includes(m.jugador), s.id).toBe(true);
      }
    }
  });
  it('cada sistema trae su ficha completa, su fuente y va marcado por revisar', () => {
    for (const s of SISTEMAS_BIBLIOTECA) {
      expect(s.revisar, s.id).toBe(true);
      expect(s.fuente?.length, s.id).toBeGreaterThan(20);
      expect(s.objetivo, s.id).toBeTruthy();
      expect(s.cuando, s.id).toBeTruthy();
      expect(s.variantes?.length, s.id).toBeGreaterThanOrEqual(2);
      expect([1, 2, 3], s.id).toContain(s.dificultad);
      expect(Object.keys(s.progresion ?? {}).length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.errores.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.ejercicios.length, s.id).toBeGreaterThanOrEqual(2);
      expect(FAMILIAS.some((f) => f.id === s.familia), s.id).toBe(true);
      // la progresión y las lecturas solo hablan de niveles desde el mínimo
      const desde = NIVELES.findIndex((n) => n.id === s.nivelMinimo);
      for (const n of Object.keys(s.progresion ?? {})) expect(NIVELES.findIndex((x) => x.id === n), `${s.id} ${n}`).toBeGreaterThanOrEqual(desde);
    }
  });
  it('no repite ids ni mezcla ataque y defensa', () => {
    const l = todosLosSistemas();
    expect(new Set(l.map((s) => s.id)).size).toBe(l.length);
    for (const s of SISTEMAS_BIBLIOTECA) expect(s.familia === 'defensa', s.id).toBe(s.tipo === 'defensa');
  });
  it('cubre lo pedido: motion/flex, bloqueos, saques, finales, contraataque, zonas, presiones y coberturas', () => {
    const ids = todosLosSistemas().map((s) => s.id).join(' ');
    for (const k of ['motion', 'flex', 'bloqueo', 'bob', 'ato', 'final', 'contraataque', 'zona-2-3', 'zona-1-3-1', 'drop', 'hedge', 'cambio', 'presion']) expect(ids, k).toContain(k);
    expect(todosLosSistemas().filter((s) => s.tipo === 'defensa').length).toBeGreaterThanOrEqual(10);
  });
  it('agrupa por familia sin perder jugadas y deja fuera los grupos vacíos', () => {
    const l = todosLosSistemas();
    const g = agrupar(l);
    expect(g.reduce((n, x) => n + x.jugadas.length, 0)).toBe(l.length);
    expect(g.every((x) => x.jugadas.length > 0)).toBe(true);
    expect(agrupar([]).length).toBe(0);
  });
});
