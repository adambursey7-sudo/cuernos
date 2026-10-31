import { describe, expect, it } from 'vitest';
import { disponibles, guardarJugadora, juntarDiario, sinSalud, limpiar, nuevaJugadora, nuevoEquipo, plantilla, quitarEquipo, repetida } from './diario';
import { leerLinea, leerTexto } from './importar';

describe('diario', () => {
  const e = nuevoEquipo('Cadete femenino');
  const base = { equipos: [e], jugadoras: [] as ReturnType<typeof nuevaJugadora>[] };

  it('ordena la plantilla por dorsal y deja los sin número al final', () => {
    let d = base;
    for (const n of ['11', '4', '', '7']) d = guardarJugadora(d, nuevaJugadora(e.id, { numero: n, nombre: `J${n}` }));
    expect(plantilla(d, e.id).map((j) => j.numero)).toEqual(['4', '7', '11', '']);
  });

  it('avisa del dorsal repetido solo dentro del mismo equipo', () => {
    const a = nuevaJugadora(e.id, { numero: '4' });
    const d = guardarJugadora(base, a);
    expect(repetida(d, nuevaJugadora(e.id, { numero: '4' }))).toBeTruthy();
    expect(repetida(d, nuevaJugadora('otro', { numero: '4' }))).toBeUndefined();
    expect(repetida(d, a)).toBeUndefined();
  });

  it('borrar un equipo borra sus jugadoras y limpiar descarta lo roto', () => {
    const d = guardarJugadora(base, nuevaJugadora(e.id, { numero: '1' }));
    expect(quitarEquipo(d, e.id)).toEqual({ equipos: [], jugadoras: [] });
    expect(limpiar({ equipos: [e], jugadoras: [{ id: 1 }, nuevaJugadora('fantasma')] }).jugadoras).toEqual([]);
    expect(limpiar(null)).toEqual({ equipos: [], jugadoras: [] });
  });

  it('al juntar con una copia gana la copia', () => {
    const j = nuevaJugadora(e.id, { nombre: 'Viejo' });
    const r = juntarDiario(guardarJugadora(base, j), guardarJugadora(base, { ...j, nombre: 'Nuevo' }));
    expect(r.jugadoras.map((x) => x.nombre)).toEqual(['Nuevo']);
  });
});

describe('importar plantilla', () => {
  it('lee el dorsal al principio, al final o con #', () => {
    expect(leerLinea('4 Ejemplo Uno Base')).toEqual({ numero: '4', nombre: 'Ejemplo Uno', posicion: 'Base' });
    expect(leerLinea('Ejemplo Dos 7')).toEqual({ numero: '7', nombre: 'Ejemplo Dos', posicion: '' });
    expect(leerLinea('#11 - Ejemplo Tres - Pívot')).toEqual({ numero: '11', nombre: 'Ejemplo Tres', posicion: 'Pívot' });
  });

  it('lee filas separadas por punto y coma, tabulador o coma', () => {
    expect(leerLinea('13 ; Ejemplo Cuatro ; Escolta')).toEqual({ numero: '13', nombre: 'Ejemplo Cuatro', posicion: 'Escolta' });
    expect(leerLinea('Ejemplo Cinco,9,Ala-pívot')).toEqual({ numero: '9', nombre: 'Ejemplo Cinco', posicion: 'Ala-pívot' });
  });

  it('acepta dorsal y nombre juntos en una celda', () => {
    expect(leerLinea('11 Ejemplo Tres ; Pívot')).toEqual({ numero: '11', nombre: 'Ejemplo Tres', posicion: 'Pívot' });
  });

  it('distingue ala-pívot de pívot', () => {
    expect(leerLinea('9 Ejemplo Seis ala pivot')?.posicion).toBe('Ala-pívot');
  });

  it('salta cabeceras, líneas sin dorsal y repetidas', () => {
    const r = leerTexto('Dorsal ; Nombre ; Posición\n4 Ejemplo Uno\nsolo texto\n4 Ejemplo Uno\n\n7 Ejemplo Dos');
    expect(r.map((c) => c.numero)).toEqual(['4', '7']);
  });

  it('las lesiones no salen en la copia por defecto y se conservan al restaurar una copia sin ellas', () => {
    const e = nuevoEquipo('Ejemplo');
    const base = { equipos: [e], jugadoras: [] as ReturnType<typeof nuevaJugadora>[] };
    const j = nuevaJugadora(e.id, { numero: '5', lesion: { desde: '2026-10-30', nota: 'Tobillo' } });
    const d = guardarJugadora(base, j);
    expect(sinSalud(d).jugadoras[0].lesion).toBeUndefined();
    expect(juntarDiario(d, sinSalud(d)).jugadoras[0].lesion?.nota).toBe('Tobillo');
    expect(disponibles([j, nuevaJugadora(e.id)])).toBe(1);
    expect(limpiar({ equipos: [e], jugadoras: [{ ...j, lesion: { desde: 3 } }] }).jugadoras).toHaveLength(0);
  });
});

