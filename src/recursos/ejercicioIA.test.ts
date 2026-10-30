import { describe, expect, it } from 'vitest';
import { esSistemaValido } from '../sistemas/almacen';
import { LIMITE_RESPUESTA, validarEjercicio } from './ejercicioIA';

const bueno = () => ({
  nombre: 'Pase y corte 3x0',
  objetivo: 'Pasar y cortar a canasta',
  minutos: 10,
  material: '1 balón',
  jugadoras: { '1': [75, 100], '2': [30, 70], '3': [120, 70] },
  balon: '1',
  pasos: [
    { texto: '1 pasa a 2 y corta', movimientos: [{ tipo: 'pase', de: '1', a: '2' }, { tipo: 'corte', jugador: '1', a: [75, 40] }] },
    { texto: '2 devuelve a 1', movimientos: [{ tipo: 'pase', de: '2', a: '1' }] },
  ],
});
const con = (cambio: (x: ReturnType<typeof bueno>) => void) => {
  const x = bueno();
  cambio(x);
  return JSON.stringify(x);
};
const motivo = (crudo: string) => {
  const r = validarEjercicio(crudo, 'mio-1');
  if (r.ok) throw new Error('debía rechazarse');
  return r.motivo;
};
// Para meter valores que el tipo no admite a propósito.
const sucio = (cambio: (x: Record<string, any>) => void) => {
  const x: Record<string, any> = bueno();
  cambio(x);
  return JSON.stringify(x);
};

describe('ejercicio de Claude: lo que se acepta', () => {
  it('convierte un ejercicio correcto en un Sistema propio que la pizarra puede usar', () => {
    const r = validarEjercicio(JSON.stringify(bueno()), 'mio-1');
    if (!r.ok) throw new Error(r.motivo);
    expect(esSistemaValido(r.sistema)).toBe(true);
    expect(r.sistema).toMatchObject({ id: 'mio-1', propio: true, visibles: ['1', '2', '3'], balon: '1' });
    expect(r.sistema.pasos).toHaveLength(2);
    expect(r.sistema.sinBalon).toBeUndefined();
    expect(r.minutos).toBe(10);
    expect(r.material).toBe('1 balón');
  });

  it('con cinco jugadoras no recorta a nadie', () => {
    const r = validarEjercicio(
      con((x) => Object.assign(x.jugadoras, { '4': [20, 20], '5': [130, 20] })),
      'a',
    );
    expect(r.ok && r.sistema.visibles).toBeUndefined();
  });

  it('acepta el JSON dentro de un bloque de código', () => {
    expect(validarEjercicio('```json\n' + JSON.stringify(bueno()) + '\n```', 'a').ok).toBe(true);
  });

  it('sin balón, el balón no se dibuja', () => {
    const r = validarEjercicio(sucio((x) => delete x.balon), 'a');
    expect(r.ok && r.sistema.sinBalon).toBe(true);
  });

  it('corrige lo que se pasa por poco de la pista y redondea', () => {
    const r = validarEjercicio(sucio((x) => (x.jugadoras['2'] = [-3, 145.6])), 'a');
    expect(r.ok && r.sistema.inicio['2']).toEqual([0, 140]);
  });

  it('admite puestos escritos como número y los movimientos con trayectoria', () => {
    const r = validarEjercicio(
      sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'bote', jugador: 1, a: [60, 60], por: [70, 80] }])),
      'a',
    );
    expect(r.ok && r.sistema.pasos[0].movimientos[0]).toEqual({ tipo: 'bote', jugador: '1', a: [60, 60], por: [70, 80] });
  });

  it('recorta los textos largos y los minutos raros se ignoran', () => {
    const r = validarEjercicio(
      sucio((x) => {
        x.nombre = 'N'.repeat(300);
        x.pasos[0].texto = 'p '.repeat(200);
        x.minutos = 900;
      }),
      'a',
    );
    if (!r.ok) throw new Error(r.motivo);
    expect(r.sistema.nombre.length).toBeLessThanOrEqual(60);
    expect(r.sistema.pasos[0].texto.length).toBeLessThanOrEqual(120);
    expect(r.minutos).toBeUndefined();
  });
});

describe('ejercicio de Claude: respuestas malas', () => {
  it('vacía, sin JSON o con basura', () => {
    expect(motivo('')).toContain('vacía');
    expect(motivo('   ')).toContain('vacía');
    expect(motivo('Lo siento, no puedo ayudarte con eso.')).toContain('no es un JSON');
    expect(motivo('[1,2,3]')).toContain('no es un JSON');
    expect(motivo('{"nombre": }')).toContain('no es válido');
  });

  it('JSON cortado a 12000 caracteres', () => {
    const largo = JSON.stringify(bueno()).replace('"pasos"', '"relleno":"' + 'x'.repeat(LIMITE_RESPUESTA) + '","pasos"');
    expect(motivo(largo.slice(0, LIMITE_RESPUESTA))).toContain('cortada');
    // Cortado justo en el final de una llave: sigue sin ser un JSON completo.
    const cortado = JSON.stringify({ ...bueno(), nota: 'y'.repeat(LIMITE_RESPUESTA) }).slice(0, LIMITE_RESPUESTA);
    expect(motivo(cortado)).toMatch(/cortó|cortada/);
  });

  it('explicación antes o después del JSON', () => {
    const j = JSON.stringify(bueno());
    expect(motivo('Aquí tienes el ejercicio:\n' + j)).toContain('fuera del JSON');
    expect(motivo(j + '\nEspero que te guste.')).toContain('fuera del JSON');
    expect(motivo('Aquí tienes:\n```json\n' + j + '\n```\nSuerte.')).toContain('fuera del JSON');
  });

  it('más de cinco puestos y puestos que no existen', () => {
    expect(motivo(con((x) => Object.assign(x.jugadoras, { '4': [1, 1], '5': [2, 2], '6': [3, 3] })))).toContain('más de 5');
    expect(motivo(con((x) => Object.assign(x.jugadoras, { '9': [1, 1] })))).toContain('puesto desconocido');
    expect(motivo(sucio((x) => (x.jugadoras = {})))).toContain('ninguna jugadora');
    expect(motivo(sucio((x) => (x.jugadoras = [[1, 2]])))).toContain('jugadoras');
  });

  it('jugadora repetida: la misma clave dos veces no multiplica jugadoras', () => {
    const r = validarEjercicio('{"nombre":"A","jugadoras":{"1":[10,10],"1":[20,20]},"balon":"1","pasos":[{"texto":"x","movimientos":[]}]}', 'a');
    expect(r.ok && r.sistema.visibles).toEqual(['1']);
  });

  it('pase a sí misma o a quien no sale', () => {
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'pase', de: '1', a: '1' }])))).toContain('a sí misma');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'pase', de: '1', a: '4' }])))).toContain('no sale');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'pase', de: '5', a: '1' }])))).toContain('no sale');
    expect(motivo(sucio((x) => (x.balon = '4')))).toContain('no sale');
  });

  it('coordenadas absurdas, negativas o que no son números', () => {
    expect(motivo(sucio((x) => (x.jugadoras['1'] = [-50, 10])))).toContain('fuera de la pista');
    expect(motivo(sucio((x) => (x.jugadoras['1'] = [10, 999])))).toContain('fuera de la pista');
    expect(motivo(sucio((x) => (x.jugadoras['1'] = ['10', 10])))).toContain('no es un número');
    expect(motivo(sucio((x) => (x.jugadoras['1'] = [10])))).toContain('[x, y]');
    expect(motivo(sucio((x) => (x.jugadoras['1'] = null)))).toContain('[x, y]');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'corte', jugador: '1', a: [1e9, 5] }])))).toContain('fuera de la pista');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'corte', jugador: '1', a: [5, 5], por: [-80, 5] }])))).toContain('fuera de la pista');
  });

  it('movimientos de una jugadora que no sale o de un tipo inventado', () => {
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'corte', jugador: '5', a: [5, 5] }])))).toContain('no sale');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'tiro', jugador: '1', a: [5, 5] }])))).toContain('tipo de movimiento');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = ['corta'])))).toContain('no es un movimiento');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = {})))).toContain('lista');
  });

  it('demasiados pasos, ninguno, o demasiados movimientos', () => {
    expect(motivo(sucio((x) => (x.pasos = Array.from({ length: 9 }, () => ({ texto: 'x', movimientos: [] })))))).toContain('más de 8');
    expect(motivo(sucio((x) => (x.pasos = [])))).toContain('faltan los pasos');
    expect(motivo(sucio((x) => delete x.pasos))).toContain('faltan los pasos');
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = Array.from({ length: 7 }, () => ({ tipo: 'corte', jugador: '1', a: [5, 5] })))))).toContain('demasiados movimientos');
  });

  it('etiquetas HTML y texto que no es texto', () => {
    expect(motivo(sucio((x) => (x.nombre = '<b>Pase</b>')))).toContain('HTML');
    expect(motivo(sucio((x) => (x.pasos[0].texto = 'Pasa <script>alert(1)</script>')))).toContain('HTML');
    expect(motivo(sucio((x) => (x.objetivo = '<img src=x onerror=1>')))).toContain('HTML');
    expect(motivo(sucio((x) => (x.material = '&lt;b&gt;')))).toContain('HTML');
    expect(motivo(sucio((x) => (x.nombre = 12)))).toContain('debe ser un texto');
    expect(motivo(sucio((x) => (x.pasos[1].texto = '  ')))).toContain('falta');
    expect(motivo(sucio((x) => delete x.nombre))).toContain('falta el nombre');
  });

  it('los símbolos de comparar en un texto normal no son HTML', () => {
    expect(validarEjercicio(sucio((x) => (x.pasos[0].texto = 'Ataca 2 > 1 y espera')), 'a').ok).toBe(true);
  });

  it('claves peligrosas no ensucian el resultado', () => {
    const r = validarEjercicio('{"nombre":"A","__proto__":{"propio":false},"jugadoras":{"1":[10,10]},"pasos":[{"texto":"x"}]}', 'a');
    expect(r.ok && r.sistema.propio).toBe(true);
    expect(({} as Record<string, unknown>).propio).toBeUndefined();
  });
});
