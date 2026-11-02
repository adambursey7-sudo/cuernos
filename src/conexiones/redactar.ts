// Mensajes para las familias redactados con IA. En todo lo que sale hay solo dorsales: antes de enviar se cambian los nombres
// y, al volver, se comprueba que la respuesta no trae ninguno.
import { anonimizar } from '../bandeja/bandeja';

export const PROMPT_FAMILIAS = `You write short messages from a youth basketball coach to the families of the team.
Rules:
- Write in Spanish (Spain), warm but brief: at most 120 words, no emojis, no hashtags.
- Use only the facts below. Do not invent dates, places, scores or promises.
- Players appear only as jersey numbers, like #7. Never write a child's name.
- Reply with ONLY the message, ready to paste.`;

export function promptFamilias(hechos: string, peticion: string): string {
  return `${PROMPT_FAMILIAS}\n\nFACTS:\n${hechos.trim().slice(0, 3000)}\n\nWHAT THE COACH WANTS TO SAY:\n${peticion.trim().slice(0, 600)}`;
}

/** Texto anonimizado (hechos y petición) listo para enseñar antes de enviar. */
export function prepararEnvio(hechos: string, peticion: string, plantilla: { nombre: string; numero: string }[]) {
  const h = anonimizar(hechos, plantilla);
  const p = anonimizar(peticion, plantilla);
  return { hechos: h.texto, peticion: p.texto, cambios: h.cambios + p.cambios };
}

/** Nombres de la plantilla que han colado en un texto (para avisar antes de copiarlo). */
export function nombresQueColan(texto: string, plantilla: { nombre: string }[]): string[] {
  return plantilla.filter((j) => j.nombre.trim() && anonimizar(texto, [{ nombre: j.nombre, numero: '' }]).cambios > 0).map((j) => j.nombre.trim());
}

/** Quita vallas de código y comillas sueltas que a veces trae la respuesta. */
export const limpiarMensaje = (t: string) => t.replace(/```[a-z]*\n?/gi, '').trim().replace(/^["“]|["”]$/g, '').trim().slice(0, 1500);
