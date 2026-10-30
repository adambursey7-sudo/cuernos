import { describe, expect, it } from 'vitest';
import { esSistemaValido } from '../sistemas/almacen';
import { ESPACIOS_BASE } from '../sistemas/espacios';
import { LIMITE_RESPUESTA, validarEjercicio } from './ejercicioIA';

const bueno = () => ({
  nombre: 'Pase y corte 3x0',
  objetivo: 'Pasar y cortar a canasta',
  minutos: 10,
  material: '1 balón',
  jugadoras: { '1': [75, 100], '2': [30, 70], '3': [120, 70] },
  balon: '1',
  pasos: [
    { texto: '1 pasa a 2 y corta', movimientos: [{ tipo: 'pase', de: '1', a: '2' }, { tipo: 'corte', jugador: '1', a: [75, 40] }, { tipo: 'corte', jugador: '3', a: [110, 80] }] },
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
      con((x) => { Object.assign(x.jugadoras, { '4': [20, 20], '5': [130, 20] }); x.pasos[1].movimientos.push({ tipo: 'corte', jugador: '4', a: [30, 30] } as never, { tipo: 'corte', jugador: '5', a: [120, 30] } as never); }),
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
      sucio((x) => { x.pasos[0].movimientos = [{ tipo: 'bote', jugador: 1, a: [60, 60], por: [70, 80] }, { tipo: 'corte', jugador: '2', a: [30, 90] }, { tipo: 'corte', jugador: '3', a: [110, 80] }]; x.pasos[1].movimientos = []; }),
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

describe('ejercicio de Claude: reglas de la pista y del balón', () => {
  it('pasa quien no tiene el balón: se rechaza con el motivo', () => {
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'pase', de: '2', a: '3' }])))).toMatch(/pasa sin tener el balón/);
  });

  it('cortar con el balón en las manos (sería andar) se rechaza', () => {
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'corte', jugador: '1', a: [75, 40] }])))).toMatch(/corta con el balón/);
  });

  it('botar sin balón se rechaza', () => {
    expect(motivo(sucio((x) => (x.pasos[0].movimientos = [{ tipo: 'bote', jugador: '2', a: [40, 60] }])))).toMatch(/bota sin tener el balón/);
  });

  it('pasar y luego cortar en el mismo paso vale; el balón sigue a quien lo recibe', () => {
    expect(validarEjercicio(JSON.stringify(bueno()), 'a').ok).toBe(true);
  });

  it('pasar y que quien recibe bote en el mismo paso vale', () => {
    expect(validarEjercicio(sucio((x) => { x.pasos[0].movimientos = [{ tipo: 'pase', de: '1', a: '2' }, { tipo: 'bote', jugador: '2', a: [40, 50] }, { tipo: 'corte', jugador: '3', a: [110, 80] }]; x.pasos[1].movimientos = []; }), 'a').ok).toBe(true);
  });

  it('un pase entre jugadoras pegadas se rechaza', () => {
    expect(motivo(sucio((x) => (x.jugadoras['2'] = [75, 110])))).toMatch(/casi pegadas/);
  });

  it('dos jugadoras que empiezan casi encima se rechazan', () => {
    expect(motivo(sucio((x) => (x.jugadoras['2'] = [75, 104])))).toMatch(/demasiado juntas/);
  });

  it('sin balón (lo tiene alguien que no sale) no se aplican las reglas del balón', () => {
    expect(validarEjercicio(sucio((x) => { delete x.balon; x.pasos[0].movimientos = [{ tipo: 'corte', jugador: '1', a: [75, 40] }, { tipo: 'corte', jugador: '2', a: [30, 90] }, { tipo: 'corte', jugador: '3', a: [110, 80] }]; x.pasos[1].movimientos = []; }), 'a').ok).toBe(true);
  });

  it('con los espacios del entrenador, una jugadora que queda cerca se coloca en su espacio', () => {
    const r = validarEjercicio(sucio((x) => (x.jugadoras['2'] = [26, 57])), 'a', ESPACIOS_BASE);
    expect(r.ok && r.sistema.inicio['2']).toEqual([22, 60]);
  });

  it('el final de un movimiento también se pega al espacio cercano, y lejos se deja como está', () => {
    const r = validarEjercicio(sucio((x) => { x.pasos[0].movimientos = [{ tipo: 'pase', de: '1', a: '2' }, { tipo: 'corte', jugador: '1', a: [52, 31] }, { tipo: 'corte', jugador: '3', a: [110, 80] }]; }), 'a', ESPACIOS_BASE);
    expect(r.ok && r.sistema.pasos[0].movimientos[1]).toMatchObject({ a: [52, 28] });
    const lejos = validarEjercicio(sucio((x) => { x.pasos[0].movimientos = [{ tipo: 'pase', de: '1', a: '2' }, { tipo: 'corte', jugador: '1', a: [75, 40] }, { tipo: 'corte', jugador: '3', a: [110, 80] }]; }), 'a', ESPACIOS_BASE);
    expect(lejos.ok && lejos.sistema.pasos[0].movimientos[1]).toMatchObject({ a: [75, 40] });
  });

  it('dos jugadoras en el mismo espacio se rechazan', () => {
    expect(motivo2(sucio((x) => { x.jugadoras['2'] = [24, 59]; x.jugadoras['3'] = [20, 61]; }))).toMatch(/mismo espacio/);
  });
});

const motivo2 = (crudo: string) => {
  const r = validarEjercicio(crudo, 'mio-1', ESPACIOS_BASE);
  if (r.ok) throw new Error('debía rechazarse');
  return r.motivo;
};

describe('ejercicio de Claude: lógica de baloncesto', () => {
  const ej = (jugadoras: Record<string, number[]>, pasos: { texto: string; movimientos: object[] }[], balon = '1') =>
    JSON.stringify({ nombre: 'Prueba', objetivo: 'x', minutos: 5, material: '1 balón', jugadoras, balon, pasos });
  const tres = { '1': [75, 85], '2': [22, 60], '3': [128, 60] };
  const corta = { tipo: 'corte', jugador: '1', a: [142, 12] };
  const pasa = { tipo: 'pase', de: '1', a: '2' };

  it('quien pasa y corta deja el frontal vacío mientras otra se queda quieta: se rechaza y se dice quién', () => {
    const m = motivo(ej(tres, [{ texto: '1 pasa a 2 y corta', movimientos: [pasa, corta] }, { texto: '2 bota', movimientos: [{ tipo: 'bote', jugador: '2', a: [40, 70] }] }]));
    expect(m).toMatch(/paso 1: la jugadora 1 deja libre Frontal/);
    expect(m).toMatch(/jugadora 3 está quieta/);
  });

  it('si la compañera sube al frontal en el mismo paso, vale', () => {
    const r = validarEjercicio(ej(tres, [{ texto: '1 pasa a 2 y corta', movimientos: [pasa, corta, { tipo: 'corte', jugador: '3', a: [75, 85] }] }, { texto: '2 pasa a 3', movimientos: [{ tipo: 'pase', de: '2', a: '3' }] }]), 'a');
    expect(r.ok).toBe(true);
  });

  it('si la ocupa en el paso siguiente, también vale', () => {
    const r = validarEjercicio(ej(tres, [{ texto: '1 pasa a 2 y corta', movimientos: [pasa, corta] }, { texto: '3 sube al frontal', movimientos: [{ tipo: 'corte', jugador: '3', a: [75, 85] }, { tipo: 'bote', jugador: '2', a: [40, 70] }] }]), 'a');
    expect(r.ok).toBe(true);
  });

  it('en el último paso no se exige rellenar (el bucle se cierra en el texto)', () => {
    const r = validarEjercicio(ej(tres, [{ texto: '1 pasa a 2', movimientos: [pasa, { tipo: 'corte', jugador: '3', a: [110, 75] }] }, { texto: '1 corta y 2 pasa', movimientos: [corta, { tipo: 'corte', jugador: '3', a: [128, 60] }] }]), 'a');
    expect(r.ok).toBe(true);
  });

  it('con solo dos jugadoras no hay nadie más que pueda rellenar', () => {
    const r = validarEjercicio(ej({ '1': [75, 85], '2': [128, 60] }, [{ texto: '1 pasa a 2 y corta', movimientos: [{ tipo: 'pase', de: '1', a: '2' }, { tipo: 'corte', jugador: '1', a: [75, 45] }] }, { texto: '2 devuelve', movimientos: [{ tipo: 'pase', de: '2', a: '1' }] }]), 'a');
    expect(r.ok).toBe(true);
  });

  it('quien tiene el balón no cuenta como la que debía rellenar', () => {
    const r = validarEjercicio(ej({ '1': [75, 85], '2': [128, 60] }, [{ texto: '1 corta a canasta', movimientos: [{ tipo: 'corte', jugador: '1', a: [75, 45] }] }, { texto: '2 pasa a 1', movimientos: [{ tipo: 'pase', de: '2', a: '1' }] }], '2'), 'a');
    expect(r.ok).toBe(true);
  });

  it('con tres jugadoras o más, una que no hace nada en todo el ejercicio se rechaza', () => {
    const m = motivo(ej({ '1': [75, 85], '2': [22, 60], '3': [128, 60] }, [{ texto: '1 pasa a 2', movimientos: [pasa] }, { texto: '2 devuelve', movimientos: [{ tipo: 'pase', de: '2', a: '1' }] }]));
    expect(m).toMatch(/la jugadora 3 no hace nada/);
  });

  it('una que solo recibe un pase sí hace algo', () => {
    const r = validarEjercicio(ej(tres, [{ texto: '1 pasa a 3', movimientos: [{ tipo: 'pase', de: '1', a: '3' }] }, { texto: '3 pasa a 2', movimientos: [{ tipo: 'pase', de: '3', a: '2' }] }]), 'a');
    expect(r.ok).toBe(true);
  });

  it('con los espacios del entrenador movidos de sitio, usa sus nombres', () => {
    const mios = ESPACIOS_BASE.map((e) => (e.id === 'frontal' ? { ...e, nombre: 'Cabeza' } : e));
    const r = validarEjercicio(ej(tres, [{ texto: '1 pasa a 2 y corta', movimientos: [pasa, corta] }, { texto: '2 bota', movimientos: [{ tipo: 'bote', jugador: '2', a: [40, 70] }] }]), 'a', mios);
    expect(r.ok ? '' : r.motivo).toMatch(/deja libre Cabeza/);
  });

  it('un relevo en cadena (la del ala sube al frontal y la de la esquina al ala) no es abandonar el último sitio', () => {
    const cinco = { '1': [75, 85], '2': [22, 60], '3': [128, 60], '4': [8, 12], '5': [142, 12] };
    const r = validarEjercicio(ej(cinco, [
      { texto: '1 bota a la derecha; 2 sube al frontal y 4 al ala', movimientos: [{ tipo: 'bote', jugador: '1', a: [95, 45] }, { tipo: 'corte', jugador: '2', a: [75, 85] }, { tipo: 'corte', jugador: '4', a: [22, 60] }] },
      { texto: '1 pasa a 3', movimientos: [{ tipo: 'pase', de: '1', a: '3' }] },
      { texto: '3 pasa a 5 en la esquina', movimientos: [{ tipo: 'pase', de: '3', a: '5' }] },
    ]), 'a');
    expect(r.ok ? '' : r.motivo).toBe('');
  });
});
