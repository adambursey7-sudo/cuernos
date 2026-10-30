import { describe, expect, it } from 'vitest';
import { CUESTIONARIO_VACIO } from './ia';
import { espaciosDeSiempre } from '../sistemas/espacios';
import { pedirEjercicio } from './pedirEjercicio';

const con = { url: 'https://x.ts.net', token: 't' };
const bueno = JSON.stringify({ nombre: 'Pase 2x0', jugadoras: { '1': [75, 100], '2': [30, 70] }, balon: '1', pasos: [{ texto: 'pasa', movimientos: [{ tipo: 'pase', de: '1', a: '2' }] }] });

function via(respuestas: string[]) {
  const enviados: { prompt: string; modo?: string }[] = [];
  return {
    enviados,
    enviar: async (_c: unknown, prompt: string, modo?: 'ejercicio') => (enviados.push({ prompt, modo }), `id${enviados.length}`),
    esperar: async (_c: unknown, id: string) => respuestas[Number(id.slice(2)) - 1],
  };
}

describe('pedir un ejercicio a Claude', () => {
  it('el encargo lleva los espacios del entrenador con sus nombres, también en el reintento', async () => {
    const espacios = espaciosDeSiempre();
    espacios[1].nombre = 'Alero izquierdo';
    const v = via(['basura', bueno]);
    await pedirEjercicio(con, CUESTIONARIO_VACIO, 'mio-1', undefined, v, undefined, espacios);
    expect(v.enviados).toHaveLength(2);
    for (const e of v.enviados) expect(e.prompt).toContain('Alero izquierdo: [22,60]');
  });

  it('a la primera: un solo encargo, en modo ejercicio', async () => {
    const v = via([bueno]);
    const r = await pedirEjercicio(con, { ...CUESTIONARIO_VACIO, objetivo: 'pase' }, 'mio-1', undefined, v);
    expect(r.ok).toBe(true);
    expect(v.enviados).toHaveLength(1);
    expect(v.enviados[0].modo).toBe('ejercicio');
    expect(v.enviados[0].prompt).toContain('pase');
  });

  it('si falla una vez, reintenta diciendo qué falló', async () => {
    const v = via(['Aquí tienes: ' + bueno, bueno]);
    const r = await pedirEjercicio(con, CUESTIONARIO_VACIO, 'mio-1', undefined, v);
    expect(r.ok).toBe(true);
    expect(v.enviados).toHaveLength(2);
    expect(v.enviados[1].prompt).toContain('fuera del JSON');
    expect(v.enviados[0].prompt).not.toContain('rejected');
  });

  it('si falla dos veces, se rinde con el motivo y sin tercer intento', async () => {
    const v = via(['basura', 'otra basura']);
    const r = await pedirEjercicio(con, CUESTIONARIO_VACIO, 'mio-1', undefined, v);
    expect(r).toMatchObject({ ok: false, intentos: 2 });
    expect(v.enviados).toHaveLength(2);
  });

  it('un error de conexión no se reintenta como respuesta mala', async () => {
    const v = via([]);
    v.enviar = async () => {
      throw new Error('sin Jarvis');
    };
    await expect(pedirEjercicio(con, CUESTIONARIO_VACIO, 'mio-1', undefined, v)).rejects.toThrow('sin Jarvis');
  });
});
