import { describe, expect, it } from 'vitest';
import { ESPACIOS_BASE } from '../sistemas/espacios';
import ejemplosJson from '../../docs/conocimiento/ejemplos.json';
import { validarEjercicio } from './ejercicioIA';

const ejemplos: { nombre: string }[] = ejemplosJson;

describe('ejercicios de ejemplo del conocimiento de baloncesto', () => {
  it('hay entre 15 y 25', () => {
    expect(ejemplos.length).toBeGreaterThanOrEqual(15);
    expect(ejemplos.length).toBeLessThanOrEqual(25);
  });
  for (const e of ejemplos) {
    it(`${e.nombre} pasa el validador (con y sin espacios)`, () => {
      for (const esp of [undefined, ESPACIOS_BASE]) {
        const r = validarEjercicio(JSON.stringify(e), 'mio-1', esp);
        if (!r.ok) throw new Error(r.motivo);
      }
    });
  }
});
