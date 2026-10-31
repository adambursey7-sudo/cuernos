import { describe, expect, it } from 'vitest';
import { avisosFaltas, limpiarDirecto, ponerFalta, sumarPuntos, totalPuntos, type Directo } from './directo';

describe('partido en directo', () => {
  it('suma puntos sin bajar de cero y totaliza', () => {
    let d = sumarPuntos(undefined, 'a', 3);
    d = sumarPuntos(d, 'b', 2);
    d = sumarPuntos(d, 'a', -5);
    expect(d.a.p).toBe(0);
    expect(totalPuntos(d)).toBe(2);
  });
  it('las faltas van de 0 a 5 y avisan con 4 y 5', () => {
    let d: Directo | undefined;
    for (let i = 0; i < 7; i++) d = ponerFalta(d, 'a', 1);
    expect(d!.a.f).toBe(5);
    for (let i = 0; i < 4; i++) d = ponerFalta(d, 'b', 1);
    expect(avisosFaltas(d)).toEqual([{ id: 'a', estado: 'fuera' }, { id: 'b', estado: 'peligro' }]);
    expect(ponerFalta(undefined, 'z', -1).z.f).toBe(0);
  });
  it('limpia lo que no vale', () => {
    expect(limpiarDirecto({ a: { p: 4, f: 9 }, c: { p: 'no', f: 0 }, d: { p: 0, f: 0 } })).toEqual({ a: { p: 4, f: 5 } });
    expect(limpiarDirecto(null)).toBeUndefined();
  });
});
