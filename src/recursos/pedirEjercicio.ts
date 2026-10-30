// Pide a Claude un ejercicio con pizarra: un encargo, y si la respuesta no vale, UN reintento diciendo qué falló.
// Si vuelve a fallar se devuelve el motivo para ofrecer la ficha de solo texto. Nunca guarda nada.
import { leerEspacios, type Espacio } from '../sistemas/espacios';
import { construirEncargoEjercicio, type Cuestionario } from './ia';
import { validarEjercicio, type Resultado } from './ejercicioIA';
import { enviar, esperar, type Conexion } from './jarvis';
import type { Recurso } from './recursos';

export type Pedido = Extract<Resultado, { ok: true }> | { ok: false; motivo: string; intentos: number };

interface Via {
  enviar: (c: Conexion, prompt: string, modo?: 'ejercicio') => Promise<string>;
  esperar: (c: Conexion, id: string, parar: () => boolean) => Promise<string>;
}

const REAL: Via = { enviar, esperar: (c, id, parar) => esperar(c, id, parar) };

/** Los errores de conexión (Jarvis caído, cupo lleno, «Cancelado»…) suben como excepción: solo la respuesta mala se reintenta. */
export async function pedirEjercicio(c: Conexion, cuestionario: Cuestionario, id: string, recurso?: Recurso, via: Via = REAL, parar: () => boolean = () => false, espacios: Espacio[] = leerEspacios()): Promise<Pedido> {
  let motivo = '';
  for (let intento = 1; intento <= 2; intento++) {
    const pedido = await via.enviar(c, construirEncargoEjercicio(cuestionario, recurso, motivo || undefined, espacios), 'ejercicio');
    const r = validarEjercicio(await via.esperar(c, pedido, parar), id, espacios);
    if (r.ok) return r;
    motivo = r.motivo;
  }
  return { ok: false, motivo, intentos: 2 };
}
