import { describe, expect, it } from 'vitest';
import { hojaPlan, mensajePartido } from './mensaje';
import { nuevoEvento } from './temporada';

const partido = { ...nuevoEvento('2026-11-07', 'partido'), titulo: 'Ejemplo Uno', hora: '19:00', jornada: 5, casa: false, salida: '16:30', lugar: 'Pabellón Ejemplo', plan: 'Zona 2-3 y bloqueo directo' };

describe('mensaje a la plantilla', () => {
  it('lleva rival, día, hora, salida y plan', () => {
    const m = mensajePartido(partido, 'Senior A');
    expect(m).toContain('Jornada 5');
    expect(m).toContain('Ejemplo Uno');
    expect(m).toContain('sábado 7/11 a las 19:00');
    expect(m).toContain('Salida del viaje: 16:30');
    expect(m).toContain('Plan: Zona 2-3');
  });
  it('en casa no pone salida y sin plan no pone plan', () => {
    const m = mensajePartido({ ...partido, casa: true, plan: undefined }, 'Senior A');
    expect(m).not.toContain('Salida');
    expect(m).not.toContain('Plan');
  });
  it('la hoja escapa el texto', () => {
    expect(hojaPlan({ ...partido, plan: '<b>x</b>' }, 'A')).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
