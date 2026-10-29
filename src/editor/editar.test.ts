import { describe, expect, it } from 'vitest';
import { SISTEMAS } from '../sistemas/datos';
import { esSistemaValido } from '../sistemas/almacen';
import type { Paso } from '../sistemas/tipos';
import { curvar, describir, limpiar, mover, nuevoBorrador, pasar } from './editar';

describe('editor', () => {
  it('una jugada nueva empieza con cinco abiertos y el balón en el 1', () => {
    const b = nuevoBorrador();
    expect(b.balon).toBe('1');
    expect(b.pasos).toEqual([]);
    expect(b.propio).toBe(true);
  });

  it('duplicar un sistema del libro crea una variante aparte', () => {
    const base = SISTEMAS[0];
    const v = nuevoBorrador(base);
    expect(v.id).not.toBe(base.id);
    expect(v.nombre).toBe('Cuernos (variante)');
    expect(v.pasos.length).toBe(base.pasos.length);
    v.pasos[0].texto = 'cambiado';
    expect(base.pasos[0].texto).not.toBe('cambiado');
  });

  it('el nuevo movimiento de un jugador sustituye al anterior y el texto se escribe solo', () => {
    let p: Paso = { texto: '', movimientos: [] };
    p = mover(p, '5', 'corte', [80, 30]);
    p = mover(p, '5', 'bloqueo', [86.4, 87.6]);
    expect(p.movimientos).toEqual([{ tipo: 'bloqueo', jugador: '5', a: [86, 88] }]);
    expect(p.texto).toBe('5 bloquea.');
  });

  it('un texto escrito a mano no se pisa', () => {
    const p = mover({ texto: 'Mi explicación', movimientos: [] }, '1', 'bote', [70, 90]);
    expect(p.texto).toBe('Mi explicación');
  });

  it('tocar la flecha la curva a un lado, luego al otro y luego la deja recta', () => {
    const p0 = mover({ texto: '', movimientos: [] }, '1', 'corte', [75, 60]);
    const desde: [number, number] = [75, 100];
    const p1 = curvar(p0, '1', desde);
    const p2 = curvar(p1, '1', desde);
    const p3 = curvar(p2, '1', desde);
    const por = (p: Paso) => (p.movimientos[0] as { por?: [number, number] }).por;
    expect(por(p1)).toEqual([85, 80]);
    expect(por(p2)).toEqual([65, 80]);
    expect(por(p3)).toBeUndefined();
  });

  it('solo un pase por paso', () => {
    const p = pasar(pasar({ texto: '', movimientos: [] }, '1', '4'), '1', '5');
    expect(p.movimientos).toEqual([{ tipo: 'pase', de: '1', a: '5' }]);
    expect(describir(p.movimientos)).toBe('1 pasa a 5.');
  });

  it('al guardar se quitan los pasos vacíos del final y queda una jugada válida', () => {
    const b = nuevoBorrador();
    b.pasos = [mover({ texto: '', movimientos: [] }, '1', 'bote', [70, 90]), { texto: '', movimientos: [] }];
    const g = limpiar(b);
    expect(g.pasos.length).toBe(1);
    expect(esSistemaValido(g)).toBe(true);
  });
});
