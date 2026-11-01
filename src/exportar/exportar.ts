// Exportaciones (loop Herramienta diaria, tramo 5): CSV para hojas de cálculo y hoja imprimible para PDF. Solo dorsales:
// ni nombres ni lesiones. El .ics ya lo genera temporada/ics.
import { boxScore } from '../partido/vivo';
import { masMenos, valoracion } from '../estadistica/avanzada';
import type { Evento } from '../temporada/temporada';

/** Una celda segura: entre comillas si hace falta y sin que una hoja de cálculo la tome por fórmula. */
export function celda(x: string | number | undefined): string {
  let t = x === undefined ? '' : String(x);
  if (/^[=+\-@\t\r]/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t)) t = `'${t}`;
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** CSV con separador «;» (el de Excel en español) y BOM para que se vean bien las tildes. */
export const csv = (filas: (string | number | undefined)[][]) => '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n';

const COMPETICION: Record<string, string> = { liga: 'Liga', amistoso: 'Amistoso', copa: 'Copa', playoff: 'Playoff' };

/** Partidos de la temporada: fecha, rival, casa o fuera, competición, jornada y resultado. */
export function csvPartidos(eventos: Evento[]): string {
  const ps = eventos.filter((e) => e.tipo === 'partido').sort((a, b) => a.fecha.localeCompare(b.fecha));
  return csv([
    ['Fecha', 'Hora', 'Rival', 'Casa o fuera', 'Competición', 'Jornada', 'Puntos nuestros', 'Puntos rival', 'Resultado'],
    ...ps.map((e) => [e.fecha, e.hora, e.titulo, e.casa === false ? 'Fuera' : 'Casa', COMPETICION[e.competicion ?? 'liga'], e.jornada, e.resultado?.a, e.resultado?.c, e.resultado ? (e.resultado.a > e.resultado.c ? 'Ganado' : e.resultado.a < e.resultado.c ? 'Perdido' : 'Empate') : '']),
  ]);
}

export type Dorsales = Record<string, string>;

/** Estadística de un partido apuntado en directo, por dorsal. */
export function csvEstadistica(e: Evento, dorsales: Dorsales): string {
  if (!e.vivo || !e.directo) return csv([['Este partido no se apuntó en directo']]);
  const pm = masMenos(e.vivo);
  return csv([
    ['Dorsal', 'Minutos', 'Puntos', 'Rebotes', 'Asistencias', 'Robos', 'Pérdidas', 'Faltas', 'T. campo anotados', 'T. campo intentados', 'T. libres anotados', 'T. libres intentados', '+/-', 'Valoración'],
    ...boxScore(e.directo, e.vivo).map((f) => [dorsales[f.id] || '–', Math.round(f.min / 60), f.p, f.reb, f.ast, f.rob, f.per, f.f, f.tcA, f.tcI, f.tlA, f.tlI, pm[f.id] ?? 0, valoracion(f)]),
  ]);
}

/** Plantilla por dorsal: sin nombres y sin salud. */
export function csvPlantilla(js: { numero: string; posicion: string; rol?: string }[]): string {
  return csv([['Dorsal', 'Posición', 'Rol'], ...[...js].sort((a, b) => Number(a.numero) - Number(b.numero)).map((j) => [j.numero, j.posicion, j.rol])]);
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Hoja de estadística para imprimir o guardar como PDF (todo escapado). */
export function hojaEstadistica(e: Evento, equipo: string, dorsales: Dorsales): string {
  const filas = e.vivo && e.directo ? boxScore(e.directo, e.vivo) : [];
  const pm = masMenos(e.vivo);
  const cuerpo = filas.map((f) => `<tr><td>${esc(dorsales[f.id] || '–')}</td><td>${Math.round(f.min / 60)}</td><td>${f.p}</td><td>${f.reb}</td><td>${f.ast}</td><td>${f.rob}</td><td>${f.per}</td><td>${f.f}</td><td>${f.tcA}/${f.tcI}</td><td>${f.tlA}/${f.tlI}</td><td>${pm[f.id] ?? 0}</td><td>${valoracion(f)}</td></tr>`).join('');
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Estadística</title><style>body{font:14px system-ui;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px 6px;text-align:center}h1{font-size:20px}</style>
<h1>${esc(equipo)} · contra ${esc(e.titulo || 'el rival')}</h1><p>${esc(e.fecha)}${e.resultado ? ` · ${e.resultado.a}–${e.resultado.c}` : ''}</p>
<table><thead><tr><th>Dorsal</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Rob</th><th>Per</th><th>Fal</th><th>TC</th><th>TL</th><th>+/-</th><th>Val</th></tr></thead><tbody>${cuerpo || '<tr><td colspan="12">Este partido no se apuntó en directo</td></tr>'}</tbody></table></html>`;
}
