import { beforeEach, describe, expect, it } from 'vitest';
import { cuadriculaMes, diaSemana, esFecha, lunesDe, sumarDias, sumarMeses } from './fechas';
import { escribirIcs, leerIcs, leerLista } from './ics';
import {
  agendaDia, aplicarCandidatas, cambiarFijoDia, faseDe, guardarEvento, guardarFase, guardarFijo, guardarTemporadas, itemsParaIcs, leerTemporadas,
  limpiarTemporada, marcasDia, nuevaFase, nuevaTemporada, nuevoEvento, nuevoFijo, quitarFijo, temporadaPorDefecto,
} from './temporada';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
};

// 2026-10-12 es lunes; 2026-10-17 es sábado.
const base = () => nuevaTemporada('e1', '2026-09-01', '2027-06-30');

describe('fechas', () => {
  it('sabe el día de la semana y suma días y meses', () => {
    expect(diaSemana('2026-10-17')).toBe(5);
    expect(lunesDe('2026-10-17')).toBe('2026-10-12');
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(sumarDias('2026-03-28', 2)).toBe('2026-03-30');
    expect(sumarMeses('2026-12-15', 1)).toBe('2027-01-01');
  });
  it('rechaza fechas que no existen', () => {
    expect(esFecha('2026-02-31')).toBe(false);
    expect(esFecha('2026-02-28')).toBe(true);
    expect(esFecha('hoy')).toBe(false);
  });
  it('dibuja el mes en semanas de lunes a domingo', () => {
    const m = cuadriculaMes('2026-10-15');
    expect(m[0].slice(0, 3)).toEqual([null, null, null]);
    expect(m[0][3]).toBe('2026-10-01');
    expect(m.every((s) => s.length === 7)).toBe(true);
    expect(m.flat().filter(Boolean)).toHaveLength(31);
  });
});

describe('temporada', () => {
  beforeEach(memoria);

  it('propone de septiembre a junio', () => {
    expect(temporadaPorDefecto('2026-10-30')).toEqual({ inicio: '2026-09-01', fin: '2027-06-30' });
    expect(temporadaPorDefecto('2027-02-10')).toEqual({ inicio: '2026-09-01', fin: '2027-06-30' });
  });

  it('genera los entrenos fijos solo dentro de la temporada', () => {
    let t = base();
    t = guardarFijo(t, { ...nuevoFijo(0), hora: '18:30' });
    expect(agendaDia(t, '2026-10-12').map((i) => i.tipo)).toEqual(['entreno']);
    expect(agendaDia(t, '2026-10-13')).toHaveLength(0);
    expect(agendaDia(t, '2026-08-31')).toHaveLength(0);
    expect(agendaDia(t, '2027-07-05')).toHaveLength(0);
  });

  it('un festivo y un parón quitan los entrenos de ese día', () => {
    let t = guardarFijo(base(), nuevoFijo(0));
    t = guardarEvento(t, { ...nuevoEvento('2026-10-12', 'otro'), titulo: 'Festivo', libre: true });
    expect(agendaDia(t, '2026-10-12').map((i) => i.tipo)).toEqual(['otro']);
    t = guardarFase(t, { ...nuevaFase('2026-12-21', '2027-01-06'), nombre: 'Navidad', sinEntreno: true });
    expect(agendaDia(t, '2026-12-28')).toHaveLength(0);
    expect(faseDe(t, '2026-12-28')?.nombre).toBe('Navidad');
    expect(faseDe(t, '2026-11-01')).toBeUndefined();
  });

  it('cancela, cambia de hora y enlaza una sesión en un día suelto sin tocar los demás', () => {
    let t = guardarFijo(base(), nuevoFijo(0));
    const dia = agendaDia(t, '2026-10-12')[0];
    t = cambiarFijoDia(t, dia, { cancelado: true });
    expect(agendaDia(t, '2026-10-12')[0].cancelado).toBe(true);
    expect(marcasDia(t, '2026-10-12').entreno).toBe(false);
    expect(agendaDia(t, '2026-10-19')[0].cancelado).toBeUndefined();
    t = cambiarFijoDia(t, dia, { cancelado: false, hora: '19:00', sesionId: 's1' });
    expect(agendaDia(t, '2026-10-12')[0]).toMatchObject({ hora: '19:00', sesionId: 's1' });
    t = cambiarFijoDia(t, dia, { hora: undefined, sesionId: undefined });
    expect(t.excepciones).toEqual({});
  });

  it('ordena el día por hora y quitar un entreno fijo borra sus cambios', () => {
    let t = guardarFijo(base(), { ...nuevoFijo(5), hora: '17:00' });
    t = guardarEvento(t, { ...nuevoEvento('2026-10-17', 'partido'), titulo: 'Ejemplo CB', hora: '11:00' });
    expect(agendaDia(t, '2026-10-17').map((i) => i.tipo)).toEqual(['partido', 'entreno']);
    const fijo = t.fijos[0];
    t = cambiarFijoDia(t, agendaDia(t, '2026-10-17')[1], { cancelado: true });
    t = quitarFijo(t, fijo.id);
    expect(t.fijos).toHaveLength(0);
    expect(t.excepciones).toEqual({});
  });

  it('guarda, lee y descarta lo que no vale', () => {
    let t = guardarEvento(base(), { ...nuevoEvento('2026-10-17', 'partido'), titulo: 'Ejemplo CB', resultado: { a: 50, c: 44 } });
    t = guardarFase(t, { ...nuevaFase('2026-09-01', '2026-10-10'), nombre: 'Pretemporada', objetivo: 'Defensa' });
    expect(guardarTemporadas([t])).toBe(true);
    expect(leerTemporadas()[0]).toEqual(t);
    const sucia = {
      ...t,
      eventos: [...t.eventos, { id: 'x', fecha: '2026-02-31', hora: '11:00', tipo: 'partido', titulo: '', lugar: '', balance: '' }, 7],
      fases: [{ nombre: 3 }],
      fijos: [{ id: 'q', dia: 9, hora: '18:30', minutos: 60 }],
    };
    const limpia = limpiarTemporada(sucia)!;
    expect(limpia.eventos).toHaveLength(1);
    expect(limpia.fases).toHaveLength(0);
    expect(limpia.fijos).toHaveLength(0);
    expect(limpiarTemporada({ equipoId: 'a', inicio: 'mal', fin: 'mal' })).toBeNull();
    localStorage.setItem('horns.temporada', 'no es json');
    expect(leerTemporadas()).toEqual([]);
  });
});

describe('listas e .ics', () => {
  it('lee una lista pegada de jornadas', () => {
    const r = leerLista('J1 13/10 11:00 Ejemplo CB (C)\nJ2 20/10 12:30 Ejemplo BC (F)\nJ3 Ejemplo AB', '2026-09-01');
    expect(r[0]).toMatchObject({ fecha: '2026-10-13', hora: '11:00', titulo: 'Ejemplo CB', casa: true, dudosa: false });
    expect(r[1]).toMatchObject({ fecha: '2026-10-20', hora: '12:30', titulo: 'Ejemplo BC', casa: false });
    expect(r[2]).toMatchObject({ titulo: 'Ejemplo AB', dudosa: true });
  });
  it('en una lista, los meses de enero a junio van al año siguiente', () => {
    expect(leerLista('J9 11/01 10:00 Ejemplo CB casa', '2026-09-01')[0].fecha).toBe('2027-01-11');
    expect(leerLista('3-2-2027 Ejemplo CB', '2026-09-01')[0].fecha).toBe('2027-02-03');
  });

  const ICS = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT', 'SUMMARY:Jornada 1 vs Ejemplo CB', 'DTSTART:20261017T110000', 'DTEND:20261017T123000', 'LOCATION:Pabellón Ejemplo (casa)', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Entreno', 'DTSTART:20261012T183000', 'DTEND:20261012T200000', 'RRULE:FREQ=WEEKLY;BYDAY=MO', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Reunión de club', 'DTSTART;VALUE=DATE:20261020', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Cancelado vs X', 'DTSTART:20261024T110000', 'STATUS:CANCELLED', 'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  it('lee un .ics y adivina partido, entreno semanal y otros', () => {
    const r = leerIcs(ICS);
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({ tipo: 'entreno', semanal: true, hora: '18:30', minutos: 90 });
    expect(r[1]).toMatchObject({ tipo: 'partido', titulo: 'Ejemplo CB', casa: true, fecha: '2026-10-17', hora: '11:00' });
    expect(r[2]).toMatchObject({ tipo: 'otro', fecha: '2026-10-20', dudosa: true });
  });

  it('une líneas largas del .ics y desescapa el texto', () => {
    const r = leerIcs('BEGIN:VEVENT\nSUMMARY:Partido vs Ejemplo\\, CB\n  largo\nDTSTART:20261017T110000\nEND:VEVENT');
    expect(r[0].titulo).toBe('Ejemplo, CB largo');
  });

  it('aplica lo importado sin repetir y vuelve a leer lo que exporta', () => {
    let t = aplicarCandidatas(base(), leerIcs(ICS).filter((c) => c.tipo !== 'otro'));
    expect(t.fijos).toHaveLength(1);
    expect(t.eventos).toHaveLength(1);
    t = aplicarCandidatas(t, leerIcs(ICS));
    expect(t.fijos).toHaveLength(1);
    expect(t.eventos).toHaveLength(2);
    const texto = escribirIcs('Cadete femenino', itemsParaIcs({ ...t, fin: '2026-10-31' }));
    expect(texto.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(texto).toContain('SUMMARY:Partido vs Ejemplo CB (casa)');
    const vuelta = leerIcs(texto);
    expect(vuelta.filter((c) => c.tipo === 'partido')).toHaveLength(1);
    expect(vuelta.filter((c) => c.tipo === 'entreno').length).toBeGreaterThan(3);
    expect(vuelta.find((c) => c.tipo === 'partido')).toMatchObject({ titulo: 'Ejemplo CB', casa: true, fecha: '2026-10-17' });
  });

  it('no exporta los entrenos cancelados', () => {
    let t = guardarFijo({ ...base(), fin: '2026-10-20' }, nuevoFijo(0));
    t = cambiarFijoDia(t, agendaDia(t, '2026-10-12')[0], { cancelado: true });
    const fechas = itemsParaIcs(t).map((i) => i.fecha).filter((f) => f >= '2026-10-12');
    expect(fechas).toEqual(['2026-10-19']);
  });
});
