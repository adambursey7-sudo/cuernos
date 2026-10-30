import { beforeEach, describe, expect, it } from 'vitest';
import {
  ESPACIOS_BASE, esExterior, espacioMasCercano, espaciosDeSiempre, guardarEspacios, leerEspacios, nombreLimpio, pegarAEspacio,
  textoEspacios, validarEspacios, volverAEspaciosDeSiempre,
} from './espacios';

let datos: Map<string, string>;
let lleno: boolean;
beforeEach(() => {
  datos = new Map();
  lleno = false;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (lleno) throw new Error('lleno');
      datos.set(k, v);
    },
    removeItem: (k: string) => void datos.delete(k),
  };
});

describe('espacios de la cancha', () => {
  it('son 9: 5 fuera de la línea de tres y 4 dentro', () => {
    expect(ESPACIOS_BASE).toHaveLength(9);
    expect(ESPACIOS_BASE.filter((e) => esExterior(e.punto))).toHaveLength(5);
    expect(ESPACIOS_BASE.filter((e) => !esExterior(e.punto))).toHaveLength(4);
  });

  it('sin nada guardado salen los de siempre, y no se comparte la lista', () => {
    expect(leerEspacios()).toEqual(ESPACIOS_BASE);
    const a = espaciosDeSiempre();
    a[0].punto[0] = 99;
    expect(ESPACIOS_BASE[0].punto[0]).toBe(8);
  });

  it('mover y renombrar se guarda y se recuerda', () => {
    const e = espaciosDeSiempre();
    e[7] = { ...e[7], nombre: 'Poste bajo izquierdo', punto: [55, 30] };
    expect(guardarEspacios(e)).toBe(true);
    expect(leerEspacios()[7]).toMatchObject({ id: 'bloque-izq', nombre: 'Poste bajo izquierdo', punto: [55, 30] });
  });

  it('volver a los de siempre borra lo guardado', () => {
    guardarEspacios(espaciosDeSiempre().map((e) => ({ ...e, nombre: 'X' })));
    volverAEspaciosDeSiempre();
    expect(leerEspacios()).toEqual(ESPACIOS_BASE);
  });

  it('lo guardado roto o a medias se arregla espacio por espacio', () => {
    datos.set('horns.espacios', '{nope');
    expect(leerEspacios()).toEqual(ESPACIOS_BASE);
    const r = validarEspacios([{ id: 'frontal', nombre: '   ', punto: [500, -20] }, { id: 'ala-izq', nombre: 'Alero', punto: 'raro' }, 7, null]);
    expect(r).toHaveLength(9);
    expect(r.find((e) => e.id === 'frontal')).toMatchObject({ nombre: 'Frontal', punto: [146, 4] });
    expect(r.find((e) => e.id === 'ala-izq')).toMatchObject({ nombre: 'Alero', punto: [22, 60] });
  });

  it('el nombre sale limpio y corto, sin HTML', () => {
    expect(nombreLimpio('  <b>Alero</b>\n  izq  ')).toBe('Alero izq');
    expect(nombreLimpio('x'.repeat(100))).toHaveLength(30);
    expect(nombreLimpio(5)).toBe('');
  });

  it('si el móvil está lleno, guardar avisa y no rompe', () => {
    lleno = true;
    expect(guardarEspacios(espaciosDeSiempre())).toBe(false);
  });

  it('el espacio más cercano y pegar solo si está cerca', () => {
    expect(espacioMasCercano([60, 70], ESPACIOS_BASE).id).toBe('poste-alto-izq');
    expect(pegarAEspacio([24, 58], ESPACIOS_BASE)).toEqual([22, 60]);
    expect(pegarAEspacio([75, 130], ESPACIOS_BASE)).toEqual([75, 130]);
  });

  it('al cambiar un punto de lado, cambia de fuera a dentro en el texto para Claude', () => {
    const e = espaciosDeSiempre();
    e[1].punto = [60, 40];
    const t = textoEspacios(e);
    const dentro = t.slice(t.indexOf('INSIDE'));
    expect(dentro).toContain('Ala izquierda: [60,40]');
    expect(t.slice(0, t.indexOf('INSIDE'))).not.toContain('Ala izquierda');
  });

  it('el texto para Claude lleva los 9 nombres del entrenador', () => {
    const e = espaciosDeSiempre();
    e[0].nombre = 'Alero esquina';
    const t = textoEspacios(e);
    expect(t).toContain('Alero esquina: [8,12]');
    expect((t.match(/: \[/g) ?? []).length).toBe(9);
  });
});
