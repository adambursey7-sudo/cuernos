// Pide a Claude un ejercicio con pizarra: un encargo, y si la respuesta no vale, UN reintento diciendo qué falló.
// Si vuelve a fallar se devuelve el motivo para ofrecer la ficha de solo texto. Nunca guarda nada.
import { construirEncargoEjercicio, type Cuestionario } from './ia';
import { validarEjercicio, type Resultado } from './ejercicioIA';
import { enviar, esperar, type Conexion } from './jarvis';
import type { Recurso } from './recursos';

export type Pedido = Extract<Resultado, { ok: true }> | { ok: false; motivo: string; intentos: number };

interface Via {
  enviar: (c: Conexion, prompt: string, modo?: 'ejercicio') => Promise<string>;
  esperar: (c: Conexion, id: string) => Promise<string>;
}

const REAL: Via = { enviar, esperar: (c, id) => esperar(c, id) };

/** Los errores de conexión (Jarvis caído, cupo lleno…) suben como excepción: solo la respuesta mala se reintenta. */
export async function pedirEjercicio(c: Conexion, cuestionario: Cuestionario, id: string, recurso?: Recurso, via: Via = REAL): Promise<Pedido> {
  let motivo = '';
  for (let intento = 1; intento <= 2; intento++) {
    const pedido = await via.enviar(c, construirEncargoEjercicio(cuestionario, recurso, motivo || undefined), 'ejercicio');
    const r = validarEjercicio(await via.esperar(c, pedido), id);
    if (r.ok) return r;
    motivo = r.motivo;
  }
  return { ok: false, motivo, intentos: 2 };
}
