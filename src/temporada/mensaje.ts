// Mensaje a la plantilla y hoja del plan de partido (senior). Texto plano para copiar y HTML sencillo para imprimir o guardar en PDF.
import { diaSemana } from './fechas';
import type { Evento } from './temporada';

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const fechaLarga = (f: string) => `${DIAS[diaSemana(f)]} ${Number(f.slice(8))}/${Number(f.slice(5, 7))}`;

/** Convocatoria corta para pasar por mensaje: rival, cuándo, dónde, salida del viaje y plan. */
export function mensajePartido(e: Evento, equipo: string): string {
  const donde = e.casa === false ? 'Fuera' : 'En casa';
  const lineas = [
    `${equipo}${e.jornada ? ` · Jornada ${e.jornada}` : ''}`,
    `Partido contra ${e.titulo || 'el rival'}`,
    `${fechaLarga(e.fecha)} a las ${e.hora} · ${donde}${e.lugar ? ` (${e.lugar})` : ''}`,
    e.casa === false && e.salida ? `Salida del viaje: ${e.salida}` : '',
    e.plan?.trim() ? `Plan: ${e.plan.trim()}` : '',
  ];
  return lineas.filter(Boolean).join('\n');
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Hoja A4 del plan de partido, lista para imprimir. */
export function hojaPlan(e: Evento, equipo: string): string {
  const r = e.rival;
  const filas = [
    ['Cuándo', `${fechaLarga(e.fecha)} a las ${e.hora}`],
    ['Dónde', `${e.casa === false ? 'Fuera' : 'En casa'}${e.lugar ? ` · ${e.lugar}` : ''}`],
    ...(e.casa === false && e.salida ? [['Salida del viaje', e.salida]] : []),
    ['Plan de partido', e.plan?.trim() || '—'],
  ];
  const rival = r ? Object.values(r).filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [];
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Plan de partido</title>
<style>@page{size:A4;margin:14mm}body{font:14px/1.45 system-ui,sans-serif;color:#111}h1{margin:0 0 4px}table{border-collapse:collapse;width:100%;margin-top:10px}td{border:1px solid #999;padding:6px 8px;vertical-align:top;white-space:pre-wrap}td:first-child{width:28%;font-weight:700}</style>
<h1>${esc(equipo)}${e.jornada ? ` · Jornada ${e.jornada}` : ''}</h1><p>Partido contra <b>${esc(e.titulo || 'el rival')}</b></p>
<table>${filas.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}${rival.length ? `<tr><td>Del rival</td><td>${esc(rival.join(' · '))}</td></tr>` : ''}</table></html>`;
}
