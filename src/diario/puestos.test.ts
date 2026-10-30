import { describe, expect, it } from 'vitest';
import { guardarJugadora, nuevaJugadora, nuevoEquipo } from './diario';
import { numerosDe, puestosDe, rellenarPuestos } from './puestos';

describe('quién es quién', () => {
  const e = nuevoEquipo('Cadete femenino');
  const a = nuevaJugadora(e.id, { numero: '4', posicion: 'Base' });
  const b = nuevaJugadora(e.id, { numero: '13', posicion: 'Base' });
  const c = nuevaJugadora(e.id, { numero: '9', posicion: 'Pívot' });
  const d = [a, b, c].reduce(guardarJugadora, { equipos: [e], jugadoras: [] as ReturnType<typeof nuevaJugadora>[] });

  it('rellena cada puesto con una jugadora de esa posición, sin repetir', () => {
    const r = rellenarPuestos(d, e);
    expect(r.puestos).toEqual({ '1': a.id, '5': c.id });
  });

  it('enseña el dorsal del puesto y el puesto si nadie lo hace', () => {
    const r = rellenarPuestos(d, e);
    expect(numerosDe(d, r)).toEqual({ '1': '4', '2': '2', '3': '3', '4': '4', '5': '9' });
  });

  it('ignora una jugadora que ya no existe o es de otro equipo', () => {
    expect(puestosDe(d, { ...e, puestos: { '1': 'fantasma', '2': a.id } })).toEqual({ '2': a });
    expect(puestosDe(d, { ...nuevoEquipo('Otro'), puestos: { '1': a.id } })).toEqual({});
  });
});

it('un puesto con una jugadora borrada se vuelve a rellenar', () => {
  const e = nuevoEquipo('X');
  const a = nuevaJugadora(e.id, { numero: '4', posicion: 'Base' });
  const d = guardarJugadora({ equipos: [e], jugadoras: [] }, a);
  expect(rellenarPuestos(d, { ...e, puestos: { '1': 'borrada' } }).puestos).toEqual({ '1': a.id });
});
