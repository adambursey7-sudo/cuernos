// Compartir como texto (tramo 5): un ejercicio o una colección entera, listos para pegar en WhatsApp.
// Solo sale lo que escribió el entrenador y el enlace de origen como crédito; nada de la copia de seguridad ni de Jarvis.
import { NIVELES } from '../sistemas/tipos';
import { pasosDe, type Ficha } from './fichas';

const PIE = 'Hecho con Horns';

export function textoFicha(f: Ficha): string {
  const nivel = NIVELES.find((n) => n.id === f.nivel)?.nombre;
  const datos = [f.categoria, nivel, f.edad, f.minutos ? `${f.minutos} min` : '', f.jugadoras && `${f.jugadoras} jugadoras`].filter(Boolean).join(' · ');
  const pasos = pasosDe(f);
  const partes = [
    `*${f.nombre}*`,
    datos,
    f.objetivo && `Objetivo: ${f.objetivo}`,
    f.material && `Material: ${f.material}`,
    f.espacio && `Espacio: ${f.espacio}`,
    pasos.length > 0 && `Cómo se juega:\n${pasos.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
    f.consejos && `Consejos: ${f.consejos}`,
    f.variantes && `Variantes: ${f.variantes}`,
    f.fuente && `Fuente: ${f.fuente}`,
  ];
  return partes.filter(Boolean).join('\n\n');
}

export function textoColeccion(nombre: string, fichas: Ficha[]): string {
  const cuerpo = fichas.map(textoFicha).join('\n\n———\n\n');
  return `*${nombre}* (${fichas.length} ${fichas.length === 1 ? 'ejercicio' : 'ejercicios'})\n\n${cuerpo}\n\n${PIE}`;
}

/** Abre el menú de compartir del móvil; si no hay, copia el texto. Devuelve lo que pasó, para avisar. */
export async function enviarTexto(texto: string): Promise<'enviado' | 'copiado' | 'nada'> {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ text: texto });
      return 'enviado';
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'nada';   // cerró el menú
  }
  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'nada';
  }
}
