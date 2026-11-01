import { describe, expect, it } from 'vitest';
import { arrancar, boxScore, cambiar, cuartoSiguiente, deshacer, enBonus, faltasEquipo, limpiarVivo, mejores, nombreCuarto, nuevoVivo, parar, registrar, restante, segundosCuarto, terminar, type Partido } from './vivo';
import { limpiarDirecto } from '../temporada/directo';
import { limpiarTemporada, type Temporada } from '../temporada/temporada';

const T0 = 1_000_000;
const inicio = (): Partido => ({ directo: {}, rival: 0, vivo: nuevoVivo(['a', 'b', 'c', 'd', 'e']) });

describe('apuntar y deshacer', () => {
  it('canastas, rebotes y faltas mueven la estadística y el marcador del rival suma aparte', () => {
    let p = inicio();
    p = registrar(p, { tipo: 'c3', j: 'a', x: 20, y: 60 }, T0);
    p = registrar(p, { tipo: 'c2', j: 'a' }, T0);
    p = registrar(p, { tipo: 'reb', j: 'b' }, T0);
    p = registrar(p, { tipo: 'fal', j: 'b' }, T0);
    p = registrar(p, { tipo: 'rival', v: 2 }, T0);
    expect(p.directo.a.p).toBe(5);
    expect(p.directo.b).toMatchObject({ reb: 1, f: 1 });
    expect(p.rival).toBe(2);
    expect(faltasEquipo(p.vivo)).toBe(1);
    expect(p.vivo.cronologia.map((j) => j.n)).toEqual([1, 2, 3, 4, 5]);
  });

  it('un tiro fallado no suma puntos pero queda en la cronología', () => {
    const p = registrar(inicio(), { tipo: 'f3', j: 'a' }, T0);
    expect(p.directo.a).toBeUndefined();
    expect(p.vivo.cronologia).toHaveLength(1);
  });

  it('deshacer devuelve todo a como estaba, jugada a jugada', () => {
    let p = inicio();
    const pasos: Partido[] = [p];
    for (const j of [{ tipo: 'c2', j: 'a' }, { tipo: 'ast', j: 'b' }, { tipo: 'fal', j: 'c' }, { tipo: 'rival', v: 3 }, { tipo: 'tm' }] as const) {
      p = registrar(p, j, T0);
      pasos.push(p);
    }
    for (let i = pasos.length - 2; i >= 0; i--) {
      p = deshacer(p, T0);
      expect(p.rival).toBe(pasos[i].rival);
      expect(p.vivo.tm).toBe(pasos[i].vivo.tm);
      expect(p.vivo.cronologia).toEqual(pasos[i].vivo.cronologia);
      expect(p.vivo.faltasEq).toEqual(pasos[i].vivo.faltasEq);
      for (const id of ['a', 'b', 'c']) expect(p.directo[id]?.p ?? 0).toBe(pasos[i].directo[id]?.p ?? 0);
    }
    expect(deshacer(p, T0)).toEqual(p);
  });

  it('las faltas de equipo se cuentan por cuarto y a la quinta hay bonus', () => {
    let p = inicio();
    for (let i = 0; i < 5; i++) p = registrar(p, { tipo: 'fal', j: 'abcde'[i] }, T0);
    expect(enBonus(p.vivo)).toBe(true);
    p = cuartoSiguiente(p, T0);
    expect(faltasEquipo(p.vivo)).toBe(0);
    expect(enBonus(p.vivo)).toBe(false);
    p = deshacer(p, T0);
    expect(p.vivo.cuarto).toBe(1);
    expect(faltasEquipo(p.vivo)).toBe(5);
  });

  it('tras terminar no se puede apuntar ni deshacer', () => {
    const p = terminar(registrar(inicio(), { tipo: 'c2', j: 'a' }, T0), T0);
    expect(registrar(p, { tipo: 'c2', j: 'a' }, T0)).toBe(p);
    expect(deshacer(p, T0)).toBe(p);
  });
});

describe('reloj, minutos y cambios', () => {
  it('los minutos se reparten entre quienes están en pista, también al cambiar a mitad', () => {
    let p = arrancarPartido();
    p = cambiar(p, 'f', 'a', T0 + 120_000);
    p = { ...p, vivo: parar(p.vivo, T0 + 300_000) };
    expect(p.vivo.min).toMatchObject({ a: 120, b: 300, f: 180 });
    expect(p.vivo.enPista).toEqual(['f', 'b', 'c', 'd', 'e']);
    expect(p.vivo.segundos).toBe(300);
  });

  it('el reloj marcha solo mientras corre y cuenta atrás', () => {
    const p = arrancarPartido();
    expect(segundosCuarto(p.vivo, T0 + 65_000)).toBe(65);
    expect(restante(p.vivo, T0 + 65_000)).toBe(535);
    expect(restante(p.vivo, T0 + 99_999_000)).toBe(0);
  });

  it('con la app cerrada y el reloj puesto no se cuentan horas: tope en lo que queda del cuarto', () => {
    let p = arrancarPartido();
    p = { ...p, vivo: parar(p.vivo, T0 + 5 * 3600_000) };
    expect(p.vivo.segundos).toBe(600);
    expect(p.vivo.min.a).toBe(600);
  });

  it('no deja meter a quien ya está en pista ni sacar a quien no está', () => {
    const p = inicio();
    expect(cambiar(p, 'a', 'b', T0)).toBe(p);
    expect(cambiar(p, 'f', 'z', T0)).toBe(p);
  });

  it('deshacer un cambio vuelve a poner a la que salió', () => {
    let p = cambiar(inicio(), 'f', 'c', T0);
    expect(p.vivo.enPista).toContain('f');
    p = deshacer(p, T0);
    expect(p.vivo.enPista).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('cuartos: C1 a C4, luego prórroga', () => {
    expect([1, 4, 5, 6].map(nombreCuarto)).toEqual(['C1', 'C4', 'PR', 'PR2']);
    let p = inicio();
    p = cuartoSiguiente(p, T0);
    expect(p.vivo).toMatchObject({ cuarto: 2, segundos: 0 });
  });
});

describe('box score y mejores', () => {
  it('cuenta tiros y saca al mejor de cada apartado (con empates)', () => {
    let p = inicio();
    p = registrar(p, { tipo: 'c2', j: 'a' }, T0);
    p = registrar(p, { tipo: 'f2', j: 'a' }, T0);
    p = registrar(p, { tipo: 'c3', j: 'b' }, T0);
    p = registrar(p, { tipo: 'c1', j: 'b' }, T0);
    p = registrar(p, { tipo: 'f1', j: 'b' }, T0);
    p = registrar(p, { tipo: 'reb', j: 'a' }, T0);
    p = registrar(p, { tipo: 'reb', j: 'b' }, T0);
    const filas = boxScore(p.directo, p.vivo);
    expect(filas[0]).toMatchObject({ id: 'b', p: 4, tcA: 1, tcI: 1, tlA: 1, tlI: 2 });
    expect(filas[1]).toMatchObject({ id: 'a', p: 2, tcA: 1, tcI: 2 });
    const m = mejores(filas);
    expect(m).toMatchObject({ p: ['b'], ast: [], rob: [] });
    expect([...m.reb].sort()).toEqual(['a', 'b']);
  });
});

describe('migración: datos de antes', () => {
  it('un directo viejo (solo puntos y faltas) se abre igual y no pierde nada', () => {
    expect(limpiarDirecto({ a: { p: 10, f: 2 }, b: { p: 0, f: 0 } })).toEqual({ a: { p: 10, f: 2 } });
  });

  it('un directo nuevo conserva rebotes y asistencias y descarta basura', () => {
    expect(limpiarDirecto({ a: { p: 4, f: 0, reb: 3, ast: 1.5, rob: -2, per: 'x' } })).toEqual({ a: { p: 4, f: 0, reb: 3 } });
  });

  it('una temporada vieja, sin partido en directo, se limpia igual', () => {
    const vieja = { equipoId: 'e', inicio: '2026-09-01', fin: '2027-06-30', fases: [], fijos: [], excepciones: {}, eventos: [{ id: 'v1', fecha: '2026-10-10', hora: '11:00', tipo: 'partido', titulo: 'Rival', lugar: '', balance: '', resultado: { a: 50, c: 40 }, directo: { a: { p: 9, f: 1 } } }] };
    const t = limpiarTemporada(vieja) as Temporada;
    expect(t.eventos[0].directo).toEqual({ a: { p: 9, f: 1 } });
    expect(t.eventos[0].vivo).toBeUndefined();
  });

  it('el partido en directo sobrevive a guardar y cargar, y lo raro se limpia', () => {
    let p = arrancarPartido();
    p = registrar(p, { tipo: 'c3', j: 'a', x: 12, y: 70 }, T0 + 1000);
    p = { ...p, vivo: parar(p.vivo, T0 + 61_000) };
    const ida = limpiarVivo(JSON.parse(JSON.stringify(p.vivo)));
    expect(ida).toEqual(p.vivo);
    const rara = limpiarVivo({ cuarto: 99, duracion: -3, enPista: ['a', 'a', 7, 'b'], min: { a: 'x', b: 40 }, cronologia: [{ tipo: 'inventado' }, { n: 1, c: 1, s: 5, tipo: 'c2', j: 'a', x: 500, y: 20 }] });
    expect(rara).toMatchObject({ cuarto: 12, duracion: 1, enPista: ['a', 'b'], min: { b: 40 } });
    expect(rara!.cronologia).toEqual([{ n: 1, c: 1, s: 5, tipo: 'c2', j: 'a', x: 100, y: 20 }]);
    expect(limpiarVivo('hola')).toBeUndefined();
  });
});

function arrancarPartido(): Partido {
  const p = inicio();
  return { ...p, vivo: arrancar(p.vivo, T0) };
}
