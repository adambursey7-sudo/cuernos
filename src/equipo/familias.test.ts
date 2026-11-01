import { describe, expect, it } from 'vitest';
import { nuevaJugadora, nuevoEquipo } from '../diario/diario';
import { escribirIcs } from '../temporada/ics';
import { guardarEvento, guardarFijo, limpiarTemporada, nuevaTemporada, nuevoEvento, nuevoFijo, ponerAsistencia, balanceDe, itemsParaIcs } from '../temporada/temporada';
import { armarCopia } from '../copia';
import { nuevaSesion } from '../sesiones/sesiones';
import { cerrarTemporada } from './equipos';
import { asistenciaPorMes, hojaJugador, informeTemporada, mensajeConvocatoria, mensajeSemana } from './familias';

const equipo = { ...nuevoEquipo('Equipo Uno'), temporada: '2026-27', staff: [{ id: 's', nombre: 'Ejemplo Staff', papel: 'delegado' as const, contacto: '600 000 000' }] };
const j1 = nuevaJugadora(equipo.id, { nombre: 'Ejemplo Uno', numero: '4', posicion: 'Base', lesion: { desde: '2026-10-01', nota: 'tobillo' }, notas: [{ fecha: '2026-10-02', texto: 'nota privada' }] });
const j2 = nuevaJugadora(equipo.id, { nombre: 'Ejemplo Dos', numero: '7' });

const partido = { ...nuevoEvento('2026-11-07', 'partido'), id: 'p1', titulo: 'Ejemplo Rival', casa: false, lugar: 'Pabellón Ejemplo', salida: '09:30', hora: '11:00', jornada: 5, convocados: [j1.id, j2.id], competicion: 'copa' as const };
let t = guardarEvento(guardarFijo(nuevaTemporada(equipo.id, '2026-09-01', '2027-06-30'), { ...nuevoFijo(1), hora: '19:00', pista: 'Pista 1' }), partido);

describe('mensajes para las familias', () => {
  it('la convocatoria lleva dorsales y nunca nombres', () => {
    const m = mensajeConvocatoria(partido, equipo.nombre, [j2, j1]);
    expect(m).toContain('Convocados: #4, #7');
    expect(m).toContain('Jornada 5 · Copa');
    expect(m).toContain('Salida del viaje: 09:30');
    expect(m).not.toContain('Ejemplo Uno');
    expect(m).not.toContain('Ejemplo Dos');
  });

  it('sin convocatoria no inventa una', () => {
    expect(mensajeConvocatoria({ ...partido, convocados: undefined }, 'E', [j1])).not.toContain('Convocados');
  });

  it('el mensaje de la semana lista entrenos y partidos de lunes a domingo y salta lo cancelado', () => {
    const semana = mensajeSemana(t, 'Equipo Uno', '2026-11-04');
    expect(semana).toContain('martes 3/11 19:00 · Entreno (Pista 1)');
    expect(semana).toContain('sábado 7/11 11:00 · Partido vs Ejemplo Rival · fuera (Pabellón Ejemplo)');
    expect(semana.split('\n')).toHaveLength(3);
    expect(mensajeSemana(nuevaTemporada('x', '2026-09-01', '2027-06-30'), 'E', '2026-11-04')).toContain('no hay nada');
  });
});

describe('hoja del jugador', () => {
  it('lleva horarios y partidos, escapa el texto y no incluye salud ni notas', () => {
    const peligroso = { ...j1, nombre: '<b>Ejemplo</b> & Uno' };
    const h = hojaJugador(peligroso, equipo, t, '2026-11-01');
    expect(h).toContain('&lt;b&gt;Ejemplo&lt;/b&gt; &amp; Uno');
    expect(h).not.toContain('<b>Ejemplo');
    expect(h).toContain('martes');
    expect(h).toContain('Pista 1');
    expect(h).toContain('Ejemplo Rival');
    expect(h).toContain('salida 09:30');
    expect(h).toContain('600 000 000');
    expect(h).not.toContain('tobillo');
    expect(h).not.toContain('nota privada');
  });

  it('sin temporada sigue siendo una hoja válida', () => {
    expect(hojaJugador(j2, equipo, undefined, '2026-11-01')).toContain('Aún sin horarios');
  });
});

describe('asistencia y progreso', () => {
  it('cuenta mes a mes entrenos fijos y partidos con lista', () => {
    let u = ponerAsistencia(t, `${t.fijos[0].id}|2026-10-06`, [j1.id, j2.id]);
    u = ponerAsistencia(u, `${t.fijos[0].id}|2026-10-13`, [j2.id]);
    u = ponerAsistencia(u, 'p1', [j1.id]);
    expect(asistenciaPorMes(u, j1.id)).toEqual([{ mes: '2026-10', vino: 1, de: 2 }, { mes: '2026-11', vino: 1, de: 1 }]);
    expect(asistenciaPorMes(u, j2.id)).toEqual([{ mes: '2026-10', vino: 2, de: 2 }, { mes: '2026-11', vino: 0, de: 1 }]);
    expect(asistenciaPorMes(undefined, j1.id)).toEqual([]);
    t = u;
  });
});

describe('informe de fin de temporada', () => {
  it('resume resultados por competición, objetivos y asistencia, con o sin nombres', () => {
    let u = guardarEvento(t, { ...partido, resultado: { a: 70, c: 60 } });
    u = guardarEvento(u, { ...nuevoEvento('2026-11-14', 'partido'), id: 'p2', titulo: 'Ejemplo Rival B', resultado: { a: 50, c: 55 } });
    const e = { ...equipo, objetivos: [{ id: 'o1', texto: 'Defender mejor', hecho: true }, { id: 'o2', texto: 'Rebote' }] };
    const r = informeTemporada(e, u, [j1, j2]);
    expect(r).toContain('Partidos con resultado: 2');
    expect(r).toContain('Liga: 0 ganados y 1 perdidos');
    expect(r).toContain('Copa: 1 ganados y 0 perdidos');
    expect(r).toContain('Puntos: 120 a favor y 115 en contra (+5)');
    expect(r).toContain('Mejor resultado: 70–60 contra Ejemplo Rival');
    expect(r).toContain('Objetivos: 1 de 2 cumplidos');
    expect(r).toContain('[x] Defender mejor');
    expect(r).toContain('#4 Ejemplo Uno');
    expect(informeTemporada(e, u, [j1, j2], false)).not.toContain('Ejemplo Uno');
  });
});

describe('partido: competición y convocatoria', () => {
  it('el balance se separa por competición', () => {
    const u = guardarEvento(guardarEvento(nuevaTemporada('e', '2026-09-01', '2027-06-30'), { ...nuevoEvento('2026-10-01', 'partido'), id: 'a', titulo: 'A', resultado: { a: 60, c: 50 } }), { ...nuevoEvento('2026-10-08', 'partido'), id: 'b', titulo: 'B', competicion: 'amistoso', resultado: { a: 40, c: 50 } });
    expect(balanceDe(u, 'liga')).toEqual({ g: 1, p: 0 });
    expect(balanceDe(u, 'amistoso')).toEqual({ g: 0, p: 1 });
  });

  it('al guardar y cargar se mantienen competición y convocatoria, pero el quinteto solo con convocados y máximo cinco', () => {
    const raro = { ...partido, convocados: ['a', 'b', 'c', 'd', 'e', 'f'], quinteto: ['a', 'b', 'c', 'd', 'e', 'f', 'zz'] };
    const l = limpiarTemporada(JSON.parse(JSON.stringify(guardarEvento(t, raro))))!;
    const e = l.eventos.find((x) => x.id === 'p1')!;
    expect(e.competicion).toBe('copa');
    expect(e.convocados).toHaveLength(6);
    expect(e.quinteto).toEqual(['a', 'b', 'c', 'd', 'e']);
    const sinConv = limpiarTemporada(guardarEvento(t, { ...partido, convocados: undefined, quinteto: ['a'] }))!.eventos.find((x) => x.id === 'p1')!;
    expect(sinConv.quinteto).toEqual(['a']);
    const entreno = limpiarTemporada(guardarEvento(t, { ...nuevoEvento('2026-11-01', 'entreno'), id: 'en', convocados: ['a'], competicion: 'copa' }))!.eventos.find((x) => x.id === 'en')!;
    expect(entreno.convocados).toBeUndefined();
    expect(entreno.competicion).toBeUndefined();
  });
});

describe('arreglos de la revisión', () => {
  it('cerrar una temporada que acaba un 29 de febrero no pierde la temporada', () => {
    const n = cerrarTemporada(nuevaTemporada('e', '2027-09-01', '2028-02-29'), 'x');
    expect(n.fin).toBe('2029-02-28');
    expect(limpiarTemporada(n)).not.toBeNull();
  });

  it('el .ics no deja que un salto de línea suelto cuele otro evento', () => {
    const ics = escribirIcs('E', [{ fecha: '2026-11-07', hora: '11:00', tipo: 'otro', titulo: 'a\rEND:VEVENT\rBEGIN:VEVENT', minutos: 60, uid: 'u' }]);
    expect(ics.split(/\r\n/).filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(ics).not.toMatch(/\r(?!\n)/);
  });

  it('la copia no lleva lo de un equipo que ya no existe', () => {
    const vivo = nuevoEquipo('Vivo');
    const muerto = nuevoEquipo('Muerto');
    const texto = armarCopia([], { principal: '#aa0000', fondo: '#000000', pista: '#aa8800', jugadores: '#ffffff' }, { equipos: [vivo], jugadoras: [] },
      [nuevaTemporada(vivo.id, '2026-09-01', '2027-06-30'), nuevaTemporada(muerto.id, '2026-09-01', '2027-06-30')], undefined, undefined, false, undefined,
      [{ id: 'r', fecha: '2026-10-01', equipoId: muerto.id, animo: 3, funciono: '', no: '', proximo: '' }], { sesiones: [nuevaSesion('Muerto', 'S', muerto.id)] });
    const c = JSON.parse(texto);
    expect(c.temporadas).toHaveLength(1);
    expect(c.reflexiones).toHaveLength(0);
    expect(c.sesiones).toHaveLength(0);
  });
});

describe('calendario para las familias', () => {
  const items = itemsParaIcs(t).filter((i) => i.fecha < '2026-11-30');
  it('con recordatorio añade un aviso antes de cada cosa', () => {
    const ics = escribirIcs('Equipo Uno', items, { avisarMin: 90 });
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT90M');
    expect(escribirIcs('Equipo Uno', items)).not.toContain('VALARM');
    expect(escribirIcs('Equipo Uno', items, { avisarMin: -5 })).not.toContain('VALARM');
  });

  it('sin entrenos solo salen los partidos', () => {
    const ics = escribirIcs('Equipo Uno', items, { sinEntrenos: true });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('Partido vs Ejemplo Rival');
    expect(ics).not.toContain('Entreno');
  });
});
