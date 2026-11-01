import { describe, expect, it } from 'vitest';
import { armarCopia, leerCopia, recortarAEquipo } from '../copia';
import { limpiar, nuevaJugadora, nuevoEquipo, guardarEquipo, guardarJugadora, juntarDiario, type Diario } from '../diario/diario';
import { palabras } from '../diario/tipo';
import { alinearSesiones, nuevaSesion, sesionesDe } from '../sesiones/sesiones';
import { balanceDe, guardarEvento, limpiarTemporada, nuevaTemporada, nuevoEvento, nuevoFijo, guardarFijo } from '../temporada/temporada';
import { PALETAS } from '../temas';
import {
  HEREDAR_TODO, anadirEquipo, cerrarTemporada, duplicarEquipo, equipoActivo, equipoEjemplo, equipoSiguienteTemporada, heredarDe, montarEquipo, problemasNuevoEquipo, resumenArchivada,
} from './equipos';
import { colorLegible, esFemenino, etiquetaTemporada, letrasDe, limpiarEscudo, limpiarExtras, limpiarObjetivos, limpiarStaff } from './modelo';

const datos = { nombre: 'Equipo Uno', genero: 'f' as const, tipo: 'formacion' as const, inicio: '2026-09-01', fin: '2027-06-30', entrenos: [], lista: '' };

describe('modelo del equipo', () => {
  it('sin género, senior es masculino y formación es femenino', () => {
    expect(esFemenino({ tipo: 'senior' })).toBe(false);
    expect(esFemenino({})).toBe(true);
    expect(esFemenino({ tipo: 'senior', genero: 'f' })).toBe(true);
    expect(esFemenino({ genero: 'm' })).toBe(false);
  });

  it('las palabras siguen el género y no el tipo', () => {
    expect(palabras({ tipo: 'senior', genero: 'f' }).jugadoras).toBe('jugadoras');
    expect(palabras({ genero: 'm' }).jugadoras).toBe('jugadores');
    expect(palabras({}).jugadoras).toBe('jugadoras');
    expect(palabras({ tipo: 'senior' }).jugadoras).toBe('jugadores');
  });

  it('las letras del escudo salen del nombre', () => {
    expect(letrasDe('Cadete Femenino A')).toBe('CFA');
    expect(letrasDe('Águilas')).toBe('AG');
    expect(letrasDe('')).toBe('');
    expect(limpiarEscudo({ letras: 'ab!c d', forma: 'rombo' })).toEqual({ letras: 'ABC', forma: 'rombo' });
    expect(limpiarEscudo({ letras: 'ab', forma: 'raro' })).toBeUndefined();
  });

  it('el cuerpo técnico y los objetivos descartan lo roto y ponen tope', () => {
    expect(limpiarStaff([{ id: 'a', nombre: 'Ejemplo Uno', papel: 'fisio' }, { id: 'a', nombre: 'Repetido', papel: 'fisio' }, { id: 'b', nombre: 'X', papel: 'jefe' }, 3])).toEqual([{ id: 'a', nombre: 'Ejemplo Uno', papel: 'fisio' }]);
    expect(limpiarStaff(Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, nombre: 'N', papel: 'otro' }))).length).toBe(12);
    expect(limpiarObjetivos([{ id: 'o', texto: ' ', hecho: true }, { id: 'p', texto: 'Defender', hecho: true }])).toEqual([{ id: 'p', texto: 'Defender', hecho: true }]);
  });

  it('el color solo vale en hexadecimal y se aclara si es muy oscuro', () => {
    expect(limpiarExtras({ color: 'rojo' }).color).toBeUndefined();
    expect(limpiarExtras({ color: '#AA0000' }).color).toBe('#aa0000');
    expect(colorLegible('#f2b134')).toBe('#f2b134');
    expect(colorLegible('#000000')).not.toBe('#000000');
    expect(colorLegible('nada')).toBe('#f2b134');
  });

  it('etiqueta de temporada', () => {
    expect(etiquetaTemporada('2026-09-01')).toBe('2026-27');
    expect(etiquetaTemporada('2099-09-01')).toBe('2099-00');
    expect(etiquetaTemporada('')).toBe('');
  });

  it('el año de nacimiento y la mano que no cuadran se quitan sin perder la ficha', () => {
    const e = nuevoEquipo('Uno');
    const buena = nuevaJugadora(e.id, { nombre: 'Ejemplo Uno', nacimiento: 2010, mano: 'i' });
    const mala = nuevaJugadora(e.id, { nombre: 'Ejemplo Dos', nacimiento: 1800, mano: 'x' as never });
    const d = limpiar({ equipos: [e], jugadoras: [buena, mala] });
    expect(d.jugadoras[0]).toMatchObject({ nacimiento: 2010, mano: 'i' });
    expect(d.jugadoras[1].nacimiento).toBeUndefined();
    expect(d.jugadoras[1].mano).toBeUndefined();
    expect(d.jugadoras[1].nombre).toBe('Ejemplo Dos');
  });

  it('un equipo antiguo, sin lo nuevo, se carga igual', () => {
    const d = limpiar({ equipos: [{ id: 'e1', nombre: 'Viejo', forma: '', virtudes: '', trabajar: '', como: '' }], jugadoras: [] });
    expect(d.equipos[0]).toEqual({ id: 'e1', nombre: 'Viejo', forma: '', virtudes: '', trabajar: '', como: '' });
  });

  it('una copia vieja no borra lo nuevo del equipo de este móvil', () => {
    const actual: Diario = { equipos: [{ ...nuevoEquipo('Uno'), id: 'e1', genero: 'm', color: '#aa0000', staff: [{ id: 's', nombre: 'Ejemplo Staff', papel: 'ayudante' }] }], jugadoras: [] };
    const copia: Diario = { equipos: [{ ...nuevoEquipo('Uno'), id: 'e1', forma: 'Rápido' }], jugadoras: [] };
    const r = juntarDiario(actual, copia).equipos[0];
    expect(r).toMatchObject({ forma: 'Rápido', genero: 'm', color: '#aa0000' });
    expect(r.staff).toHaveLength(1);
  });
});

describe('importar con año de nacimiento', () => {
  it('lee el año suelto en una lista pegada y lo guarda en la ficha', () => {
    const m = montarEquipo({ ...datos, lista: '4 Ejemplo Uno 2010 Base\n7;Ejemplo Dos;Alero;2009\n9 Ejemplo Tres' });
    expect(m.jugadoras.map((j) => [j.numero, j.nombre, j.posicion, j.nacimiento])).toEqual([
      ['4', 'Ejemplo Uno', 'Base', 2010], ['7', 'Ejemplo Dos', 'Alero', 2009], ['9', 'Ejemplo Tres', '', undefined],
    ]);
  });

  it('un número de cuatro cifras fuera de época no es un año', () => {
    const m = montarEquipo({ ...datos, lista: '5 Ejemplo Cuatro 3000' });
    expect(m.jugadoras[0].nacimiento).toBeUndefined();
  });
});

describe('equipo activo', () => {
  const a = nuevoEquipo('A');
  const b = nuevoEquipo('B');
  it('usa el elegido y, si ya no existe, el primero', () => {
    expect(equipoActivo([a, b], b.id)).toBe(b);
    expect(equipoActivo([a, b], 'borrado')).toBe(a);
    expect(equipoActivo([], 'x')).toBeUndefined();
  });
});

describe('asistente de nuevo equipo', () => {
  it('pide nombre, fechas buenas y no repetir equipo', () => {
    expect(problemasNuevoEquipo({ nombre: '', inicio: '2026-09-01', fin: '2027-06-30' })).toHaveLength(1);
    expect(problemasNuevoEquipo({ nombre: 'A', inicio: '2027-09-01', fin: '2026-06-30' })).toHaveLength(1);
    expect(problemasNuevoEquipo({ nombre: 'A', inicio: 'no', fin: 'no' })).toHaveLength(1);
    expect(problemasNuevoEquipo({ nombre: ' equipo UNO ', inicio: '2026-09-01', fin: '2027-06-30' }, [{ nombre: 'Equipo Uno' }])).toEqual(['Ya tienes un equipo con ese nombre.']);
    expect(problemasNuevoEquipo({ nombre: 'A', inicio: '2026-09-01', fin: '2027-06-30' })).toEqual([]);
  });

  it('monta equipo, plantilla y horarios con lo contestado', () => {
    const m = montarEquipo({
      ...datos, categoria: 'Cadete', color: '#AA0000', tipo: 'senior', genero: 'f',
      entrenos: [{ dia: 1, hora: '19:00', minutos: 90, pista: 'Pista 1', vestuario: '2' }, { dia: 3, hora: '19:00', minutos: 60 }],
      lista: '4 Ejemplo Uno Base\n7 Ejemplo Dos Alero',
    });
    expect(m.equipo).toMatchObject({ nombre: 'Equipo Uno', tipo: 'senior', genero: 'f', categoria: 'Cadete', temporada: '2026-27', color: '#aa0000', escudo: { letras: 'EU', forma: 'redondo' } });
    expect(m.jugadoras.map((j) => [j.numero, j.nombre, j.posicion])).toEqual([['4', 'Ejemplo Uno', 'Base'], ['7', 'Ejemplo Dos', 'Alero']]);
    expect(m.jugadoras.every((j) => j.equipoId === m.equipo.id)).toBe(true);
    expect(m.temporada.equipoId).toBe(m.equipo.id);
    expect(m.temporada.fijos.map((f) => [f.dia, f.hora, f.pista ?? ''])).toEqual([[1, '19:00', 'Pista 1'], [3, '19:00', '']]);
  });

  it('sin lista ni horarios también se puede crear', () => {
    const m = montarEquipo(datos);
    expect(m.jugadoras).toEqual([]);
    expect(m.temporada.fijos).toEqual([]);
    expect(m.equipo.tipo).toBeUndefined();
  });

  it('el equipo de ejemplo trae diez jugadores inventados, horarios y partidos, y se guarda sin romperse', () => {
    const m = equipoEjemplo('2026-11-01', 'm', 'senior');
    expect(m.equipo.ejemplo).toBe(true);
    expect(m.jugadoras).toHaveLength(10);
    expect(m.jugadoras.every((j) => j.nombre.startsWith('Ejemplo '))).toBe(true);
    expect(m.temporada.fijos).toHaveLength(2);
    const t = limpiarTemporada(m.temporada)!;
    expect(t.eventos).toHaveLength(3);
    expect(balanceDe(t, 'liga')).toEqual({ g: 1, p: 0 });
    const d = limpiar(anadirEquipo({ equipos: [], jugadoras: [] }, m));
    expect(d.equipos[0].ejemplo).toBe(true);
    expect(d.jugadoras).toHaveLength(10);
  });
});

describe('varios equipos sin mezclar datos', () => {
  const base = () => {
    let d: Diario = { equipos: [], jugadoras: [] };
    const m1 = montarEquipo({ ...datos, nombre: 'Equipo Uno', lista: '4 Ejemplo Uno Base\n7 Ejemplo Dos Alero', entrenos: [{ dia: 0, hora: '18:00', minutos: 90 }] });
    const m2 = montarEquipo({ ...datos, nombre: 'Equipo Dos', genero: 'm', tipo: 'senior', lista: '9 Ejemplo Tres Pívot' });
    d = anadirEquipo(anadirEquipo(d, m1), m2);
    const s1 = { ...nuevaSesion('Equipo Uno', 'Sesión uno', m1.equipo.id), bloques: [{ ejercicio: 'x~1', minutos: 10, tipo: 'tecnica' as const }] };
    const s2 = nuevaSesion('Equipo Dos', 'Sesión dos', m2.equipo.id);
    return { d, m1, m2, sesiones: [s1, s2], temporadas: [m1.temporada, m2.temporada] };
  };

  it('las sesiones se reparten por equipo, también las de antes (por el nombre)', () => {
    const { d, sesiones } = base();
    const vieja = { ...nuevaSesion('Equipo Uno', 'Vieja'), equipoId: undefined };
    const todas = [...sesiones, vieja];
    expect(sesionesDe(todas, d.equipos[0]).map((s) => s.nombre)).toEqual(['Sesión uno', 'Vieja']);
    expect(sesionesDe(todas, d.equipos[1]).map((s) => s.nombre)).toEqual(['Sesión dos']);
  });

  it('al renombrar un equipo no se sueltan sus sesiones', () => {
    const { d, sesiones } = base();
    const nuevoNombre = guardarEquipo(d, { ...d.equipos[0], nombre: 'Equipo Uno B' });
    const alineadas = alinearSesiones(sesiones, nuevoNombre.equipos);
    expect(alineadas[0].equipo).toBe('Equipo Uno B');
    expect(sesionesDe(alineadas, nuevoNombre.equipos[0])).toHaveLength(1);
    expect(alinearSesiones(alineadas, nuevoNombre.equipos)).toBe(alineadas);
  });

  it('una sesión antigua sin id gana el id de su equipo', () => {
    const { d } = base();
    const vieja = { ...nuevaSesion('Equipo Dos', 'Vieja'), equipoId: undefined };
    expect(alinearSesiones([vieja], d.equipos)[0].equipoId).toBe(d.equipos[1].id);
  });

  it('duplicar copia plantilla, horarios y sesiones con ids nuevos, sin partidos ni lesiones', () => {
    const { d, m1, sesiones } = base();
    const ju = d.jugadoras.find((j) => j.equipoId === m1.equipo.id)!;
    const conLesion = guardarJugadora(d, { ...ju, lesion: { desde: '2026-10-01', nota: 'x' } });
    const conPartido = guardarEvento(m1.temporada, { ...nuevoEvento('2026-10-10', 'partido'), titulo: 'Ejemplo Rival' });
    const r = duplicarEquipo(conLesion, [conPartido], sesiones, m1.equipo.id, 'Equipo Uno B')!;
    expect(r.equipo.nombre).toBe('Equipo Uno B');
    expect(r.equipo.id).not.toBe(m1.equipo.id);
    expect(r.jugadoras).toHaveLength(2);
    expect(r.jugadoras.every((j) => j.equipoId === r.equipo.id && !j.lesion && !conLesion.jugadoras.some((x) => x.id === j.id))).toBe(true);
    expect(r.temporada!.fijos).toHaveLength(1);
    expect(r.temporada!.fijos[0].id).not.toBe(conPartido.fijos[0].id);
    expect(r.temporada!.eventos).toEqual([]);
    expect(r.sesiones).toHaveLength(1);
    expect(r.sesiones[0]).toMatchObject({ equipoId: r.equipo.id, equipo: 'Equipo Uno B', nombre: 'Sesión uno' });
    expect(r.sesiones[0].id).not.toBe(sesiones[0].id);
  });

  it('heredar de otro equipo trae horarios y sesiones sin pisar lo que ya hay', () => {
    const { d, m1, m2, sesiones, temporadas } = base();
    const dueño = guardarEquipo(d, { ...d.equipos[1], forma: 'Mi forma' });
    const r = heredarDe(dueño, temporadas, sesiones, m1.equipo.id, m2.equipo.id, HEREDAR_TODO)!;
    const eq = r.diario.equipos.find((e) => e.id === m2.equipo.id)!;
    expect(eq.forma).toBe('Mi forma');
    expect(r.temporadas.find((t) => t.equipoId === m2.equipo.id)!.fijos).toHaveLength(1);
    expect(sesionesDe(r.sesiones, eq)).toHaveLength(2);
    expect(r.diario.jugadoras).toHaveLength(dueño.jugadoras.length);
    // Hacerlo dos veces no repite el horario.
    const otra = heredarDe(r.diario, r.temporadas, r.sesiones, m1.equipo.id, m2.equipo.id, { ...HEREDAR_TODO, sesiones: false })!;
    expect(otra.temporadas.find((t) => t.equipoId === m2.equipo.id)!.fijos).toHaveLength(1);
    expect(heredarDe(d, temporadas, sesiones, m1.equipo.id, m1.equipo.id, HEREDAR_TODO)).toBeUndefined();
  });

  it('la copia de un solo equipo no lleva nada del otro y se puede restaurar encima', () => {
    const { d, m1, m2, sesiones, temporadas } = base();
    const solo = recortarAEquipo(m1.equipo.id, { diario: d, temporadas, sesiones, reflexiones: [] })!;
    expect(solo.diario.equipos.map((e) => e.nombre)).toEqual(['Equipo Uno']);
    expect(solo.diario.jugadoras).toHaveLength(2);
    expect(solo.temporadas).toHaveLength(1);
    expect(solo.sesiones.map((s) => s.nombre)).toEqual(['Sesión uno']);
    const leida = leerCopia(armarCopia([], PALETAS[0], solo.diario, solo.temporadas, [], [], false, undefined, solo.reflexiones, { sesiones: solo.sesiones }));
    expect(leida.sesiones).toHaveLength(1);
    // Restaurar sobre el estado actual (con el otro equipo) deja el otro intacto.
    const unido = juntarDiario(d, leida.diario!);
    expect(unido.equipos.map((e) => e.id).sort()).toEqual([m1.equipo.id, m2.equipo.id].sort());
    expect(recortarAEquipo('nada', { diario: d, temporadas, sesiones, reflexiones: [] })).toBeUndefined();
  });
});

describe('copia completa', () => {
  it('guarda sesiones, estrellas y libro de la semana, y una copia vieja sigue valiendo', () => {
    const s = nuevaSesion('Equipo Uno', 'Sesión');
    const texto = armarCopia([], PALETAS[0], undefined, undefined, undefined, undefined, false, undefined, undefined, { sesiones: [s], favoritos: ['j:cuernos'], semana: ['cuernos'] });
    const l = leerCopia(texto);
    expect(l.sesiones).toEqual([s]);
    expect(l.favoritos).toEqual(['j:cuernos']);
    expect(l.semana).toEqual(['cuernos']);
    const vieja = leerCopia(armarCopia([], PALETAS[0]));
    expect(vieja.sesiones).toBeUndefined();
    expect(vieja.favoritos).toBeUndefined();
  });

  it('descarta sesiones de equipos que la copia no trae y estrellas raras', () => {
    const e = nuevoEquipo('Uno');
    const buena = nuevaSesion('Uno', 'Buena', e.id);
    const huerfana = nuevaSesion('Otro', 'Huérfana', 'no-existe');
    const texto = JSON.stringify({ app: 'cuernos-copia', mios: [], diario: { equipos: [e], jugadoras: [] }, sesiones: [buena, huerfana, { id: 3 }], favoritos: ['ok', 5, null] });
    const l = leerCopia(texto);
    expect(l.sesiones?.map((x) => x.nombre)).toEqual(['Buena']);
    expect(l.favoritos).toEqual(['ok']);
  });
});

describe('temporada nueva', () => {
  const equipo = montarEquipo({ ...datos, entrenos: [{ dia: 2, hora: '18:30', minutos: 90 }] });
  const partido = { ...nuevoEvento('2026-10-10', 'partido'), titulo: 'Ejemplo Rival', resultado: { a: 60, c: 50 } };
  const jugada = guardarEvento(guardarFijo(nuevaTemporada(equipo.equipo.id, '2026-09-01', '2027-06-30'), { ...nuevoFijo(2), hora: '18:30' }), partido);

  it('cerrar guarda lo jugado y deja la temporada vacía con los mismos horarios un año después', () => {
    const n = cerrarTemporada({ ...jugada, asistencia: { x: ['j1'] } }, '2026-27');
    expect(n).toMatchObject({ inicio: '2027-09-01', fin: '2028-06-30', eventos: [], fases: [] });
    expect(n.fijos).toHaveLength(1);
    expect(n.asistencia).toBeUndefined();
    expect(n.anteriores).toHaveLength(1);
    expect(n.anteriores![0]).toMatchObject({ etiqueta: '2026-27', inicio: '2026-09-01' });
    expect(n.anteriores![0].asistencia).toEqual({ x: ['j1'] });
    expect(resumenArchivada(n.anteriores![0])).toBe('2026-27: 1 ganados y 0 perdidos en 1 partidos');
  });

  it('lo archivado sobrevive a guardar y cargar, y es el historial más reciente primero', () => {
    const una = cerrarTemporada(jugada, '2026-27');
    const dos = cerrarTemporada(una, '2027-28');
    const leida = limpiarTemporada(JSON.parse(JSON.stringify(dos)))!;
    expect(leida.anteriores!.map((a) => a.etiqueta)).toEqual(['2027-28', '2026-27']);
    expect(leida.anteriores![1].eventos[0].titulo).toBe('Ejemplo Rival');
    expect(leida.inicio).toBe('2028-09-01');
  });

  it('el equipo conserva la plantilla, pasa de temporada, vacía la rotación y quita los objetivos cumplidos', () => {
    const e = { ...equipo.equipo, temporada: '2026-27', rotacion: [[], [], [], []] as never, objetivos: [{ id: 'a', texto: 'Defender', hecho: true }, { id: 'b', texto: 'Rebote' }] };
    const n = equipoSiguienteTemporada(e);
    expect(n.temporada).toBe('2027-28');
    expect(n.rotacion).toBeUndefined();
    expect(n.objetivos).toEqual([{ id: 'b', texto: 'Rebote' }]);
    expect(n.id).toBe(e.id);
  });
});
