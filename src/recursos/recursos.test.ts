import { beforeEach, describe, expect, it } from 'vitest';
import { armarCopia, leerCopia } from '../copia';
import { enlaceValido, guardarRecursos, idYoutube, juntarRecursos, leerRecursos, limpiarRecursos, nuevoRecurso, origenDe, primerEnlace } from './recursos';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
};

describe('enlaces', () => {
  it('solo acepta http y https', () => {
    expect(enlaceValido('https://ejemplo.com/a?b=1')).toBe('https://ejemplo.com/a?b=1');
    expect(enlaceValido('ejemplo.com/juego')).toBe('https://ejemplo.com/juego');
    for (const malo of ['javascript:alert(1)', 'data:text/html,hola', 'file:///c:/x', 'ftp://a.com/x', 'hola', 'a b.com', '']) expect(enlaceValido(malo)).toBeUndefined();
  });

  it('saca el enlace de un texto compartido', () => {
    expect(primerEnlace('Mira este ejercicio https://youtu.be/abcdefghijk gracias')).toBe('https://youtu.be/abcdefghijk');
    expect(primerEnlace('sin enlace aquí')).toBeUndefined();
  });

  it('detecta el origen y el vídeo de YouTube', () => {
    expect(origenDe('https://www.youtube.com/watch?v=abcdefghijk')).toBe('youtube');
    expect(origenDe('https://www.instagram.com/reel/xyz/')).toBe('instagram');
    expect(origenDe('https://vm.tiktok.com/xyz')).toBe('tiktok');
    expect(origenDe('https://youtube.com.malo.com/x')).toBe('web');
    expect(idYoutube('https://youtu.be/abcdefghijk?t=3')).toBe('abcdefghijk');
    expect(idYoutube('https://www.youtube.com/shorts/abcdefghijk')).toBe('abcdefghijk');
    expect(idYoutube('https://www.youtube.com/watch?v=<script>')).toBeUndefined();
  });
});

describe('recursos', () => {
  beforeEach(memoria);

  it('crea con miniatura solo en YouTube y como nota si no hay enlace', () => {
    const yt = nuevoRecurso({ enlace: 'https://youtu.be/abcdefghijk' });
    expect(yt.origen).toBe('youtube');
    expect(yt.miniatura).toContain('abcdefghijk');
    expect(nuevoRecurso({ enlace: 'https://ejemplo.com' }).miniatura).toBeUndefined();
    const nota = nuevoRecurso({ titulo: 'Ayuda defensiva' });
    expect(nota.origen).toBe('nota');
    expect(nota.estado).toBe('nuevo');
  });

  it('limpia lo que viene mal y no repite ids', () => {
    const bueno = nuevoRecurso({ titulo: 'Ejemplo Uno', enlace: 'https://ejemplo.com' });
    const lista = limpiarRecursos([bueno, bueno, { id: 'x', enlace: 'javascript:alert(1)', titulo: 'malo' }, { id: 'y', enlace: '', titulo: '', nota: '' }, null, { id: 'z', titulo: 'Nota', estado: 'raro', etiquetas: [1, ' tiro ', 'a'.repeat(99)] }]);
    expect(lista.map((r) => r.id)).toEqual([bueno.id, 'z']);
    expect(lista[1].estado).toBe('nuevo');
    expect(lista[1].etiquetas).toEqual(['tiro', 'a'.repeat(30)]);
  });

  it('guarda y lee; con datos rotos devuelve vacío', () => {
    const r = nuevoRecurso({ titulo: 'Ejemplo Dos', enlace: 'https://ejemplo.com/x' });
    expect(guardarRecursos([r])).toBe(true);
    expect(leerRecursos()).toEqual([r]);
    localStorage.setItem('horns.recursos', 'no es json');
    expect(leerRecursos()).toEqual([]);
  });

  it('al juntar gana la copia', () => {
    const a = nuevoRecurso({ titulo: 'A' });
    const b = { ...a, titulo: 'B' };
    expect(juntarRecursos([a], [b])).toEqual([b]);
  });

  it('entra en la copia de seguridad y las copias viejas siguen valiendo', () => {
    const r = nuevoRecurso({ titulo: 'Ejemplo Tres', enlace: 'https://ejemplo.com' });
    const colores = { principal: '#e8883a', fondo: '#14110e', pista: '#c98f55', jugadores: '#14110e' };
    const copia = leerCopia(armarCopia([], colores, undefined, undefined, [r]));
    expect(copia.recursos).toEqual([r]);
    const vieja = leerCopia(JSON.stringify({ app: 'cuernos-copia', version: 2, mios: [] }));
    expect(vieja.recursos).toBeUndefined();
  });
});
