import { describe, expect, it } from 'vitest';
import { enlaceDeBusqueda } from './enlaceEntrante';

describe('enlaceDeBusqueda', () => {
  it('lee el enlace codificado del atajo', () => {
    const e = encodeURIComponent('https://www.instagram.com/reel/ABC123/?igsh=xyz');
    expect(enlaceDeBusqueda(`?enlace=${e}`)).toBe('https://www.instagram.com/reel/ABC123/?igsh=xyz');
  });
  it('también si no está codificado', () => {
    expect(enlaceDeBusqueda('?enlace=https://www.instagram.com/reel/ABC123/')).toBe('https://www.instagram.com/reel/ABC123/');
  });
  it('saca el enlace de una frase compartida', () => {
    expect(enlaceDeBusqueda('?text=' + encodeURIComponent('Mira esto https://youtu.be/abc123'))).toBe('https://youtu.be/abc123');
  });
  it('acepta url y text', () => {
    expect(enlaceDeBusqueda('?url=https%3A%2F%2Fyoutu.be%2Fabc')).toBe('https://youtu.be/abc');
  });
  it('ignora lo que no es un enlace web', () => {
    expect(enlaceDeBusqueda('?enlace=javascript:alert(1)')).toBeUndefined();
    expect(enlaceDeBusqueda('')).toBeUndefined();
  });
});
