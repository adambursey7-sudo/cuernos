import { describe, expect, it } from 'vitest';
import { euros, gastoPorPersona, limpiarViaje, materialPendiente, mensajeViaje, nuevoGasto, nuevoViaje, totalGastos } from './viaje';
import { limpiarTemporada, nuevaTemporada, nuevoEvento } from '../temporada/temporada';

describe('viaje', () => {
  it('un viaje recién creado y sin tocar no se guarda; en cuanto se rellena algo, sí', () => {
    expect(limpiarViaje(nuevoViaje())).toBeUndefined();
    expect(limpiarViaje({ ...nuevoViaje(), transporte: 'Autobús' })?.transporte).toBe('Autobús');
    expect(limpiarViaje(null)).toBeUndefined();
    expect(limpiarViaje('x')).toBeUndefined();
  });
  it('limpia gastos y material absurdos', () => {
    const v = limpiarViaje({
      ...nuevoViaje(), vuelta: '25:00',
      gastos: [{ id: 'a', concepto: 'Autobús', euros: 120.456 }, { id: 'b', concepto: 'x', euros: -5 }, { id: 'c', concepto: 'y', euros: NaN }],
      material: [{ id: '1', texto: 'Balones', llevado: true }, { id: '2', texto: '   ', llevado: true }, null],
    })!;
    expect(v.gastos).toEqual([{ id: 'a', concepto: 'Autobús', euros: 120.46 }]);
    expect(v.material).toEqual([{ id: '1', texto: 'Balones', llevado: true }]);
    expect(v.vuelta).toBeUndefined();
  });
  it('suma los gastos y los reparte entre los viajeros', () => {
    const v = { gastos: [{ ...nuevoGasto(), euros: 100 }, { ...nuevoGasto(), euros: 35.5 }] };
    expect(totalGastos(v)).toBe(135.5);
    expect(gastoPorPersona(v, 9)).toBe(15.06);
    expect(gastoPorPersona(v, 0)).toBe(0);
    expect(totalGastos(undefined)).toBe(0);
    expect(euros(15.5)).toBe('15,50 €');
  });
  it('lista lo que falta por llevar', () => {
    const v = nuevoViaje();
    v.material[0].llevado = true;
    expect(materialPendiente(v)).not.toContain(v.material[0].texto);
    expect(materialPendiente(v)).toHaveLength(v.material.length - 1);
  });
  it('el mensaje para familias lleva dorsales, y ni gastos ni nombres', () => {
    const v = { ...nuevoViaje(), transporte: 'Guagua del club', encuentro: 'el pabellón', vuelta: '20:30', gastos: [{ ...nuevoGasto(), concepto: 'Secreto', euros: 90 }], notas: 'Traer agua' };
    const m = mensajeViaje({ equipo: 'Equipo de prueba', rival: 'Ejemplo CB', fecha: '2026-11-08', hora: '12:00', lugar: 'Pabellón Norte', salida: '10:15', convocados: ['10', '4', '7'] }, v);
    expect(m).toContain('Salida: 10:15 en el pabellón');
    expect(m).toContain('Viajan: #4, #7, #10');
    expect(m).toContain('Vuelta prevista: 20:30');
    expect(m).not.toContain('Secreto');
    expect(m).not.toContain('90');
  });
  it('viaja con el partido en la temporada y solo en los de fuera', () => {
    const t = nuevaTemporada('e1', '2026-09-01', '2027-06-30');
    const fuera = { ...nuevoEvento('2026-11-08', 'partido'), titulo: 'Ejemplo CB', casa: false, viaje: { ...nuevoViaje(), transporte: 'Guagua' } };
    const casa = { ...nuevoEvento('2026-11-15', 'partido'), titulo: 'Otro CB', casa: true, viaje: { ...nuevoViaje(), transporte: 'No debería' } };
    const r = limpiarTemporada({ ...t, eventos: [fuera, casa] })!;
    expect(r.eventos.find((e) => e.titulo === 'Ejemplo CB')?.viaje?.transporte).toBe('Guagua');
    expect(r.eventos.find((e) => e.titulo === 'Otro CB')?.viaje).toBeUndefined();
  });
});
