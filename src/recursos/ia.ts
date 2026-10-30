// «Pedir a Claude» (tramo 4): el cuestionario se suma a un texto base que el entrenador puede editar, y la respuesta
// vuelve como BORRADOR de ficha para revisar. Nada se envía sin que se vea el texto completo.
// El texto base va en inglés (así rinde mejor la IA); la ficha que devuelve va en español.
import { CATEGORIAS, nuevaFicha, type Ficha } from './fichas';
import type { Recurso } from './recursos';

const CLAVE_BASE = 'horns.ia.base';

export const PROMPT_BASE = `You are the assistant of a youth basketball coach. Write ONE practice drill sheet from the information below.
Rules:
- Do not invent plays, systems or diagrams. If something is unclear, leave that field empty.
- Keep it short and practical: 3 to 7 steps, each one a single short sentence.
- Write all the content in Spanish (Spain).
- Reply with ONLY a JSON object, with no text around it, using exactly these keys:
{"nombre": "", "objetivo": "", "categoria": "", "minutos": 10, "material": "", "pasos": ["", ""], "consejos": "", "variantes": ""}
- "categoria" must be one of: ${CATEGORIAS.join(', ')}.`;

export interface Cuestionario {
  objetivo: string;
  edad: string;
  jugadoras: string;
  minutos: string;
  material: string;
  espacio: string;
  notas: string;
}

export const CUESTIONARIO_VACIO: Cuestionario = { objetivo: '', edad: '', jugadoras: '', minutos: '', material: '', espacio: '', notas: '' };

const ETIQUETAS: [keyof Cuestionario, string][] = [
  ['objetivo', 'Goal of the drill'],
  ['edad', 'Age group'],
  ['jugadoras', 'Number of players'],
  ['minutos', 'Time available (minutes)'],
  ['material', 'Equipment available'],
  ['espacio', 'Space'],
  ['notas', 'Extra notes'],
];

/** El texto base guardado por el entrenador, o el de fábrica. */
export function leerBase(): string {
  try {
    const t = localStorage.getItem(CLAVE_BASE);
    return t && t.trim() ? t : PROMPT_BASE;
  } catch {
    return PROMPT_BASE;
  }
}

/** Guarda el texto base; si es igual al de fábrica (o está vacío) se borra la copia. Devuelve false si no deja guardar. */
export function guardarBase(texto: string): boolean {
  try {
    if (!texto.trim() || texto === PROMPT_BASE) localStorage.removeItem(CLAVE_BASE);
    else localStorage.setItem(CLAVE_BASE, texto.slice(0, 4000));
    return true;
  } catch {
    return false;
  }
}

const una = (t: string, max: number) => t.replace(/\s+/g, ' ').trim().slice(0, max);

/** El texto completo que se envía: base + respuestas del cuestionario + (si lo hay) el recurso del que se parte. */
export function construirPrompt(base: string, c: Cuestionario, recurso?: Recurso): string {
  const datos = ETIQUETAS.map(([k, nombre]) => [nombre, una(c[k], k === 'notas' ? 600 : 200)] as const).filter(([, v]) => v);
  const partes = [base.trim()];
  if (datos.length) partes.push(`The coach says:\n${datos.map(([n, v]) => `- ${n}: ${v}`).join('\n')}`);
  if (recurso) {
    const nota = una(recurso.nota, 1500);
    partes.push(`The coach saved this item as inspiration (you cannot open links):\n- Title: ${una(recurso.titulo, 200) || '(none)'}${nota ? `\n- Notes: ${nota}` : ''}`);
  }
  return partes.join('\n\n');
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Lee lo que contesta Claude. Si no es el JSON esperado, todo el texto pasa a «consejos» para no perderlo. */
export function leerRespuesta(crudo: string): Partial<Ficha> {
  const a = crudo.indexOf('{');
  const b = crudo.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try {
      const x = JSON.parse(crudo.slice(a, b + 1)) as Record<string, unknown>;
      const pasos = Array.isArray(x.pasos) ? x.pasos.map((p) => texto(p, 300)).filter(Boolean).slice(0, 10) : [];
      const min = Number(x.minutos);
      return {
        nombre: texto(x.nombre, 200),
        objetivo: texto(x.objetivo, 600),
        categoria: (CATEGORIAS as readonly string[]).includes(texto(x.categoria, 40)) ? texto(x.categoria, 40) : '',
        minutos: Number.isFinite(min) && min >= 1 && min <= 120 ? Math.round(min) : 10,
        material: texto(x.material, 300),
        pasos,
        consejos: texto(x.consejos, 1500),
        variantes: texto(x.variantes, 1500),
      };
    } catch {
      /* no era JSON: se usa el texto tal cual */
    }
  }
  return { consejos: crudo.trim().slice(0, 3000) };
}

/** Una ficha nueva con lo que contestó Claude y lo que escribió el entrenador. Va marcada para revisar y no se guarda sola. */
export function borradorDeRespuesta(crudo: string, c: Cuestionario, recurso?: Recurso): Ficha {
  const r = leerRespuesta(crudo);
  const base = nuevaFicha(recurso);
  return {
    ...base,
    nombre: r.nombre || base.nombre || 'Ejercicio de Claude',
    objetivo: r.objetivo || una(c.objetivo, 600),
    categoria: r.categoria ?? '',
    minutos: r.minutos ?? (Number(c.minutos) > 0 ? Math.min(120, Math.round(Number(c.minutos))) : 10),
    material: r.material || una(c.material, 300),
    edad: una(c.edad, 80),
    jugadoras: una(c.jugadoras, 80),
    espacio: una(c.espacio, 120),
    pasos: r.pasos && r.pasos.length ? r.pasos : [''],
    consejos: r.consejos ?? '',
    variantes: r.variantes ?? '',
    etiquetas: ['borrador-claude'],
  };
}
