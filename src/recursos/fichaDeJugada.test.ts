import { describe, expect, it } from 'vitest';
import { fichaDeJugada } from './fichaDeJugada';
import { SISTEMAS } from '../sistemas/datos';
import { ponerFamilia, nuevoBorrador } from '../editor/editar';

describe('jugada convertida en ficha para una sesión', () => {
  it('lleva el nombre, los textos de los pasos, la pizarra y la categoría', () => {
    const s = ponerFamilia({ ...nuevoBorrador(), nombre: 'Mi salida', idea: 'Salir de la presión', pasos: [{ texto: 'El 1 sube', movimientos: [] }, { texto: '', movimientos: [] }, { texto: 'Pase al 4', movimientos: [] }] }, 'presion');
    const f = fichaDeJugada(s);
    expect(f).toMatchObject({ nombre: 'Mi salida', objetivo: 'Salir de la presión', categoria: 'Salida de presión', sistemaId: s.id, minutos: 10 });
    expect(f.pasos).toEqual(['El 1 sube', 'Pase al 4']);
    expect(f.etiquetas).toContain('jugada');
  });
  it('una jugada del libro sin categoría cae en ataque o defensa según su tipo', () => {
    const ataque = SISTEMAS.find((s) => s.tipo === 'ataque' && !s.familia);
    if (ataque) expect(fichaDeJugada(ataque).categoria).toBe('Ataque');
    expect(fichaDeJugada({ ...SISTEMAS[0], familia: undefined, tipo: 'defensa' }).categoria).toBe('Defensa');
  });
});
