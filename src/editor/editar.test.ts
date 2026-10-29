import { describe, expect, it } from 'vitest';
import { SISTEMAS } from '../sistemas/datos';
import { esSistemaValido } from '../sistemas/almacen';
import type { Paso } from '../sistemas/tipos';
import { adivinar, ajustarCurva, cambiarTipo, describir, limpiar, mover, nuevoBorrador, opcionesDe, pasar } from './editar';

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

  it('un camino recto del dedo da una flecha recta y uno curvo, una curva que pasa por su mitad', () => {
    expect(ajustarCurva([[75, 100], [75.5, 80], [75, 60]])).toBeUndefined();
    // Arco que se separa 10 dm a la derecha a mitad de camino.
    const arco: [number, number][] = [[75, 100], [82, 90], [85, 80], [82, 70], [75, 60]];
    const por = ajustarCurva(arco)!;
    expect(por[0]).toBeCloseTo(95, 0);
    expect(por[1]).toBeCloseTo(80, 0);
  });

  it('adivina el movimiento: con balón bota, pegado a un compañero bloquea y si no, corta', () => {
    expect(adivinar(true, [100, 80], [[95, 80]])).toBe('bote');
    expect(adivinar(false, [86, 88], [[75, 100], [80, 90]])).toBe('bloqueo');
    expect(adivinar(false, [80, 28], [[75, 100]])).toBe('corte');
  });

  it('tocar la etiqueta cambia el movimiento y conserva la curva', () => {
    const p0 = mover({ texto: '', movimientos: [] }, '5', 'corte', [80, 30], [90, 60]);
    const p1 = cambiarTipo(p0, '5', opcionesDe(false));
    expect(p1.movimientos).toEqual([{ tipo: 'bloqueo', jugador: '5', a: [80, 30], por: [90, 60] }]);
    expect(p1.texto).toBe('5 bloquea.');
    expect(cambiarTipo(p1, '5', opcionesDe(false)).movimientos[0].tipo).toBe('corte');
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
