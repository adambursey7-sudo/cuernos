import { describe, expect, it } from 'vitest';
import { PLANTILLAS_SEMANA, aplicarPlantillaSemana, cargaSesion, intensidadMedia, materialDeSesion, moverBloqueA, nombreIntensidad, volumenSemanal } from './plan';
import { limpiarSesiones, type Sesion } from './sesiones';
import type { Temporada } from '../temporada/temporada';

const sesion = (bloques: Sesion['bloques'], extra: Partial<Sesion> = {}): Sesion => ({ id: 's1', equipo: 'E', nombre: 'Sesión', duracion: 90, bloques, ...extra });
const b = (ejercicio: string, minutos: number, intensidad?: 1 | 2 | 3) => ({ ejercicio, minutos, tipo: 'tactica' as const, ...(intensidad ? { intensidad } : {}) });

describe('carga e intensidad', () => {
  it('la carga son minutos por intensidad y sin dato cuenta como media', () => {
    const s = sesion([b('a', 20, 1), b('b', 30, 3), b('c', 10)]);
    expect(cargaSesion(s)).toBe(20 + 90 + 20);
    expect(intensidadMedia(s)).toBe(2.2);
    expect(nombreIntensidad(2.2)).toBe('Media');
    expect(nombreIntensidad(1.2)).toBe('Suave');
    expect(nombreIntensidad(2.6)).toBe('Alta');
    expect(intensidadMedia(sesion([]))).toBeUndefined();
  });
});

describe('material', () => {
  it('junta el de los ejercicios y el añadido a mano sin repetir', () => {
    const mat: Record<string, string[]> = { a: ['Balones', 'Conos'], b: ['balones', 'Petos'] };
    expect(materialDeSesion(sesion([b('a', 10), b('b', 10)], { material: 'Cronómetro, Conos' }), (id) => mat[id] ?? [])).toEqual(['Balones', 'Conos', 'Petos', 'Cronómetro']);
  });
});

describe('reordenar arrastrando', () => {
  it('lleva un bloque a otro sitio y los demás se corren', () => {
    const s = sesion([b('a', 5), b('b', 5), b('c', 5), b('d', 5)]);
    expect(moverBloqueA(s, 0, 2).bloques.map((x) => x.ejercicio)).toEqual(['b', 'c', 'a', 'd']);
    expect(moverBloqueA(s, 3, 1).bloques.map((x) => x.ejercicio)).toEqual(['a', 'd', 'b', 'c']);
    expect(moverBloqueA(s, 1, 1)).toBe(s);
    expect(moverBloqueA(s, 0, 9)).toBe(s);
  });
});

describe('plantillas de semana', () => {
  const t: Temporada = { equipoId: 'e', inicio: '2026-09-01', fin: '2027-06-30', fases: [], fijos: [{ id: 'x', dia: 1, hora: '18:00', minutos: 60, pista: 'Pista B' }], eventos: [], excepciones: {} };
  it('sustituye los entrenos fijos y conserva la pista del mismo día', () => {
    const n = aplicarPlantillaSemana(t, PLANTILLAS_SEMANA.find((p) => p.id === 'dos')!);
    expect(n.fijos.map((f) => [f.dia, f.hora, f.minutos])).toEqual([[1, '19:00', 90], [3, '19:00', 75]]);
    expect(n.fijos[0].pista).toBe('Pista B');
    expect(n.fijos[1].pista).toBeUndefined();
  });
  it('todas las plantillas tienen días distintos de 0 a 6', () => {
    for (const p of PLANTILLAS_SEMANA) {
      const dias = p.entrenos.map((e) => e.dia);
      expect(new Set(dias).size).toBe(dias.length);
      expect(dias.every((d) => d >= 0 && d <= 6)).toBe(true);
    }
  });
});

describe('volumen semanal', () => {
  const t: Temporada = {
    equipoId: 'e', inicio: '2026-09-01', fin: '2027-06-30', fases: [{ id: 'f', nombre: 'Carga', desde: '2026-10-26', hasta: '2026-11-08', objetivo: '', trabajar: '' }],
    fijos: [{ id: 'x', dia: 1, hora: '19:00', minutos: 90 }, { id: 'y', dia: 3, hora: '19:00', minutos: 60 }],
    eventos: [{ id: 'p', fecha: '2026-11-01', hora: '11:00', tipo: 'partido', titulo: 'R', lugar: '', balance: '' }],
    excepciones: { 'y|2026-10-29': { cancelado: true, sesionId: undefined } },
  };
  it('cuenta los entrenos de cada semana, los cancelados no y los partidos aparte', () => {
    const [s1, s2] = volumenSemanal(t, [], '2026-10-26', 2);
    expect(s1).toMatchObject({ lunes: '2026-10-26', entrenos: 1, minutos: 90, carga: 180, partidos: 1 });
    expect(s1.fase?.nombre).toBe('Carga');
    expect(s2).toMatchObject({ entrenos: 2, minutos: 150, carga: 300, partidos: 0 });
  });
  it('un entreno con sesión usa los minutos y la intensidad de la sesión', () => {
    const conSesion: Temporada = { ...t, excepciones: { 'x|2026-10-27': { sesionId: 's1' }, 'y|2026-10-29': { cancelado: true } } };
    const [s1] = volumenSemanal(conSesion, [sesion([b('a', 40, 3), b('b', 20, 1)])], '2026-10-26', 1);
    expect(s1).toMatchObject({ minutos: 60 + 0, carga: 140 });
  });
  it('sin temporada no hay semanas', () => {
    expect(volumenSemanal(undefined, [], '2026-10-26', 3)).toEqual([]);
  });
});

describe('sesiones de antes y nuevas', () => {
  it('una sesión vieja se abre igual y los datos nuevos raros se limpian', () => {
    const vieja = { id: 's', equipo: 'E', nombre: 'X', duracion: 90, bloques: [{ ejercicio: 'a', minutos: 10, tipo: 'drill' }] };
    expect(limpiarSesiones([vieja])).toEqual([vieja]);
    const nueva = limpiarSesiones([{ ...vieja, pista: 'P1', material: 'Conos', bloques: [{ ejercicio: 'a', minutos: 10, tipo: 'drill', intensidad: 3, objetivo: 'Lectura' }, { ejercicio: 'b', minutos: 5, tipo: 'drill', intensidad: 9, objetivo: 7 }] }])[0];
    expect(nueva).toMatchObject({ pista: 'P1', material: 'Conos' });
    expect(nueva.bloques[0]).toMatchObject({ intensidad: 3, objetivo: 'Lectura' });
    expect(nueva.bloques[1].intensidad).toBeUndefined();
    expect(nueva.bloques[1].objetivo).toBeUndefined();
  });
});
