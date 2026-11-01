// Hoja del partido para imprimir (A4): convocadas con sus casillas de faltas, quinteto, tiempos muertos y marcador por cuartos.
// Por defecto lleva solo dorsales; los nombres solo salen si se piden, porque es un papel que se queda en la mesa.
import { corta } from './fechas';
import type { Evento } from './temporada';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface JugadoraHoja {
  id: string;
  numero: string;
  nombre: string;
}

const cajas = (n: number) => Array.from({ length: n }, () => '<i></i>').join('');

export function hojaPartido(e: Evento, equipo: string, jugadoras: JugadoraHoja[], opciones: { nombres: boolean; faltas?: number; cuartos?: number }): string {
  const faltas = opciones.faltas ?? 5;
  const cuartos = opciones.cuartos ?? 4;
  const lista = e.convocados?.length ? jugadoras.filter((j) => e.convocados!.includes(j.id)) : jugadoras;
  const filas = lista.map((j) => `<tr><td class="num">${esc(j.numero || '')}</td>${opciones.nombres ? `<td>${esc(j.nombre)}</td>` : ''}<td class="c">${e.quinteto?.includes(j.id) ? '●' : ''}</td><td class="caj">${cajas(faltas)}</td><td class="pts"></td></tr>`);
  while (filas.length < 12) filas.push(`<tr><td class="num"></td>${opciones.nombres ? '<td></td>' : ''}<td class="c"></td><td class="caj">${cajas(faltas)}</td><td class="pts"></td></tr>`);
  const encabezadoCuartos = Array.from({ length: cuartos }, (_, i) => `<th>C${i + 1}</th>`).join('');
  const celdas = (n: number) => Array.from({ length: n }, () => '<td></td>').join('');
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Hoja del partido</title>
<style>@page{size:A4;margin:12mm}body{font:13px/1.35 system-ui,sans-serif;color:#111}h1{margin:0;font-size:22px}p{margin:2px 0 10px}
table{border-collapse:collapse;width:100%;margin-top:8px}th,td{border:1px solid #666;padding:5px 6px;text-align:center}th{background:#eee;font-size:11px;text-transform:uppercase}
td.num{font-weight:800;font-size:16px;width:44px}td.caj{text-align:left;letter-spacing:0}td.caj i{display:inline-block;width:15px;height:15px;border:1px solid #333;margin-right:4px;vertical-align:middle}
td.c{width:60px}td.pts{width:70px}.dos{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}.dos td{height:26px}</style>
<h1>${esc(equipo)} vs ${esc(e.titulo || 'rival')}</h1>
<p>${esc(corta(e.fecha))} · ${esc(e.hora)} · ${e.casa === false ? 'Fuera' : 'En casa'}${e.lugar ? ` · ${esc(e.lugar)}` : ''}${e.jornada ? ` · Jornada ${e.jornada}` : ''}</p>
<table><tr><th>Nº</th>${opciones.nombres ? '<th>Nombre</th>' : ''}<th>Quinteto</th><th>Faltas</th><th>Puntos</th></tr>${filas.join('')}</table>
<div class="dos">
<table><tr><th></th>${encabezadoCuartos}<th>Total</th></tr><tr><th>Nosotros</th>${celdas(cuartos + 1)}</tr><tr><th>${esc((e.titulo || 'Rival').slice(0, 14))}</th>${celdas(cuartos + 1)}</tr></table>
<table><tr><th>Tiempos muertos</th><td class="caj">${cajas(5)}</td></tr><tr><th>Faltas de equipo</th><td class="caj">${cajas(cuartos * 2)}</td></tr></table>
</div></html>`;
}
