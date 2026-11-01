import { describe, expect, it } from 'vitest';
import { interpretarRespuestas, limpiarDisponibilidad, mensajePedir, mensajeRecordar, mensajeResumen, ponerRespuesta, resumir, sinRespuestas, type Cita } from './disponibilidad';
import { limpiarTemporada } from '../temporada/temporada';

const cita: Cita = { tipo: 'partido', titulo: 'Ejemplo Rival A', fecha: '2026-11-07', hora: '11:00', lugar: 'Pabellón', casa: true };

describe('responder', () => {
  it('apunta, cambia y quita una respuesta, y no deja días vacíos', () => {
    let d = ponerRespuesta(undefined, 'p1', 'a', 'si');
    d = ponerRespuesta(d, 'p1', 'b', 'quiza');
    d = ponerRespuesta(d, 'p1', 'a', 'no');
    expect(d).toEqual({ p1: { a: 'no', b: 'quiza' } });
    d = ponerRespuesta(d, 'p1', 'a', null);
    d = ponerRespuesta(d, 'p1', 'b', null);
    expect(d).toBeUndefined();
  });
  it('sinRespuestas quita los días que se piden', () => {
    expect(sinRespuestas({ 'f|2026-11-02': { a: 'si' }, p1: { a: 'si' } }, (k) => k.startsWith('f|'))).toEqual({ p1: { a: 'si' } });
  });
  it('resumen: quién va, quién no, quizá y quién falta (las que ya no existen se ignoran)', () => {
    expect(resumir({ a: 'si', b: 'no', c: 'quiza', zombi: 'si' }, ['a', 'b', 'c', 'd'])).toEqual({ si: ['a'], no: ['b'], quiza: ['c'], faltan: ['d'] });
    expect(resumir(undefined, ['a']).faltan).toEqual(['a']);
  });
});

describe('mensajes: solo dorsales', () => {
  it('el mensaje al grupo pide contestar con el dorsal y no lleva nombres', () => {
    const m = mensajePedir(cita, 'Equipo de ejemplo');
    expect(m).toContain('Partido contra Ejemplo Rival A');
    expect(m).toContain('sábado 7/11 a las 11:00 · En casa (Pabellón)');
    expect(m).toContain('«7 voy»');
  });
  it('el recordatorio nombra solo a los dorsales que faltan, y sin faltas no hay mensaje', () => {
    expect(mensajeRecordar(cita, 'EE', ['4', '9'])).toContain('#4 #9');
    expect(mensajeRecordar(cita, 'EE', [])).toBe('');
  });
  it('el resumen cuenta cada grupo', () => {
    const m = mensajeResumen(cita, 'EE', { si: ['4', '5'], no: ['6'], quiza: [], faltan: ['7'] });
    expect(m).toContain('Van 2: #4 #5');
    expect(m).toContain('Quizá 0\n');
    expect(m).toContain('Sin contestar 1: #7');
  });
});

describe('pegar respuestas del grupo', () => {
  it('entiende «voy», «no voy», «quizá», con almohadilla y sin ella, y la última manda', () => {
    const r = interpretarRespuestas('7 voy\n#12 no puede\n4 quizá\n9 ni idea\nhola a todos\n7 no voy\n15 Sí');
    expect(Object.fromEntries(r.map((x) => [x.numero, x.r]))).toEqual({ 7: 'no', 12: 'no', 4: 'quiza', 9: 'quiza', 15: 'si' });
  });
  it('lo que no se entiende se deja', () => {
    expect(interpretarRespuestas('el 7 es nuevo\nbuenas')).toEqual([]);
  });
});

describe('guardar y cargar', () => {
  it('limpia respuestas raras', () => {
    expect(limpiarDisponibilidad({ p1: { a: 'si', b: 'tal vez', '': 'si' }, p2: {}, '': { a: 'si' } })).toEqual({ p1: { a: 'si' } });
    expect(limpiarDisponibilidad('x')).toBeUndefined();
  });
  it('una temporada vieja sin disponibilidad se abre igual y una nueva la conserva', () => {
    const base = { equipoId: 'e', inicio: '2026-09-01', fin: '2027-06-30', fases: [], fijos: [], eventos: [], excepciones: {} };
    expect(limpiarTemporada(base)?.disponibilidad).toBeUndefined();
    expect(limpiarTemporada({ ...base, disponibilidad: { p1: { a: 'si' } } })?.disponibilidad).toEqual({ p1: { a: 'si' } });
  });
});
