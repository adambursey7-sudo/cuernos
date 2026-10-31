import { describe, expect, it } from 'vitest';
import { disponibles, estaFuera, guardarJugadora, juntarDiario, sinSalud, limpiar, nuevaJugadora, nuevoEquipo, plantilla, quitarEquipo, repetida } from './diario';
import { leerLinea, leerTexto } from './importar';
import { esSenior, palabras } from './tipo';

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

  it('la rotación del equipo se conserva con sus jugadoras y descarta a las que ya no están', () => {
    const e = nuevoEquipo('Ejemplo');
    const j = nuevaJugadora(e.id, { numero: '5' });
    const rotacion = [[j.id, 'fantasma'], [], [j.id], []];
    const d = limpiar({ equipos: [{ ...e, rotacion }], jugadoras: [j] });
    expect(d.equipos[0].rotacion).toEqual([[j.id], [], [j.id], []]);
    expect(limpiar({ equipos: [{ ...e, rotacion: 'rota' }], jugadoras: [j] }).equipos[0].rotacion).toBeUndefined();
    expect(juntarDiario(d, { equipos: [e], jugadoras: [j] }).equipos[0].rotacion).toEqual(d.equipos[0].rotacion);
  });

  it('al restaurar una copia sin habilidades se conservan las de este móvil, y si la copia las trae gana la copia', () => {
    const propias = [{ id: 'tiro', nombre: 'Tiro exterior', estado: 'trabajar' as const, como: '' }];
    const mio = { ...nuevoEquipo('Ejemplo'), habilidades: propias };
    const { habilidades: _sin, ...sinHabilidades } = mio;
    expect(juntarDiario({ equipos: [mio], jugadoras: [] }, { equipos: [sinHabilidades], jugadoras: [] }).equipos[0].habilidades).toEqual(propias);
    const otras = [{ id: 'pase', nombre: 'Pase', estado: 'fuerte' as const, como: '' }];
    expect(juntarDiario({ equipos: [mio], jugadoras: [] }, { equipos: [{ ...mio, habilidades: otras }], jugadoras: [] }).equipos[0].habilidades).toEqual(otras);
  });

  describe('equipo senior', () => {
    it('un equipo nuevo es de formación y no guarda el tipo; el senior sí', () => {
      expect(nuevoEquipo('Ejemplo').tipo).toBeUndefined();
      expect('tipo' in nuevoEquipo('Ejemplo', 'formacion')).toBe(false);
      expect(nuevoEquipo('Senior A', 'senior').tipo).toBe('senior');
    });

    it('limpiar conserva el tipo senior y descarta valores raros; los equipos viejos siguen valiendo', () => {
      const s = nuevoEquipo('Senior A', 'senior');
      expect(limpiar({ equipos: [s], jugadoras: [] }).equipos[0].tipo).toBe('senior');
      expect(limpiar({ equipos: [{ ...s, tipo: 'otro' }], jugadoras: [] }).equipos[0].tipo).toBeUndefined();
      const viejo = { id: 'e1', nombre: 'Cadete femenino', forma: '', virtudes: '', trabajar: '', como: '' };
      expect(limpiar({ equipos: [viejo], jugadoras: [] }).equipos).toEqual([viejo]);
    });

    it('las palabras cambian solo en senior', () => {
      expect(esSenior(nuevoEquipo('Ejemplo'))).toBe(false);
      expect(esSenior(nuevoEquipo('Senior A', 'senior'))).toBe(true);
      expect(palabras(nuevoEquipo('Ejemplo')).jugadoras).toBe('jugadoras');
      expect(palabras(nuevoEquipo('Senior A', 'senior')).jugadoras).toBe('jugadores');
      expect(palabras(undefined).Jugadora).toBe('Jugadora');
    });

    it('el rol solo vale si es titular, rotación o especialista', () => {
      const s = nuevoEquipo('Senior A', 'senior');
      const ok = nuevaJugadora(s.id, { rol: 'titular' });
      const raro = { ...nuevaJugadora(s.id), rol: 'capitan' };
      const d = limpiar({ equipos: [s], jugadoras: [ok, raro] });
      expect(d.jugadoras.map((j) => j.rol)).toEqual(['titular']);
    });

    it('en duda cuenta como disponible; lesionado, no; y la copia sin salud no lleva ninguno de los dos', () => {
      const s = nuevoEquipo('Senior A', 'senior');
      const duda = nuevaJugadora(s.id, { lesion: { desde: '2026-10-01', nota: '', duda: true } });
      const baja = nuevaJugadora(s.id, { lesion: { desde: '2026-10-01', nota: '' } });
      const sana = nuevaJugadora(s.id, { rol: 'rotacion' });
      expect([estaFuera(duda), estaFuera(baja), estaFuera(sana)]).toEqual([false, true, false]);
      expect(disponibles([duda, baja, sana])).toBe(2);
      const limpio = sinSalud({ equipos: [s], jugadoras: [duda, baja, sana] });
      expect(limpio.jugadoras.every((j) => !j.lesion)).toBe(true);
      expect(limpio.jugadoras.find((j) => j.id === sana.id)?.rol).toBe('rotacion');
    });

    it('una copia sin tipo no cambia el equipo de este móvil, y si la copia trae senior gana la copia', () => {
      const mio = nuevoEquipo('Senior A', 'senior');
      const { tipo: _t, ...sinTipo } = mio;
      expect(juntarDiario({ equipos: [mio], jugadoras: [] }, { equipos: [sinTipo], jugadoras: [] }).equipos[0].tipo).toBe('senior');
    });
  });
});
