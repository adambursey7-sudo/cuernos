import { beforeEach, describe, expect, it } from 'vitest';
import { guardarEvento, guardarTemporadas, leerTemporadas, nuevaTemporada, nuevoEvento, temporadaDe } from '../temporada/temporada';
import { guardarPartido, hayAlgo } from './guardar';
import { nuevoVivo, registrar, type Partido } from './vivo';

let datos: Map<string, string>;
let lleno = false;
beforeEach(() => {
  datos = new Map();
  lleno = false;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => { if (lleno) throw new Error('sin espacio'); datos.set(k, v); },
    removeItem: (k: string) => void datos.delete(k),
    length: 0,
    key: () => null,
  };
});

const T0 = 1_000_000;
const partido = (): Partido => registrar({ directo: {}, rival: 0, vivo: nuevoVivo(['a', 'b', 'c', 'd', 'e']) }, { tipo: 'c2', j: 'a' }, T0);
const preparar = () => {
  const e = { ...nuevoEvento('2026-11-14', 'partido'), titulo: 'Ejemplo Rival' };
  guardarTemporadas([guardarEvento(nuevaTemporada('eq1', '2026-09-01', '2027-06-30'), e)]);
  return e;
};
const evento = (id: string) => temporadaDe(leerTemporadas(), 'eq1')!.eventos.find((x) => x.id === id)!;

describe('guardar el partido en directo', () => {
  it('un partido abierto y sin tocar no escribe nada', () => {
    const e = preparar();
    const antes = datos.get('horns.temporada');
    const vacio: Partido = { directo: {}, rival: 0, vivo: nuevoVivo(['a', 'b', 'c', 'd', 'e']) };
    expect(hayAlgo(vacio)).toBe(false);
    expect(guardarPartido('eq1', e.id, e, vacio)).toBe(true);
    expect(datos.get('horns.temporada')).toBe(antes);
  });

  it('guarda marcador, estadística y cronología en su evento', () => {
    const e = preparar();
    expect(guardarPartido('eq1', e.id, e, partido())).toBe(true);
    const g = evento(e.id);
    expect(g.resultado).toEqual({ a: 2, c: 0 });
    expect(g.vivo?.cronologia).toHaveLength(1);
    expect(g.directo?.a?.p).toBe(2);
  });

  it('no pisa lo que otra pantalla cambió en el evento mientras se jugaba', () => {
    const e = preparar();
    // La hoja del partido cambia el plan después de abrirse el directo (que conserva el evento de cuando se abrió).
    const lista = leerTemporadas();
    guardarTemporadas([guardarEvento(temporadaDe(lista, 'eq1')!, { ...e, plan: 'Zona 2-3' })]);
    expect(guardarPartido('eq1', e.id, e, partido())).toBe(true);
    expect(evento(e.id).plan).toBe('Zona 2-3');
    expect(evento(e.id).vivo?.cronologia).toHaveLength(1);
  });

  it('dice que no ha guardado cuando el móvil no deja escribir', () => {
    const e = preparar();
    lleno = true;
    expect(guardarPartido('eq1', e.id, e, partido())).toBe(false);
  });
});
