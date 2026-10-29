import { describe, expect, it } from 'vitest';
import { armarCopia, juntar, leerCopia } from './copia';
import { nuevoBorrador, mover } from './editor/editar';
import { PALETAS } from './temas';

const jugada = () => {
  const b = nuevoBorrador();
  b.pasos = [mover({ texto: '', movimientos: [] }, '1', 'bote', [70, 90])];
  return b;
};

describe('copia de seguridad', () => {
  it('lo que se descarga se puede volver a cargar igual', () => {
    const j = jugada();
    const leida = leerCopia(armarCopia([j], PALETAS[1]));
    expect(leida.mios).toEqual([j]);
    expect(leida.colores?.principal).toBe(PALETAS[1].principal);
  });

  it('un archivo cualquiera da un aviso claro', () => {
    expect(() => leerCopia('hola')).toThrow('no es una copia de Cuernos');
    expect(() => leerCopia('{"app":"otra"}')).toThrow('no es una copia de Cuernos');
  });

  it('las jugadas rotas de una copia se ignoran', () => {
    const texto = JSON.stringify({ app: 'cuernos-copia', version: 1, mios: [{ id: 'x' }, jugada()] });
    expect(leerCopia(texto).mios.length).toBe(1);
  });

  it('al cargar, la jugada de la copia sustituye a la que tenga el mismo id', () => {
    const a = jugada();
    const b = { ...a, nombre: 'Cambiada' };
    const otra = jugada();
    expect(juntar([a, otra], [b]).map((s) => s.nombre)).toEqual(['Mi jugada', 'Cambiada']);
  });
});
