import { beforeEach, describe, expect, it } from 'vitest';
import { coincide, coleccionesDe, etiquetasDeTexto, filtrarOrganizables } from './organizar';
import { fichaDeBloque, guardarFichas, idBloqueFicha, limpiarFichas, nuevaFicha } from './fichas';
import { limpiarRecursos, nuevoRecurso } from './recursos';
import { tituloBloque } from '../sesiones/sesiones';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
};

describe('organizar recursos y fichas', () => {
  beforeEach(memoria);

  it('busca sin mirar tildes ni mayúsculas y con todas las palabras', () => {
    expect(coincide('DEFENSA bote', ['Ejercicio de defensa', 'y bote'])).toBe(true);
    expect(coincide('transicion', ['Transición rápida'])).toBe(true);
    expect(coincide('tiro defensa', ['Tiro libre'])).toBe(false);
    expect(coincide('  ', ['lo que sea'])).toBe(true);
  });

  it('limpia etiquetas repetidas y vacías', () => {
    expect(etiquetasDeTexto('Tiro, tiro ,, 1x1')).toEqual(['Tiro', '1x1']);
  });

  it('filtra por colección, favorito, texto y etiqueta', () => {
    const a = { ...nuevoRecurso({ titulo: 'Rueda de pases' }), coleccion: 'Calentamientos', favorito: true, etiquetas: ['pase'] };
    const b = { ...nuevoRecurso({ titulo: 'Tiro en carrera' }), coleccion: 'Tiro', etiquetas: [] };
    const lista = [a, b];
    const t = (x: typeof a) => [x.titulo, x.nota];
    expect(filtrarOrganizables(lista, { texto: '', soloFavoritos: true }, t)).toEqual([a]);
    expect(filtrarOrganizables(lista, { texto: '', soloFavoritos: false, coleccion: 'Tiro' }, t)).toEqual([b]);
    expect(filtrarOrganizables(lista, { texto: 'pase', soloFavoritos: false }, t)).toEqual([a]);
    expect(coleccionesDe(lista)).toEqual(['Calentamientos', 'Tiro']);
  });

  it('los datos viejos sin colección ni favorito se leen con valores por defecto', () => {
    const [r] = limpiarRecursos([{ id: 'r1', enlace: '', titulo: 'Viejo', nota: '', etiquetas: ['a'], estado: 'nuevo', fecha: '2026-10-01', origen: 'nota' }]);
    expect(r.coleccion).toBe('');
    expect(r.favorito).toBe(false);
    const [f] = limpiarFichas([{ ...nuevaFicha(), nombre: 'Viejo', coleccion: undefined, etiquetas: undefined }]);
    expect(f.coleccion).toBe('');
    expect(f.etiquetas).toEqual([]);
    expect(f.favorita).toBe(false);
  });

  it('una ficha se puede meter en una sesión y se reconoce por su bloque', () => {
    const f = { ...nuevaFicha(), nombre: 'Rueda de pases' };
    guardarFichas([f]);
    expect(fichaDeBloque(idBloqueFicha(f))?.nombre).toBe('Rueda de pases');
    expect(tituloBloque(idBloqueFicha(f))).toBe('Rueda de pases');
    expect(tituloBloque('ficha~no-existe')).toBeUndefined();
  });
});
