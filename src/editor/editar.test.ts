import { describe, expect, it } from 'vitest';
import { SISTEMAS } from '../sistemas/datos';
import { esSistemaValido } from '../sistemas/almacen';
import type { Paso } from '../sistemas/tipos';
import { PLANTILLAS, adivinar, ajustarCurva, cambiarTipo, describir, duplicarPaso, limpiar, mover, moverPaso, ponerFamilia, quitarPaso, nuevoBorrador, opcionesDe, pasar, fijarTipo, quitarMovimiento, quitarPase } from './editar';

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

describe('editor: elegir el movimiento', () => {
  const base: Paso = { texto: '', movimientos: [] };
  const con = mover(mover(base, '5', 'corte', [86, 88]), '1', 'bote', [92, 104]);

  it('fija el tipo sin tocar el camino y rehace el texto automático', () => {
    const p = fijarTipo(con, '5', 'bloqueo');
    expect(p.movimientos.find((m) => m.tipo === 'bloqueo')).toMatchObject({ jugador: '5', a: [86, 88] });
    expect(p.texto).toBe('1 bota; 5 bloquea.');
    expect(fijarTipo(base, '3', 'corte')).toBe(base);
  });

  it('quita el movimiento de un jugador o el pase', () => {
    expect(quitarMovimiento(con, '5').movimientos).toHaveLength(1);
    const conPase = pasar(con, '1', '5');
    expect(quitarPase(conPase).movimientos).toHaveLength(2);
  });
});

describe('pasos de la jugada', () => {
  const base = () => ({ ...nuevoBorrador(), pasos: [{ texto: 'uno', movimientos: [] }, { texto: 'dos', movimientos: [] }, { texto: 'tres', movimientos: [] }] });
  it('duplicar copia el paso detras de el, sin compartir datos', () => {
    const s = duplicarPaso(base(), 1);
    expect(s.pasos.map((p) => p.texto)).toEqual(['uno', 'dos', 'dos', 'tres']);
    s.pasos[2].texto = 'otro';
    expect(s.pasos[1].texto).toBe('dos');
  });
  it('mover cambia de sitio con el vecino y en los extremos no hace nada', () => {
    expect(moverPaso(base(), 0, 1).pasos.map((p) => p.texto)).toEqual(['dos', 'uno', 'tres']);
    const b = base();
    expect(moverPaso(b, 0, -1)).toBe(b);
    expect(moverPaso(b, 2, 1)).toBe(b);
  });
  it('quitar un paso lo borra, pero el ultimo que queda no' , () => {
    expect(quitarPaso(base(), 1).pasos.map((p) => p.texto)).toEqual(['uno', 'tres']);
    const solo = { ...base(), pasos: [{ texto: 'x', movimientos: [] }] };
    expect(quitarPaso(solo, 0)).toBe(solo);
  });
  it('la categoria de defensa o presion hace la jugada de defensa; las demas, de ataque; sin categoria, la quita', () => {
    expect(ponerFamilia(base(), 'defensa')).toMatchObject({ familia: 'defensa', tipo: 'defensa' });
    expect(ponerFamilia(base(), 'parado')).toMatchObject({ familia: 'parado', tipo: 'ataque' });
    expect(ponerFamilia(ponerFamilia(base(), 'parado'), undefined).familia).toBeUndefined();
    expect(ponerFamilia(ponerFamilia(base(), 'defensa'), undefined)).toMatchObject({ tipo: 'defensa' });
  });
});

describe('colocaciones listas', () => {
  it('quedan dentro de la pista y con los cinco jugadores', () => {
    for (const pl of PLANTILLAS) {
      for (const j of ['1', '2', '3', '4', '5'] as const) {
        const [x, y] = pl.inicio[j];
        expect(x >= 0 && x <= 150 && y >= 0 && y <= 140, `${pl.id} ${j}`).toBe(true);
      }
    }
  });
});
