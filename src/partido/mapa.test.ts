import { describe, expect, it } from 'vitest';
import { colorCalor, esTriple, porZona, posicionDe, resumenTiros, tirosDeVivo, zonaDe, ZONAS, type Tiro } from './mapa';
import { nuevoVivo, registrar, type Partido } from './vivo';

// Posiciones de 0 a 100: x a lo ancho (150), y a lo largo (140). El aro está en (50, 8.6).
describe('zonas de la pista', () => {
  it('debajo del aro es la zona; las esquinas y el arco son triples', () => {
    expect(zonaDe(50, 15)).toBe('pintura');
    expect(esTriple(50, 15)).toBe(false);
    expect(zonaDe(3, 5)).toBe('esq-izq');
    expect(zonaDe(97, 5)).toBe('esq-der');
    expect(esTriple(3, 5)).toBe(true);
    expect(zonaDe(50, 90)).toBe('tri-cen');
    expect(zonaDe(10, 60)).toBe('tri-izq');
    expect(zonaDe(90, 60)).toBe('tri-der');
  });

  it('dentro del arco y fuera de la zona es media distancia, por la izquierda, el centro o la derecha', () => {
    expect(zonaDe(20, 20)).toBe('media-izq');
    expect(zonaDe(80, 20)).toBe('media-der');
    expect(zonaDe(50, 50)).toBe('media-cen');
    expect(esTriple(50, 50)).toBe(false);
  });

  it('la línea de tres está a 67,5 del aro: justo dentro es de dos y justo fuera de tres', () => {
    // aro en X=75, Y=12; por la vertical, tres a partir de Y=79,5 → y = 56,8
    expect(esTriple(50, 56)).toBe(false);
    expect(esTriple(50, 58)).toBe(true);
  });

  it('cada zona tiene su sitio para el texto y cae dentro de su propia zona', () => {
    for (const z of ZONAS) expect(zonaDe((z.cx / 150) * 100, (z.cy / 140) * 100)).toBe(z.id);
  });
});

describe('cuentas del mapa', () => {
  const tiros: Tiro[] = [
    { x: 50, y: 15, ok: true, tres: false }, { x: 50, y: 15, ok: false, tres: false },
    { x: 50, y: 90, ok: true, tres: true }, { x: 50, y: 90, ok: false, tres: true }, { x: 50, y: 90, ok: false, tres: true }, { x: 10, y: 60, ok: false, tres: true },
  ];
  it('porcentaje por zona', () => {
    const z = porZona(tiros);
    expect(z.pintura).toEqual({ a: 1, i: 2, pct: 50 });
    expect(z['tri-cen']).toEqual({ a: 1, i: 3, pct: 33 });
    expect(z['media-izq']).toEqual({ a: 0, i: 0, pct: null });
  });
  it('resumen: de dos, de tres y porcentaje efectivo', () => {
    const r = resumenTiros(tiros);
    expect(r.tc).toMatchObject({ a: 2, i: 6, pct: 33 });
    expect(r.t2).toMatchObject({ a: 1, i: 2 });
    expect(r.t3).toMatchObject({ a: 1, i: 4 });
    expect(r.efg).toBe(42); // (2 + 0,5) / 6
    expect(resumenTiros([]).efg).toBeNull();
  });
  it('el calor va de rojo a verde y no inventa color sin tiros', () => {
    expect(colorCalor(null)).toBeUndefined();
    expect(colorCalor(10)).toBe('hsl(0 70% 48%)');
    expect(colorCalor(60)).toBe('hsl(130 70% 48%)');
  });
});

describe('tiros del partido en directo', () => {
  it('solo cuentan los tiros con posición; los libres y los rápidos sin lugar no salen', () => {
    let p: Partido = { directo: {}, rival: 0, vivo: nuevoVivo(['a']) };
    p = registrar(p, { tipo: 'c3', j: 'a', x: 50, y: 90 }, 0);
    p = registrar(p, { tipo: 'f2', j: 'a', x: 40, y: 20 }, 0);
    p = registrar(p, { tipo: 'c2', j: 'a' }, 0);
    p = registrar(p, { tipo: 'c1', j: 'a' }, 0);
    expect(tirosDeVivo(p.vivo)).toEqual([{ x: 50, y: 90, ok: true, tres: true, j: 'a', c: 1 }, { x: 40, y: 20, ok: false, tres: false, j: 'a', c: 1 }]);
    expect(tirosDeVivo(undefined)).toEqual([]);
  });
  it('posición de una pulsación', () => {
    expect(posicionDe(150, 70, 300, 280)).toEqual({ x: 50, y: 25 });
    expect(posicionDe(-5, 999, 300, 280)).toEqual({ x: 0, y: 100 });
  });
});
