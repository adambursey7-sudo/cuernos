import { beforeEach, describe, expect, it } from 'vitest';
import { armarCopia, leerCopia } from '../copia';
import { guardarTodosMios, leerMios } from '../sistemas/almacen';
import { CUESTIONARIO_VACIO } from './ia';
import { validarEjercicio } from './ejercicioIA';
import { leerFichas } from './fichas';
import { anadirFicha, fichaDeEjercicio, guardarEjercicio, type Ejercicio } from './guardarEjercicioIA';
import { nuevoRecurso } from './recursos';

let datos: Map<string, string>;
let lleno: boolean;
beforeEach(() => {
  datos = new Map();
  lleno = false;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (lleno && k === 'horns.fichas') throw new Error('lleno');
      datos.set(k, v);
    },
    removeItem: (k: string) => void datos.delete(k),
  };
});

const claude = JSON.stringify({
  nombre: 'Pase y corte',
  objetivo: 'Pasar y cortar',
  minutos: 10,
  material: '1 balón',
  jugadoras: { '1': [75, 100], '2': [30, 70], '3': [120, 70] },
  balon: '1',
  pasos: [
    { texto: '1 pasa a 2 y corta', movimientos: [{ tipo: 'pase', de: '1', a: '2' }, { tipo: 'corte', jugador: '1', a: [75, 40] }, { tipo: 'corte', jugador: '3', a: [110, 80] }] },
    { texto: '2 devuelve a 1', movimientos: [{ tipo: 'pase', de: '2', a: '1' }] },
  ],
});
const ejercicio = (): Ejercicio => {
  const r = validarEjercicio(claude, 'mio-test');
  if (!r.ok) throw new Error(r.motivo);
  return r;
};

describe('guardar el ejercicio de Claude', () => {
  it('mientras es borrador no hay nada guardado', () => {
    const e = ejercicio();
    fichaDeEjercicio(e, CUESTIONARIO_VACIO);
    expect(datos.size).toBe(0);
    expect(leerMios()).toEqual([]);
    expect(leerFichas()).toEqual([]);
  });

  it('la ficha es corta y apunta a su pizarra', () => {
    const f = fichaDeEjercicio(ejercicio(), { ...CUESTIONARIO_VACIO, edad: 'Infantil' });
    expect(f).toMatchObject({ nombre: 'Pase y corte', minutos: 10, material: '1 balón', jugadoras: '3', edad: 'Infantil', sistemaId: 'mio-test' });
    expect(f.pasos).toEqual(['1 pasa a 2 y corta', '2 devuelve a 1']);
  });

  it('Guardar crea el Sistema propio y la ficha enlazada', () => {
    const r = guardarEjercicio(ejercicio(), CUESTIONARIO_VACIO);
    expect(r.ok).toBe(true);
    expect(leerMios().map((s) => s.id)).toEqual(['mio-test']);
    expect(leerFichas()).toHaveLength(1);
    expect(leerFichas()[0].sistemaId).toBe('mio-test');
  });

  it('si la ficha viene de un recurso, lo conserva', () => {
    const rec = nuevoRecurso({ titulo: 'Ejemplo Uno', enlace: 'https://ejemplo.com/a' });
    const r = guardarEjercicio(ejercicio(), CUESTIONARIO_VACIO, rec);
    expect(r.ok && r.ficha.recursoId).toBe(rec.id);
  });

  it('si el móvil no deja guardar la ficha, no queda la pizarra sola', () => {
    lleno = true;
    const r = guardarEjercicio(ejercicio(), CUESTIONARIO_VACIO);
    expect(r.ok).toBe(false);
    expect(leerMios()).toEqual([]);
    expect(leerFichas()).toEqual([]);
  });

  it('añadir la ficha dos veces no la duplica (retocar y guardar)', () => {
    const f = fichaDeEjercicio(ejercicio(), CUESTIONARIO_VACIO);
    anadirFicha(f);
    anadirFicha({ ...f, sistemaId: 'mio-otro' });
    expect(leerFichas()).toHaveLength(1);
    expect(leerFichas()[0].sistemaId).toBe('mio-otro');
  });

  it('copia de seguridad: la pizarra y la ficha vuelven enlazadas, con sus jugadoras y sin balón', () => {
    const e = ejercicio();
    e.sistema.sinBalon = true;
    guardarEjercicio(e, CUESTIONARIO_VACIO);
    const copia = leerCopia(armarCopia(leerMios(), {} as never, undefined, undefined, undefined, leerFichas()));
    expect(copia.mios[0]).toMatchObject({ id: 'mio-test', visibles: ['1', '2', '3'], sinBalon: true });
    expect(copia.fichas?.[0].sistemaId).toBe('mio-test');
    // pegar la copia en un móvil vacío
    datos.clear();
    guardarTodosMios(copia.mios);
    expect(leerMios()[0].pasos).toHaveLength(2);
  });
});
