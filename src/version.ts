// Versión nueva de la app: el service worker la descarga en segundo plano y aquí se guarda cómo aplicarla,
// para avisar al entrenador y que actualice cuando le venga bien (no a mitad de un partido o de una jugada).
let aplicar: (() => void) | undefined;
const oyentes = new Set<() => void>();

export function avisarVersionNueva(f: () => void) {
  aplicar = f;
  oyentes.forEach((o) => o());
}
export const hayVersionNueva = () => aplicar !== undefined;
export function actualizarAhora() {
  aplicar?.();
}
export function suscribirVersion(o: () => void) {
  oyentes.add(o);
  return () => { oyentes.delete(o); };
}
