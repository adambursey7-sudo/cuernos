import { describe, expect, it } from 'vitest';
import { SISTEMAS } from '../sistemas/datos';
import { defensa, foto, inicios } from './animar';

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

  it('al empezar, cada defensor está entre su atacante y la canasta', () => {
    const canasta = (p: number[]) => Math.hypot(p[0] - 75, p[1] - 12);
    for (const s of SISTEMAS) {
      const ataque = foto(s, 0).jugadores;
      const d = defensa(s, 0);
      for (const j of ['1', '2', '3', '4', '5'] as const) expect(canasta(d[j])).toBeLessThan(canasta(ataque[j]));
    }
  });

  it('ningún defensor se despega de su atacante (como mucho 3 m, al perderlo en un corte)', () => {
    for (const s of SISTEMAS)
      for (let t = 0; t <= s.pasos.length; t += 0.1) {
        const ataque = foto(s, t).jugadores;
        const d = defensa(s, t);
        for (const j of ['1', '2', '3', '4', '5'] as const)
          expect(Math.hypot(d[j][0] - ataque[j][0], d[j][1] - ataque[j][1])).toBeLessThan(30);
      }
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
