// Migración: lo que ya tiene Adam (guardado antes de existir los equipos completos) no se pierde, ni al abrir ni al cargar una copia vieja.
import { beforeEach, describe, expect, it } from 'vitest';
import { armarCopia, leerCopia } from '../copia';
import { guardarDiario, juntarDiario, leerDiario } from '../diario/diario';
import { leerFavoritos, alternarFavorito } from '../favoritos';
import { alinearSesiones, guardarSesiones, leerSesiones, sesionesDe } from '../sesiones/sesiones';
import { alternarSemana, leerSemana } from '../sistemas/libro';
import { leerTemporadas } from '../temporada/temporada';
import { PALETAS } from '../temas';
import { leerEquipoActivo, ponerActivoId } from './equipos';
import { copiarListas, leerLista, listasDeEquipo, listasPropias, olvidarListas } from './porEquipo';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    key: (i: number) => [...datos.keys()][i] ?? null,
    get length() { return datos.size; },
  };
  return datos;
};

/** Lo que había guardado antes: equipos y sesiones sin ninguno de los campos nuevos, y una sola lista de estrellas. */
const ANTIGUO = {
  diario: { equipos: [{ id: 'e1', nombre: 'Equipo Uno', forma: 'Rápido', virtudes: '', trabajar: '', como: '' }, { id: 'e2', nombre: 'Equipo Dos', tipo: 'senior', forma: '', virtudes: '', trabajar: '', como: '' }],
    jugadoras: [{ id: 'j1', equipoId: 'e1', nombre: 'Ejemplo Uno', numero: '4', posicion: 'Base', fuertes: '', mejorar: '', forma: '', entrenar: '', notas: [{ fecha: '2026-10-01', texto: 'nota' }] }] },
  sesiones: [{ id: 's1', equipo: 'Equipo Uno', nombre: 'Sesión vieja', duracion: 90, bloques: [] }, { id: 's2', equipo: 'Equipo Dos', nombre: 'Otra', duracion: 60, bloques: [] }],
};

describe('migración de lo que ya había', () => {
  let datos: Map<string, string>;
  beforeEach(() => {
    datos = memoria();
    datos.set('horns.diario', JSON.stringify(ANTIGUO.diario));
    datos.set('horns.sesiones', JSON.stringify(ANTIGUO.sesiones));
    datos.set('horns.favoritos', JSON.stringify(['j:cuernos', 'e:x~1']));
    datos.set('horns.semana', JSON.stringify(['cuernos']));
  });

  it('se abre igual: equipos, jugadora y notas intactos y el primer equipo es el activo', () => {
    const d = leerDiario();
    expect(d.equipos.map((e) => e.nombre)).toEqual(['Equipo Uno', 'Equipo Dos']);
    expect(d.jugadoras[0]).toMatchObject({ nombre: 'Ejemplo Uno', numero: '4', notas: [{ fecha: '2026-10-01', texto: 'nota' }] });
    expect(d.equipos[0].genero).toBeUndefined();
    expect(leerEquipoActivo()?.id).toBe('e1');
    ponerActivoId('e2');
    expect(leerEquipoActivo()?.id).toBe('e2');
    ponerActivoId('borrado');
    expect(leerEquipoActivo()?.id).toBe('e1');
  });

  it('las sesiones viejas ganan el id de su equipo y no se pierde ninguna', () => {
    const d = leerDiario();
    const antes = leerSesiones();
    const despues = alinearSesiones(antes, d.equipos);
    expect(guardarSesiones(despues)).toBe(true);
    const leidas = leerSesiones();
    expect(leidas).toHaveLength(2);
    expect(sesionesDe(leidas, d.equipos[0]).map((s) => s.nombre)).toEqual(['Sesión vieja']);
    expect(sesionesDe(leidas, d.equipos[1]).map((s) => s.nombre)).toEqual(['Otra']);
    expect(leidas.every((s) => !!s.equipoId)).toBe(true);
  });

  it('las estrellas de siempre las ven todos los equipos hasta que uno las toca; entonces las listas se separan', () => {
    ponerActivoId('e1');
    expect(leerFavoritos()).toEqual(['j:cuernos', 'e:x~1']);
    ponerActivoId('e2');
    expect(leerFavoritos()).toEqual(['j:cuernos', 'e:x~1']);
    alternarFavorito(leerFavoritos(), 'j:nueva');
    expect(leerFavoritos()).toEqual(['j:cuernos', 'e:x~1', 'j:nueva']);
    ponerActivoId('e1');
    expect(leerFavoritos()).toEqual(['j:cuernos', 'e:x~1']);
    // La lista de siempre sigue intacta.
    expect(JSON.parse(datos.get('horns.favoritos')!)).toEqual(['j:cuernos', 'e:x~1']);
  });

  it('el libro de la semana también se separa por equipo', () => {
    ponerActivoId('e1');
    alternarSemana(leerSemana(), 'otra');
    ponerActivoId('e2');
    expect(leerSemana()).toEqual(['cuernos']);
    ponerActivoId('e1');
    expect(leerSemana()).toEqual(['cuernos', 'otra']);
  });

  it('sin equipo activo se usa la lista de siempre', () => {
    ponerActivoId('');
    alternarFavorito(leerFavoritos(), 'j:z');
    expect(JSON.parse(datos.get('horns.favoritos')!)).toContain('j:z');
  });

  it('duplicar copia las listas, la copia de un equipo lleva las suyas y borrar las olvida', () => {
    ponerActivoId('e1');
    alternarFavorito(leerFavoritos(), 'j:propia');
    copiarListas('e1', 'e9');
    expect(leerLista('favoritos', 'e9')).toEqual(['j:cuernos', 'e:x~1', 'j:propia']);
    expect(Object.keys(listasPropias('favoritos')).sort()).toEqual(['e1', 'e9']);
    expect(listasDeEquipo('e2').favoritos).toEqual({ e2: ['j:cuernos', 'e:x~1'] });
    olvidarListas('e9');
    expect(Object.keys(listasPropias('favoritos'))).toEqual(['e1']);
  });

  it('una copia antigua (versión 2) se carga sin perder nada de lo que hay ahora', () => {
    // Estado actual: ya con equipo nuevo.
    const actual = leerDiario();
    const conNuevo = { ...actual, equipos: [...actual.equipos, { id: 'e3', nombre: 'Equipo Tres', forma: '', virtudes: '', trabajar: '', como: '', genero: 'f' as const, color: '#2f7de1' }] };
    guardarDiario(conNuevo);
    // Copia vieja: solo los dos equipos de antes, sin campos nuevos, versión 2 y sin sesiones.
    const vieja = armarCopia([], PALETAS[0], { equipos: ANTIGUO.diario.equipos as never, jugadoras: ANTIGUO.diario.jugadoras as never });
    expect(JSON.parse(vieja).version).toBe(2);
    const leida = leerCopia(vieja);
    expect(leida.sesiones).toBeUndefined();
    const unido = juntarDiario(leerDiario(), leida.diario!);
    expect(unido.equipos.map((e) => e.nombre).sort()).toEqual(['Equipo Dos', 'Equipo Tres', 'Equipo Uno']);
    expect(unido.equipos.find((e) => e.id === 'e3')).toMatchObject({ genero: 'f', color: '#2f7de1' });
    expect(unido.jugadoras).toHaveLength(1);
    expect(leerTemporadas()).toEqual([]);
  });
});
