import { describe, expect, it } from 'vitest';
import { foto } from '../pizarra/animar';
import { SISTEMAS } from '../sistemas/datos';
import { BORRADORES } from './borradores';
import { ejerciciosDe, filtrar, formatos } from './ejercicios';

const libro = SISTEMAS.flatMap(ejerciciosDe);
const de = (sistema: string, formato: string) => libro.find((e) => e.sistema.id === sistema && e.formato === formato)!;

describe('ejercicios', () => {
  it('cada borrador corresponde a una línea que existe en su ficha', () => {
    for (const clave of Object.keys(BORRADORES)) {
      const [id, linea] = clave.split('|');
      expect(SISTEMAS.find((s) => s.id === id)?.ejercicios, clave).toContain(linea);
    }
  });

  it('salen todos los de las fichas, con su formato y el nombre sin el formato', () => {
    expect(libro).toHaveLength(SISTEMAS.reduce((n, s) => n + s.ejercicios.length, 0));
    const e = de('cuernos', '2x0');
    expect(e.nombre).toBe('Bloqueo directo y continuación');
    expect(e.atacantes).toBe(2);
    expect(e.defensores).toBe(0);
    expect(e.nivel).toBe('infantil');
  });

  it('todos los del libro tienen pizarra, y lo que no sale de la ficha queda por revisar', () => {
    for (const e of libro) {
      expect(e.pizarra, e.id).toBeDefined();
      expect(e.porRevisar).toEqual(['tipo', 'tiempo', 'material', 'pizarra']);
    }
  });

  it('la pizarra solo mueve a los jugadores del ejercicio, y en un 2x0 hay dos', () => {
    for (const e of libro) {
      const vis = e.pizarra!.visibles;
      if (!vis) continue;
      if (e.atacantes) expect(vis.length, e.id).toBe(e.atacantes);
      for (const p of e.pizarra!.pasos)
        for (const m of p.movimientos) expect(vis, e.id).toContain(m.tipo === 'pase' ? m.de : m.jugador);
    }
  });

  it('la pizarra empieza donde están los jugadores al llegar a su primer paso', () => {
    const cuernos = SISTEMAS.find((s) => s.id === 'cuernos')!;
    const p = de('cuernos', '2x0').pizarra!;
    expect(p.inicio['1']).toEqual(foto(cuernos, 1).jugadores['1']);
    expect(p.balon).toBe('1');
    expect(p.sinBalon).toBe(false);
  });

  it('si el balón lo tiene alguien que no está en el ejercicio, no se dibuja', () => {
    expect(de('flex', '2x0').pizarra!.sinBalon).toBe(true);
  });

  it('con defensa lleva petos', () => {
    expect(de('cuernos', '2x2').material).toContain('Petos');
    expect(de('cuernos', '2x0').material).not.toContain('Petos');
  });

  it('filtra por formato, sistema y nivel del equipo', () => {
    expect(filtrar(libro, { formato: '5x5' }).every((e) => e.formato === '5x5')).toBe(true);
    expect(filtrar(libro, { sistema: 'flex' }).every((e) => e.sistema.id === 'flex')).toBe(true);
    // Cuernos Flex es desde cadete: no sale para un equipo infantil.
    expect(filtrar(libro, { nivel: 'infantil' }).some((e) => e.sistema.id === 'cuernos-flex')).toBe(false);
    expect(filtrar(libro, { nivel: 'cadete' }).some((e) => e.sistema.id === 'cuernos-flex')).toBe(true);
  });

  it('los formatos van de menos a más jugadores', () => {
    expect(formatos(libro)).toEqual(['2x0', '3x0', '2x2', '5x0', '3x3', '5x5']);
  });
});
