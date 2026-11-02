import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { armarCopia } from '../copia';
import { PALETAS } from '../temas';
import { arrancar, nuevoVivo, registrar, type Partido } from '../partido/vivo';
import { nuevoEvento } from '../temporada/temporada';
import { celda, csv, csvEstadistica, csvPartidos, csvPlantilla, hojaEstadistica } from '../exportar/exportar';
import { CLAVE_CONEXIONES, claveValida, enmascarar, guardarConexiones, leerConexiones, MODELO_GEMINI } from './ajustes';
import { ErrorIA, preguntar, preguntarGemini, proveedorActivo, textoDeGemini } from './ia';
import { limpiarMensaje, nombresQueColan, prepararEnvio, promptFamilias } from './redactar';

const CLAVE_BUENA = 'AIzaSyEjemploDeClaveFalsa_1234567890';
let datos: Map<string, string>;
beforeEach(() => {
  datos = new Map();
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => datos.get(k) ?? null, setItem: (k: string, v: string) => void datos.set(k, v), removeItem: (k: string) => void datos.delete(k) };
});
afterEach(() => vi.unstubAllGlobals());

describe('ajustes de conexión', () => {
  it('guarda la clave solo si está bien escrita y rellena el modelo', () => {
    expect(claveValida(CLAVE_BUENA)).toBe(true);
    expect(claveValida('corta')).toBe(false);
    expect(claveValida('con espacios dentro de la clave 123')).toBe(false);
    expect(guardarConexiones({ gemini: { clave: 'mala', modelo: '' } })).toBe(true);
    expect(datos.has(CLAVE_CONEXIONES)).toBe(false);
    guardarConexiones({ proveedor: 'gemini', gemini: { clave: ` ${CLAVE_BUENA} `, modelo: 'no valido!!' } });
    expect(leerConexiones()).toEqual({ proveedor: 'gemini', gemini: { clave: CLAVE_BUENA, modelo: MODELO_GEMINI } });
  });
  it('lo estropeado se lee como vacío y la clave se enseña enmascarada', () => {
    datos.set(CLAVE_CONEXIONES, '{no es json');
    expect(leerConexiones()).toEqual({});
    expect(enmascarar(CLAVE_BUENA)).not.toContain('EjemploDeClave');
  });
  it('la clave nunca va en la copia de seguridad', () => {
    guardarConexiones({ gemini: { clave: CLAVE_BUENA, modelo: MODELO_GEMINI } });
    const texto = armarCopia([], PALETAS[0]);
    expect(texto).not.toContain(CLAVE_BUENA);
    expect(texto).not.toContain(CLAVE_CONEXIONES);
  });
  it('solo el fichero de ajustes conoce la clave del almacén', () => {
    const fuentes = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const fuera = Object.entries(fuentes).filter(([ruta, t]) => !/\.test\./.test(ruta) && !/(^|\/)ajustes\.ts$/.test(ruta) && t.includes('horns.conexiones')).map(([r]) => r);
    expect(fuera).toEqual([]);
  });
});

describe('quién contesta', () => {
  const g = { gemini: { clave: CLAVE_BUENA, modelo: MODELO_GEMINI } };
  it('respeta la elección y, si no hay, usa lo que esté configurado', () => {
    expect(proveedorActivo({}, false)).toBeUndefined();
    expect(proveedorActivo(g, false)).toBe('gemini');
    expect(proveedorActivo({}, true)).toBe('jarvis');
    expect(proveedorActivo({ ...g, proveedor: 'gemini' }, true)).toBe('gemini');
    expect(proveedorActivo({ ...g, proveedor: 'jarvis' }, false)).toBe('gemini');
  });
  it('sin nada configurado dice qué hacer', async () => {
    await expect(preguntar('hola')).rejects.toThrow(/Conexiones/);
  });
});

describe('Gemini', () => {
  it('lee el texto de la respuesta', () => {
    expect(textoDeGemini({ candidates: [{ content: { parts: [{ text: 'Hola ' }, { text: 'familias' }] } }] })).toBe('Hola familias');
    expect(textoDeGemini({})).toBe('');
    expect(textoDeGemini(null)).toBe('');
  });
  it('manda la clave en la cabecera, no en la dirección, y sin cookies', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }), { status: 200 }));
    vi.stubGlobal('fetch', f);
    expect(await preguntarGemini(CLAVE_BUENA, MODELO_GEMINI, 'hola')).toBe('ok');
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain(CLAVE_BUENA);
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(CLAVE_BUENA);
    expect(init.credentials).toBe('omit');
  });
  it('explica los fallos: clave mala, cupo, red caída y sin conexión', async () => {
    for (const [estado, texto] of [[403, /clave/], [429, /cupo/], [500, /no pudo/]] as const) {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: estado })));
      await expect(preguntarGemini(CLAVE_BUENA, MODELO_GEMINI, 'x')).rejects.toThrow(texto);
    }
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network'); }));
    await expect(preguntarGemini(CLAVE_BUENA, MODELO_GEMINI, 'x')).rejects.toBeInstanceOf(ErrorIA);
    vi.stubGlobal('navigator', { onLine: false });
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await expect(preguntarGemini(CLAVE_BUENA, MODELO_GEMINI, 'x')).rejects.toThrow(/conexión/);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('mensajes para familias', () => {
  const plantilla = [{ nombre: 'Jugador Uno', numero: '7' }, { nombre: 'Jugador Dos', numero: '10' }];
  it('lo que se envía lleva dorsales, no nombres', () => {
    const r = prepararEnvio('Jugador Uno metió 12 puntos. Jugador Dos, 8.', 'Felicitar a Jugador Uno', plantilla);
    const prompt = promptFamilias(r.hechos, r.peticion);
    expect(prompt).not.toMatch(/Jugador (Uno|Dos)/);
    expect(prompt).toContain('#7');
    expect(r.cambios).toBe(3);
  });
  it('avisa si la respuesta trae un nombre', () => {
    const distintos = [{ nombre: 'Alfa Uno' }, { nombre: 'Beta Dos' }];
    expect(nombresQueColan('Muy bien Beta Dos, y #7 también', distintos)).toEqual(['Beta Dos']);
    expect(nombresQueColan('Muy bien #10', distintos)).toEqual([]);
    expect(limpiarMensaje('```\n"Hola familias"\n```')).toBe('Hola familias');
  });
});

describe('exportar', () => {
  it('las celdas no se toman por fórmulas y llevan comillas si hace falta', () => {
    expect(celda('=SUMA(A1)')).toBe("'=SUMA(A1)");
    expect(celda('-3')).toBe('-3');
    expect(celda('a;b')).toBe('"a;b"');
    expect(celda('di "hola"')).toBe('"di ""hola"""');
    expect(celda(undefined)).toBe('');
    expect(csv([['a', 1]]).startsWith('﻿')).toBe(true);
  });
  const partido = (): Partido => {
    let p: Partido = { directo: {}, rival: 0, vivo: arrancar(nuevoVivo(['a', 'b', 'c', 'd', 'e']), 0) };
    p = registrar(p, { tipo: 'c2', j: 'a' }, 30_000);
    p = registrar(p, { tipo: 'reb', j: 'b' }, 40_000);
    return p;
  };
  it('el CSV de partidos y el de estadística llevan dorsales y ningún nombre', () => {
    const p = partido();
    const e = { ...nuevoEvento('2026-11-08', 'partido'), titulo: '=Ejemplo CB', resultado: { a: 50, c: 40 }, vivo: p.vivo, directo: p.directo };
    const partidos = csvPartidos([e]);
    expect(partidos).toContain("'=Ejemplo CB");
    expect(partidos).toContain('Ganado');
    const est = csvEstadistica(e, { a: '7', b: '10' });
    expect(est).toContain('7;');
    expect(est.split('\r\n')[1].startsWith('7;') || est.split('\r\n')[2].startsWith('7;')).toBe(true);
    expect(csvEstadistica(nuevoEvento('2026-11-08', 'partido'), {})).toContain('no se apuntó');
  });
  it('la plantilla exportada no lleva nombres ni salud y la hoja escapa el HTML', () => {
    const c = csvPlantilla([{ numero: '10', posicion: 'Base', rol: 'titular' }, { numero: '4', posicion: '' }]);
    expect(c.split('\r\n')[1]).toBe('4;;');
    const e = { ...nuevoEvento('2026-11-08', 'partido'), titulo: '<script>x</script>' };
    expect(hojaEstadistica(e, 'Equipo', {})).not.toContain('<script>');
  });
});
