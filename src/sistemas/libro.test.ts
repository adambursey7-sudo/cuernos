import { beforeEach, describe, expect, it } from 'vitest';
import { alternarSemana, leerSemana, semanaVigente } from './libro';
import { todosLosSistemas } from './almacen';
import { FAMILIAS } from './tipos';

beforeEach(() => {
  const d = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => void d.set(k, v), removeItem: (k: string) => void d.delete(k) };
});

describe('libro de jugadas', () => {
  it('pone y quita jugadas de esta semana y las recuerda', () => {
    let l = alternarSemana(leerSemana(), 'motion');
    l = alternarSemana(l, 'zona-2-3');
    expect(leerSemana()).toEqual(['motion', 'zona-2-3']);
    l = alternarSemana(l, 'motion');
    expect(leerSemana()).toEqual(['zona-2-3']);
  });
  it('olvida las que ya no existen', () => {
    expect(semanaVigente(['a', 'b'], new Set(['b']))).toEqual(['b']);
  });
  it('la biblioteca senior no repite ids y cada familia es conocida', () => {
    const l = todosLosSistemas();
    expect(new Set(l.map((s) => s.id)).size).toBe(l.length);
    for (const s of l.filter((x) => x.familia)) expect(FAMILIAS.some((f) => f.id === s.familia)).toBe(true);
    expect(l.filter((s) => s.familia === 'defensa').every((s) => s.tipo === 'defensa')).toBe(true);
  });
});
