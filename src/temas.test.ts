import { describe, expect, it } from 'vitest';
import { contraste, FONDO_CLARO, PALETAS, paraClaro, textoSobre } from './temas';

describe('colores', () => {
  it('sobre fondos oscuros el texto es claro y sobre claros, oscuro', () => {
    expect(textoSobre('#1e2a44')).toBe('#fff8ee');
    expect(textoSobre('#f2d35b')).toBe('#141a26');
    expect(textoSobre('#ffffff')).toBe('#141a26');
  });

  it('Parqué es la primera paleta (la de inicio)', () => {
    expect(PALETAS[0].id).toBe('parque');
  });

  it('en claro, el color del equipo se oscurece hasta que el texto se lee (4,5) y el fondo es claro', () => {
    for (const p of PALETAS) {
      const c = paraClaro(p);
      expect(c.fondo).toBe(FONDO_CLARO);
      expect(contraste(c.principal, FONDO_CLARO)).toBeGreaterThanOrEqual(4.5);
      expect(c.pista).toBe(p.pista);
    }
  });

  it('un color que ya se lee no se toca', () => {
    expect(paraClaro({ principal: '#1e2a44', fondo: '#000000', pista: '#d9a066', jugadores: '#1e2a44' }).principal).toBe('#1e2a44');
  });

  it('el contraste del blanco con el negro es 21', () => {
    expect(Math.round(contraste('#ffffff', '#000000'))).toBe(21);
  });
});
