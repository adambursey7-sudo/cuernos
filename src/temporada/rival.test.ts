import { describe, expect, it } from 'vitest';
import { habilidadesContra, informeAnterior, limpiarInforme } from './rival';
import { limpiarTemporada, nuevaTemporada, nuevoEvento, guardarEvento } from './temporada';

describe('informe del rival', () => {
  it('limpia lo roto y no guarda un informe vacío', () => {
    expect(limpiarInforme(null)).toBeUndefined();
    expect(limpiarInforme({ rasgos: ['inventado'], vigilar: ' ', haremos: 3 })).toBeUndefined();
    expect(limpiarInforme({ rasgos: ['zona', 'zona', 'x'], vigilar: 'La 7', haremos: 'Cerrar rebote' })).toEqual({ rasgos: ['zona'], vigilar: 'La 7', haremos: 'Cerrar rebote' });
  });

  it('saca las habilidades a entrenar sin repetir', () => {
    expect(habilidadesContra(['zona', 'dentro', 'rebote'])).toEqual(['tiro', 'pase', 'ayudas', 'reb-def']);
    expect(habilidadesContra([])).toEqual([]);
  });

  it('reutiliza el último informe contra el mismo rival, sin mirar mayúsculas', () => {
    const e = (id: string, fecha: string, titulo: string, vigilar = '') => ({ id, fecha, tipo: 'partido', titulo, rival: vigilar ? { rasgos: [], vigilar, haremos: '' } : undefined });
    const eventos = [e('a', '2026-10-01', 'Ejemplo CB', 'La 7'), e('b', '2026-11-01', 'ejemplo cb ', 'La 9'), e('c', '2026-12-01', 'Ejemplo CB'), e('d', '2026-10-15', 'Otro', 'La 3')];
    expect(informeAnterior(eventos, eventos[2])?.vigilar).toBe('La 9');
    expect(informeAnterior(eventos, eventos[0])?.vigilar).toBe('La 9');
    expect(informeAnterior(eventos, e('z', '2026-12-05', ''))).toBeUndefined();
  });

  it('el informe viaja con el partido en la temporada', () => {
    const ev = { ...nuevoEvento('2026-11-07', 'partido'), titulo: 'Ejemplo CB', rival: { rasgos: ['zona'], vigilar: 'La 7', haremos: '' } };
    const t = limpiarTemporada(guardarEvento(nuevaTemporada('e1', '2026-09-01', '2027-06-30'), ev));
    expect(t?.eventos[0].rival?.rasgos).toEqual(['zona']);
  });
});
