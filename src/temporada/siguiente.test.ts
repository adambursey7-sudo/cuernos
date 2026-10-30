import { describe, expect, it } from 'vitest';
import { cuando, siguiente } from './siguiente';
import { guardarEvento, guardarFijo, nuevaTemporada, nuevoEvento, nuevoFijo } from './temporada';

// 2026-10-12 es lunes.
const base = () => guardarFijo(nuevaTemporada('e1', '2026-09-01', '2027-06-30'), { ...nuevoFijo(0), hora: '18:30' });

describe('siguiente', () => {
  it('coge el entreno de hoy si aún no ha pasado', () => {
    expect(siguiente(base(), '2026-10-12', '17:00')?.hora).toBe('18:30');
  });
  it('lo mantiene mientras está en marcha y lo pasa al día siguiente después', () => {
    expect(siguiente(base(), '2026-10-12', '19:30')?.fecha).toBe('2026-10-12');
    expect(siguiente(base(), '2026-10-12', '21:00')?.fecha).toBe('2026-10-19');
  });
  it('prefiere un partido más cercano que el siguiente entreno', () => {
    const t = guardarEvento(base(), { ...nuevoEvento('2026-10-17', 'partido'), hora: '11:00', titulo: 'Ejemplo Uno' });
    expect(siguiente(t, '2026-10-13', '10:00')?.titulo).toBe('Ejemplo Uno');
  });
  it('devuelve nada si no hay nada apuntado', () => {
    expect(siguiente(nuevaTemporada('e1', '2026-09-01', '2027-06-30'), '2026-10-12', '10:00')).toBeUndefined();
  });
});

describe('cuando', () => {
  it('dice hoy, mañana o la fecha', () => {
    expect(cuando('2026-10-12', '2026-10-12')).toBe('Hoy');
    expect(cuando('2026-10-13', '2026-10-12')).toBe('Mañana');
    expect(cuando('2026-10-17', '2026-10-12')).toBe('sáb 17 oct');
  });
});
