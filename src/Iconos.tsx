// Iconos de la barra de abajo: trazo propio y simple, del color del texto (currentColor), para que sigan los colores del entrenador.
import type { ReactNode } from 'react';

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Icono({ children }: { children: ReactNode }) {
  return <svg className="icono" viewBox="0 0 24 24" aria-hidden="true" {...trazo}>{children}</svg>;
}

/** Hoy: un balón de baloncesto. */
export const IconoHoy = () => (
  <Icono><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5v17M6 5.8c2.6 1.9 2.6 10.5 0 12.4M18 5.8c-2.6 1.9-2.6 10.5 0 12.4" /></Icono>
);

/** Biblioteca: pizarra con una jugada dibujada. */
export const IconoBiblioteca = () => (
  <Icono><rect x="3.5" y="4.5" width="17" height="12" rx="2" /><path d="M7 13c2-5 5-1 7-5l1.5-1.2M15.5 6.8l-2.3.2M15.5 6.8l-.5 2.2M8 20h8M12 16.5V20" /></Icono>
);

/** Sesiones: hoja con lista y cronómetro. */
export const IconoSesiones = () => (
  <Icono><rect x="4.5" y="3.5" width="15" height="17" rx="2" /><path d="M8 8.5h8M8 12.5h8M8 16.5h4.5" /></Icono>
);

/** Equipo: dos jugadores. */
export const IconoEquipo = () => (
  <Icono><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19.5c.4-3.4 2.6-5 5.5-5s5.1 1.6 5.5 5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16.5 14.7c2.4-.2 3.8 1.2 4 4" /></Icono>
);

/** Cronómetro: esfera con aguja y pulsador. */
export const IconoCronometro = () => (
  <Icono><circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.5V9.5M9.5 3h5M12 3v3M18.5 6.5l1.2-1.2" /></Icono>
);

/** Enlace: dos eslabones. */
export const IconoEnlace = () => (
  <Icono><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icono>
);

/** Más: tres puntos. */
export const IconoMas = () => (
  <Icono><circle cx="5.5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18.5" cy="12" r="1.2" fill="currentColor" /></Icono>
);
