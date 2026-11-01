// Plantilla desde un texto, un CSV o un PDF: detecta dorsal, nombre y posición de cada línea.
// El PDF se lee en el móvil (nada se sube a ningún sitio). Siempre hay vista previa antes de crear las fichas.
import { POSICIONES, type Posicion } from './diario';

export interface Candidata {
  numero: string;
  nombre: string;
  posicion: Posicion | '';
  /** Año de nacimiento, si la línea lo traía. */
  nacimiento?: number;
}

const POS: [RegExp, Posicion][] = [
  [/\bala[\s-]*p[ií]vot\b|\bpower\s*forward\b/i, 'Ala-pívot'],
  [/\bp[ií]vot\b|\bcentro\b/i, 'Pívot'],
  [/\bescolta\b|\bshooting\s*guard\b/i, 'Escolta'],
  [/\bbase\b|\bpoint\s*guard\b/i, 'Base'],
  [/\balero\b|\bsmall\s*forward\b/i, 'Alero'],
];

const CABECERAS = /^(n[ºo°.]*|n[uú]m(ero)?|dorsal|nombre|jugadora?s?|posici[oó]n|equipo|lista|plantilla)$/i;

export function posicionDe(texto: string): Posicion | '' {
  for (const [re, p] of POS) if (re.test(texto)) return p;
  return (POSICIONES as readonly string[]).includes(texto) ? (texto as Posicion) : '';
}

const limpiarNombre = (s: string) =>
  s.replace(/[|•·\t]+/g, ' ').replace(/\s+/g, ' ').replace(/^[\s\-–—.:,;#]+|[\s\-–—.:,;#]+$/g, '').trim();

/** Una línea → una jugadora, o null si no parece una. */
export function leerLinea(linea: string): Candidata | null {
  let resto = linea.trim();
  if (!resto) return null;
  // Un año de cuatro cifras suelto (1950-2029) es el año de nacimiento.
  const año = /(?:^|[\s;,|\t(])((?:19[5-9]|20[0-2])\d)(?=$|[\s;,|\t)])/.exec(resto);
  if (año) resto = resto.replace(año[1], ' ');
  const celdas = resto.split(/\s*[;\t|]\s*|,(?=\s*\S)/).map((c) => c.trim()).filter(Boolean);
  let numero = '';
  let posicion: Posicion | '' = '';
  const nombres: string[] = [];
  if (celdas.length >= 2) {
    for (const c of celdas) {
      const m = /^#?\s*(\d{1,2})$/.exec(c);
      if (m && !numero) numero = m[1];
      else if (!posicion && posicionDe(c) && c.split(/\s+/).length <= 2) posicion = posicionDe(c);
      else nombres.push(c);
    }
  } else {
    const m = /(?:^|\s)#?(\d{1,2})(?=\s|$|[.\-–:)])/.exec(resto);
    if (m) {
      numero = m[1];
      resto = resto.replace(m[0], ' ');
    }
    for (const [re, p] of POS) {
      if (re.test(resto)) {
        posicion = p;
        resto = resto.replace(re, ' ');
        break;
      }
    }
    nombres.push(resto);
  }
  // Una celda con «11 Ejemplo Tres» (dorsal y nombre juntos) también vale.
  if (!numero) {
    for (let i = 0; i < nombres.length && !numero; i++) {
      const m = /^#?(\d{1,2})\s+(?=\D)|\s+#?(\d{1,2})$/.exec(nombres[i]);
      if (m) {
        numero = m[1] ?? m[2];
        nombres[i] = nombres[i].replace(m[0], ' ');
      }
    }
  }
  const nombre = limpiarNombre(nombres.join(' '));
  if (!numero || nombre.length < 2 || !/[a-záéíóúñü]{2}/i.test(nombre) || CABECERAS.test(nombre)) return null;
  return { numero, nombre, posicion, ...(año ? { nacimiento: Number(año[1]) } : {}) };
}

export function leerTexto(texto: string): Candidata[] {
  const vistos = new Set<string>();
  const salida: Candidata[] = [];
  for (const l of texto.split(/\r?\n/)) {
    const c = leerLinea(l);
    if (!c) continue;
    const clave = `${c.numero}|${c.nombre.toLowerCase()}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(c);
  }
  return salida;
}

/** Lee el texto de un PDF, una línea por fila de la tabla (las celdas separadas por «;»). Carga pdf.js solo al usarlo. */
export async function textoDePdf(archivo: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const trabajador = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = trabajador;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise;
  const lineas: string[] = [];
  for (let n = 1; n <= Math.min(pdf.numPages, 10); n++) {
    const contenido = await (await pdf.getPage(n)).getTextContent();
    const filas = new Map<number, { x: number; fin: number; t: string }[]>();
    for (const it of contenido.items) {
      if (!('str' in it) || !it.str.trim()) continue;
      const y = Math.round(it.transform[5] / 3);
      const x = it.transform[4];
      if (!filas.has(y)) filas.set(y, []);
      filas.get(y)!.push({ x, fin: x + it.width, t: it.str.trim() });
    }
    for (const y of [...filas.keys()].sort((a, b) => b - a)) {
      const celdas = filas.get(y)!.sort((a, b) => a.x - b.x);
      lineas.push(celdas.map((c, i) => (i === 0 ? '' : c.x - celdas[i - 1].fin > 5 ? ' ; ' : ' ') + c.t).join(''));
    }
  }
  return lineas.join('\n');
}
