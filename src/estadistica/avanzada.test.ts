import { describe, expect, it } from 'vitest';
import { arrancar, boxScore, cambiar, cuartoSiguiente, nuevoVivo, parar, registrar, type Partido } from '../partido/vivo';
import { masMenos, quintetoInicial, quintetosMasUsados, resumenAvanzado, sentido, tendencia, tramosDe, valoracion, valoracionPorEdad } from './avanzada';
import type { Evento } from '../temporada/temporada';

const T0 = 1_000_000;
const seg = (n: number) => T0 + n * 1000;
const inicio = (): Partido => ({ directo: {}, rival: 0, vivo: arrancar(nuevoVivo(['a', 'b', 'c', 'd', 'e']), T0) });

/** Partido de juguete: a los 120 s entra f por e; a los 300 s cambia el cuarto. */
function partido(): Partido {
  let p = inicio();
  p = registrar(p, { tipo: 'c2', j: 'a' }, seg(30));
  p = registrar(p, { tipo: 'rival', v: 3 }, seg(60));
  p = cambiar(p, 'f', 'e', seg(120));
  p = registrar(p, { tipo: 'c3', j: 'f' }, seg(150));
  p = registrar(p, { tipo: 'rival', v: 2 }, seg(200));
  p = { ...p, vivo: parar(p.vivo, seg(300)) };
  p = cuartoSiguiente(p, seg(300));
  p = registrar({ ...p, vivo: arrancar(p.vivo, seg(300)) }, { tipo: 'c1', j: 'b' }, seg(330));
  return { ...p, vivo: parar(p.vivo, seg(360)) };
}

describe('+/- y quintetos', () => {
  it('recupera el quinteto inicial deshaciendo los cambios', () => {
    expect(quintetoInicial(partido().vivo).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('reparte los puntos entre quienes estaban en pista', () => {
    const pm = masMenos(partido().vivo);
    // antes del cambio: +2 -3; después: +3 -2; en el segundo cuarto: +1
    expect(pm.a).toBe(2 - 3 + 3 - 2 + 1);
    expect(pm.e).toBe(2 - 3);
    expect(pm.f).toBe(3 - 2 + 1);
  });
  it('mide el tiempo de cada quinteto sin pasarse del partido', () => {
    const tramos = tramosDe(partido().vivo);
    // el cambio de cuarto no rompe el quinteto: el segundo tramo sigue en el cuarto siguiente
    expect(tramos.map((t) => t.seg)).toEqual([120, 240]);
    expect(tramos.map((t) => [t.a, t.c])).toEqual([[2, 3], [4, 2]]);
  });
  it('agrupa los quintetos de varios partidos y ordena por tiempo', () => {
    const p = partido();
    const l = quintetosMasUsados([{ vivo: p.vivo }, { vivo: p.vivo }]);
    expect(l[0].seg).toBe(480);
    expect(l[0].jugadores).toEqual(['a', 'b', 'c', 'd', 'f']);
    expect(l[0].dif).toBe((3 - 2 + 1) * 2);
  });
  it('un partido sin jugadas no da nada', () => {
    expect(tramosDe(undefined)).toEqual([]);
    expect(masMenos(inicio().vivo)).toEqual({});
  });
});

describe('valoración y temporada', () => {
  it('suma lo bueno y resta fallos, pérdidas y faltas', () => {
    expect(valoracion({ p: 10, reb: 5, ast: 3, rob: 2, per: 4, f: 3, tcA: 4, tcI: 9, tlA: 2, tlI: 3 })).toBe(10 + 5 + 3 + 2 - 4 - 5 - 1 - 3);
  });
  it('resume la temporada por jugadora y calcula por 40 minutos solo con minutos suficientes', () => {
    const p = partido();
    const e = { id: 'x', tipo: 'partido', vivo: p.vivo, directo: p.directo } as unknown as Evento;
    const a = resumenAvanzado({ eventos: [e] }).find((x) => x.id === 'a')!;
    expect(a.partidos).toBe(1);
    expect(a.mm).toBe(2 - 3 + 3 - 2 + 1);
    expect(a.val40).toBeNull(); // 6 minutos: poco para fiarse
    const dos = resumenAvanzado({ eventos: [e, e] }).find((x) => x.id === 'a')!;
    expect(dos.partidos).toBe(2);
    expect(dos.val40).not.toBeNull();
    expect(boxScore(p.directo, p.vivo).length).toBeGreaterThan(0);
  });
  it('la tendencia es una media móvil y se nota si sube o baja', () => {
    expect(tendencia([2, 4, 6, 8], 2)).toEqual([2, 3, 5, 7]);
    expect(sentido([1, 2, 3, 8, 9, 10])).toBe('sube');
    expect(sentido([10, 9, 8, 3, 2, 1])).toBe('baja');
    expect(sentido([5, 5, 5, 5])).toBe('igual');
    expect(sentido([1, 9])).toBe('igual');
  });
  it('valoración por edad, sin nombres y sin quien no ha jugado lo bastante', () => {
    const r = valoracionPorEdad(
      [{ id: 'a', partidos: 3, seg: 1800, mm: 0, val: 30, val40: 40 }, { id: 'b', partidos: 3, seg: 1800, mm: 0, val: 10, val40: 20 }, { id: 'c', partidos: 1, seg: 100, mm: 0, val: 1, val40: null }],
      { a: 2010, b: 2010, c: 2011 }, 2026,
    );
    expect(r).toEqual([{ edad: 16, jugadoras: 2, val40: 30 }]);
  });
});
