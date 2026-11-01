// Resumen semanal automático (loop Pro, tramo 10): lo que pasó la semana pasada, listo para leer en Hoy o pasar al cuerpo técnico.
// Solo cifras: ningún nombre de jugadora. Se calcula con lo que ya hay.
import { lunesDe, sumarDias } from '../temporada/fechas';
import type { Temporada } from '../temporada/temporada';
import { asistenciaSemana, jugados, type Marca } from './resumen';
import { volumenSemanal } from '../sesiones/plan';
import type { Sesion } from '../sesiones/sesiones';

export interface ResumenSemana {
  lunes: string;
  entrenos: number;
  minutos: number;
  /** Asistencia media de los entrenos con lista; null si no se pasó lista. */
  asistencia: number | null;
  partidos: { rival: string; a: number; c: number; marca: Marca }[];
}

/** La semana (lunes a domingo) que empieza en `lunes`. */
export function resumenSemana(t: Temporada | undefined, sesiones: Sesion[], lunes: string, jugadoras: number): ResumenSemana {
  const [v] = volumenSemanal(t, sesiones, lunes, 1);
  const domingo = sumarDias(lunes, 6);
  return {
    lunes,
    entrenos: v?.entrenos ?? 0,
    minutos: v?.minutos ?? 0,
    asistencia: asistenciaSemana(t, lunes, jugadoras).pct,
    partidos: jugados(t).filter((j) => j.evento.fecha >= lunes && j.evento.fecha <= domingo).map((j) => ({ rival: j.evento.titulo || 'Rival', a: j.a, c: j.c, marca: j.marca })),
  };
}

/** La semana pasada, si pasó algo (se pasó lista o se jugó); si no, nada. */
export function semanaPasada(t: Temporada | undefined, sesiones: Sesion[], hoyTexto: string, jugadoras: number): ResumenSemana | undefined {
  const r = resumenSemana(t, sesiones, sumarDias(lunesDe(hoyTexto), -7), jugadoras);
  return r.asistencia !== null || r.partidos.length ? r : undefined;
}

export function textoSemana(r: ResumenSemana, equipo: string): string {
  const dia = (f: string) => `${Number(f.slice(8))}/${Number(f.slice(5, 7))}`;
  const lineas = [`${equipo} · semana del ${dia(r.lunes)} al ${dia(sumarDias(r.lunes, 6))}`];
  if (r.entrenos || r.asistencia !== null) lineas.push(`Entrenos: ${r.entrenos} (${r.minutos} min)${r.asistencia === null ? '' : ` · asistencia ${r.asistencia}%`}`);
  for (const p of r.partidos) lineas.push(`${p.marca === 'G' ? 'Ganado' : p.marca === 'P' ? 'Perdido' : 'Empate'} contra ${p.rival}: ${p.a}–${p.c}`);
  return lineas.join('\n');
}
