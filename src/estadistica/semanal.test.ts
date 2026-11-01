import { describe, expect, it } from 'vitest';
import { resumenSemana, semanaPasada, textoSemana } from './semanal';
import type { Temporada } from '../temporada/temporada';

const t: Temporada = {
  equipoId: 'e', inicio: '2026-09-01', fin: '2027-06-30', fases: [],
  fijos: [{ id: 'x', dia: 1, hora: '19:00', minutos: 90 }, { id: 'y', dia: 3, hora: '19:00', minutos: 60 }],
  eventos: [{ id: 'p', fecha: '2026-10-31', hora: '11:00', tipo: 'partido', titulo: 'Ejemplo Rival A', lugar: '', balance: '', resultado: { a: 58, c: 51 } }],
  excepciones: {}, asistencia: { 'x|2026-10-27': ['1', '2', '3', '4'], 'y|2026-10-29': ['1', '2'] },
};

describe('resumen semanal', () => {
  it('entrenos, minutos, asistencia y partidos de la semana', () => {
    const r = resumenSemana(t, [], '2026-10-26', 4);
    expect(r).toMatchObject({ entrenos: 2, minutos: 150, asistencia: 75 });
    expect(r.partidos).toEqual([{ rival: 'Ejemplo Rival A', a: 58, c: 51, marca: 'G' }]);
  });
  it('la semana pasada se calcula desde hoy y, si no hay nada, no sale', () => {
    expect(semanaPasada(t, [], '2026-11-02', 4)?.lunes).toBe('2026-10-26');
    expect(semanaPasada(t, [], '2026-10-04', 4)).toBeUndefined();
    expect(semanaPasada(undefined, [], '2026-11-02', 4)).toBeUndefined();
  });
  it('el texto lleva cifras y rival, sin nombres de jugadoras', () => {
    const txt = textoSemana(resumenSemana(t, [], '2026-10-26', 4), 'Equipo de ejemplo');
    expect(txt).toBe('Equipo de ejemplo · semana del 26/10 al 1/11\nEntrenos: 2 (150 min) · asistencia 75%\nGanado contra Ejemplo Rival A: 58–51');
  });
});
