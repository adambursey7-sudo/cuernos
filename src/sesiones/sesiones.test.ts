import { beforeEach, describe, expect, it } from 'vitest';
import { todosLosEjercicios } from '../ejercicios/ejercicios';
import { bloqueDe, conMinutos, conTipo, diferencia, guardarSesiones, huerfanos, inicios, leerSesiones, mover, nuevaSesion, quitar, reparto, total } from './sesiones';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
};

const montar = () => {
  const [a, b, c] = todosLosEjercicios();
  let s = nuevaSesion('Cadete femenino');
  s = { ...s, bloques: [bloqueDe(a.id, 10, 'drill'), bloqueDe(b.id, 20, 'tactica'), bloqueDe(c.id, 15, 'tactica')] };
  return s;
};

describe('sesiones', () => {
  beforeEach(memoria);

  it('suma el total y dice cuánto falta o sobra', () => {
    const s = montar();
    expect(total(s)).toBe(45);
    expect(diferencia(s)).toBe(45);
    expect(diferencia({ ...s, duracion: 30 })).toBe(-15);
  });

  it('calcula la hora de inicio de cada bloque y el reparto por tipo', () => {
    const s = montar();
    expect(inicios(s)).toEqual([0, 10, 30]);
    expect(reparto(s).map((r) => [r.id, r.minutos])).toEqual([['tactica', 35], ['drill', 10]]);
  });

  it('los minutos van de 5 en 5 entre 5 y 60', () => {
    const s = montar();
    expect(conMinutos(s, 0, 12).bloques[0].minutos).toBe(10);
    expect(conMinutos(s, 0, 1).bloques[0].minutos).toBe(5);
    expect(conMinutos(s, 0, 500).bloques[0].minutos).toBe(60);
  });

  it('mueve, quita y cambia el tipo sin tocar el original', () => {
    const s = montar();
    const m = mover(s, 0, 1);
    expect(m.bloques[1].ejercicio).toBe(s.bloques[0].ejercicio);
    expect(mover(s, 0, -1)).toBe(s);
    expect(quitar(s, 1).bloques).toHaveLength(2);
    expect(conTipo(s, 2, 'defensa').bloques[2].tipo).toBe('defensa');
    expect(s.bloques[2].tipo).toBe('tactica');
  });

  it('guarda y lee, y descarta lo que está mal formado', () => {
    const s = montar();
    expect(guardarSesiones([s])).toBe(true);
    expect(leerSesiones()).toEqual([s]);
    localStorage.setItem('horns.sesiones', JSON.stringify([s, { id: 1 }, { ...s, bloques: [{ ejercicio: 'x', minutos: 5, tipo: 'raro' }] }]));
    expect(leerSesiones()).toEqual([s]);
    localStorage.setItem('horns.sesiones', 'no es json');
    expect(leerSesiones()).toEqual([]);
  });

  it('cuenta los bloques cuyo ejercicio ya no existe', () => {
    const s = montar();
    expect(huerfanos(s)).toBe(0);
    expect(huerfanos({ ...s, bloques: [...s.bloques, bloqueDe('borrada~0', 10, 'drill')] })).toBe(1);
  });
});
