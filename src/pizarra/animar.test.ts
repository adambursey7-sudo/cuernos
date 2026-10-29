import { describe, expect, it } from 'vitest';
import { SISTEMAS } from '../sistemas/datos';
import { foto, inicios } from './animar';

const cuernos = SISTEMAS.find((s) => s.id === 'cuernos')!;
const cflex = SISTEMAS.find((s) => s.id === 'cuernos-flex')!;

describe('pizarra', () => {
  it('al empezar todos están en su sitio y el balón lo tiene el base', () => {
    const f = foto(cuernos, 0);
    expect(f.jugadores['4']).toEqual(cuernos.inicio['4']);
    expect(f.balon).toEqual(cuernos.inicio['1']);
  });

  it('al acabar cada paso el jugador llega a su destino', () => {
    const f = foto(cuernos, 2);
    expect(f.jugadores['5']).toEqual([87, 87]);
  });

  it('el pase lleva el balón al que recibe', () => {
    const f = foto(cflex, 1);
    expect(f.balon).toEqual(cflex.inicio['4']);
    expect(inicios(cflex)[3].balon).toBe('1');
  });

  it('todos los puntos quedan dentro de la media pista', () => {
    for (const s of SISTEMAS)
      for (const m of inicios(s))
        for (const [x, y] of Object.values(m.pos)) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(150);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(140);
        }
  });
});
