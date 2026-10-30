import { describe, expect, it } from 'vitest';
import { alternarFavorito, coincide, leerFavoritos } from './favoritos';

describe('favoritos', () => {
  it('pone y quita un id sin tocar los demás', () => {
    const a = alternarFavorito([], 'j:uno');
    expect(alternarFavorito(a, 'e:dos')).toEqual(['j:uno', 'e:dos']);
    expect(alternarFavorito(['j:uno', 'e:dos'], 'j:uno')).toEqual(['e:dos']);
  });
  it('lee una lista vacía si no hay nada guardado', () => {
    expect(leerFavoritos()).toEqual([]);
  });
});

describe('coincide', () => {
  it('ignora acentos y mayúsculas', () => {
    expect(coincide('junior', 'Para Júnior')).toBe(true);
    expect(coincide('  ', 'lo que sea')).toBe(true);
    expect(coincide('zona', 'Defensa individual')).toBe(false);
  });
});
