import { describe, expect, it } from 'vitest';
import { armarCopia, juntar, leerCopia } from './copia';
import { nuevoBorrador, mover } from './editor/editar';
import { nuevaSesion, juntarSesiones } from './sesiones/sesiones';
import { ESPACIOS_BASE } from './sistemas/espacios';
import { PALETAS } from './temas';
import { nuevaJugadora, nuevoEquipo } from './diario/diario';
import { guardarEvento, guardarFijo, nuevaTemporada, nuevoEvento, nuevoFijo } from './temporada/temporada';

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
    expect(() => leerCopia('hola')).toThrow('no es una copia de Horns');
    expect(() => leerCopia('{"app":"otra"}')).toThrow('no es una copia de Horns');
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

describe('copia con diario', () => {
  it('guarda y recupera la plantilla, y descarta lo roto', () => {
    const e = nuevoEquipo('Cadete');
    const diario = { equipos: [e], jugadoras: [nuevaJugadora(e.id, { numero: '4', nombre: 'Ejemplo' })] };
    const r = leerCopia(armarCopia([], { principal: '#e8883a', fondo: '#14110e', pista: '#c98f55', jugadores: '#f3ece2' }, diario));
    expect(r.diario?.jugadoras[0].nombre).toBe('Ejemplo');
    expect(leerCopia(JSON.stringify({ app: 'cuernos-copia', mios: [], diario: { equipos: 3 } })).diario).toEqual({ equipos: [], jugadoras: [] });
  });
});

describe('copia con temporada', () => {
  it('guarda y recupera la temporada, y descarta la de un equipo que no está', () => {
    const e = nuevoEquipo('Cadete femenino');
    let t = guardarFijo(nuevaTemporada(e.id, '2026-09-01', '2027-06-30'), nuevoFijo(0));
    t = guardarEvento(t, { ...nuevoEvento('2026-10-17', 'partido'), titulo: 'Ejemplo CB' });
    const huerfana = nuevaTemporada('otro', '2026-09-01', '2027-06-30');
    const r = leerCopia(armarCopia([], PALETAS[0], { equipos: [e], jugadoras: [] }, [t, huerfana]));
    expect(r.temporadas).toEqual([t]);
  });
  it('una copia antigua sin temporada sigue valiendo', () => {
    expect(leerCopia(armarCopia([], PALETAS[0])).temporadas).toBeUndefined();
  });
});

describe('copia con sesiones, espacios y favoritos', () => {
  it('las sesiones, los espacios y los favoritos vuelven al cargar', () => {
    const ses = nuevaSesion('Cadete femenino');
    const espacios = ESPACIOS_BASE.map((e) => ({ ...e, nombre: e.id === ESPACIOS_BASE[0].id ? 'Mi esquina' : e.nombre }));
    const leida = leerCopia(armarCopia([], PALETAS[1], undefined, undefined, undefined, undefined, false, undefined, undefined, [ses], espacios, ['j:a', 'e:b']));
    expect(leida.sesiones).toEqual([ses]);
    expect(leida.espacios?.[0].nombre).toBe('Mi esquina');
    expect(leida.favoritos).toEqual(['j:a', 'e:b']);
  });

  it('una copia antigua sin esos datos sigue valiendo', () => {
    const leida = leerCopia(armarCopia([], PALETAS[1]));
    expect(leida.sesiones).toBeUndefined();
    expect(leida.espacios).toBeUndefined();
    expect(leida.favoritos).toBeUndefined();
  });

  it('las sesiones rotas se ignoran y las demás se juntan sin duplicar', () => {
    const a = nuevaSesion('Cadete femenino');
    const b = { ...a, nombre: 'Cambiada' };
    const texto = JSON.stringify({ app: 'cuernos-copia', mios: [], sesiones: [{ id: 'x' }, b] });
    const leida = leerCopia(texto);
    expect(leida.sesiones).toEqual([b]);
    expect(juntarSesiones([a], leida.sesiones!).map((x) => x.nombre)).toEqual(['Cambiada']);
  });
});
