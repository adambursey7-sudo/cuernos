import { describe, expect, it } from 'vitest';
import { PALETAS, textoSobre } from './temas';

describe('colores', () => {
  it('sobre fondos oscuros el texto es claro y sobre claros, oscuro', () => {
    expect(textoSobre('#1e2a44')).toBe('#fff8ee');
    expect(textoSobre('#f2d35b')).toBe('#141a26');
    expect(textoSobre('#ffffff')).toBe('#141a26');
  });

  it('Parqué es la primera paleta (la de inicio)', () => {
    expect(PALETAS[0].id).toBe('parque');
  });
});
