// Imágenes sueltas de un vídeo, sacadas en el propio móvil: se reparten por el vídeo y se bajan a JPEG pequeño.
// Solo salen estas imágenes hacia Jarvis; el vídeo no se sube.
export const MAX_IMAGENES = 10;
export const MIN_IMAGENES = 3;
export const ANCHO = 480;
export const CALIDAD = 0.6;

/** Instantes (en segundos) donde sacar las imágenes: repartidos entre el 5 % y el 95 % de la duración. */
export function instantes(duracion: number, n: number): number[] {
  if (!Number.isFinite(duracion) || duracion <= 0) return [];
  const k = Math.min(MAX_IMAGENES, Math.max(MIN_IMAGENES, Math.round(n)));
  return Array.from({ length: k }, (_, i) => Number((duracion * (0.05 + (0.9 * i) / (k - 1))).toFixed(2)));
}

/** Cuántas imágenes pedir según lo que dura el vídeo: una cada ~2 segundos, entre 3 y 10. */
export const cuantas = (duracion: number) => Math.min(MAX_IMAGENES, Math.max(MIN_IMAGENES, Math.round(duracion / 2)));

const esperar = (v: HTMLVideoElement, evento: 'loadedmetadata' | 'seeked') =>
  new Promise<void>((ok, mal) => {
    const fin = () => { v.removeEventListener(evento, fin); v.removeEventListener('error', fallo); ok(); };
    const fallo = () => { v.removeEventListener(evento, fin); v.removeEventListener('error', fallo); mal(new Error('No he podido leer ese vídeo.')); };
    v.addEventListener(evento, fin);
    v.addEventListener('error', fallo);
  });

/** Saca las imágenes (data URL JPEG) de un archivo de vídeo. Lanza un Error con un texto para el entrenador. */
export async function sacarFotogramas(archivo: File): Promise<string[]> {
  const url = URL.createObjectURL(archivo);
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  try {
    await esperar(v, 'loadedmetadata');
    if (!v.videoWidth || !Number.isFinite(v.duration)) throw new Error('No he podido leer ese vídeo.');
    const ancho = Math.min(ANCHO, v.videoWidth);
    const alto = Math.round((v.videoHeight * ancho) / v.videoWidth);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d');
    if (!ctx) throw new Error('Este móvil no puede sacar imágenes del vídeo.');
    const fotos: string[] = [];
    for (const t of instantes(v.duration, cuantas(v.duration))) {
      v.currentTime = t;
      await esperar(v, 'seeked');
      ctx.drawImage(v, 0, 0, ancho, alto);
      fotos.push(lienzo.toDataURL('image/jpeg', CALIDAD));
    }
    return fotos;
  } finally {
    URL.revokeObjectURL(url);
  }
}
