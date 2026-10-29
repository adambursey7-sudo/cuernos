// gifenc no trae tipos: solo lo que usa la app.
declare module 'gifenc' {
  type Paleta = number[][];
  export function quantize(rgba: Uint8ClampedArray, colores: number): Paleta;
  export function applyPalette(rgba: Uint8ClampedArray, paleta: Paleta): Uint8Array;
  export function GIFEncoder(): {
    writeFrame(indices: Uint8Array, ancho: number, alto: number, opciones?: { palette?: Paleta; delay?: number }): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
  };
}
