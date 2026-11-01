// Lo que sale hacia fuera del equipo: mensajes para las familias, la hoja de cada jugador (para imprimir o guardar en PDF)
// y el informe de fin de temporada. Reglas: en lo que se comparte en grupo solo van dorsales, nunca nombres de menores;
// la hoja de cada jugador es para su familia y lleva su nombre; las lesiones y la salud no salen nunca de aquí.
import type { Equipo, Jugadora } from '../diario/diario';
import { DIAS_LARGOS, MESES, diaSemana, lunesDe, sumarDias } from '../temporada/fechas';
import { COMPETICIONES, agendaDia, balanceDe, competicionDe, type Evento, type Temporada } from '../temporada/temporada';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fechaLarga = (f: string) => `${DIAS_LARGOS[diaSemana(f)]} ${Number(f.slice(8))}/${Number(f.slice(5, 7))}`;
const dorsal = (j: Pick<Jugadora, 'numero'>) => (j.numero ? `#${j.numero}` : '#–');

const porDorsal = (a: Jugadora, b: Jugadora) => (Number(a.numero) || 1000) - (Number(b.numero) || 1000);

/** Convocatoria de un partido para el grupo de las familias: cuándo, dónde y los dorsales convocados. Sin nombres. */
export function mensajeConvocatoria(e: Evento, equipo: string, jugadoras: Jugadora[]): string {
  const conv = e.convocados ? jugadoras.filter((j) => e.convocados!.includes(j.id)).sort(porDorsal) : [];
  const donde = e.casa === false ? 'Fuera' : 'En casa';
  return [
    `${equipo}${e.jornada ? ` · Jornada ${e.jornada}` : ''}${e.competicion ? ` · ${COMPETICIONES.find(([id]) => id === e.competicion)?.[1]}` : ''}`,
    `Partido contra ${e.titulo || 'el rival'}`,
    `${fechaLarga(e.fecha)} a las ${e.hora} · ${donde}${e.lugar ? ` (${e.lugar})` : ''}`,
    e.casa === false && e.salida ? `Salida del viaje: ${e.salida}` : '',
    conv.length ? `Convocados: ${conv.map(dorsal).join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

/** Horarios de la semana (lunes a domingo) para pasar a las familias. */
export function mensajeSemana(t: Temporada, equipo: string, desde: string): string {
  const lunes = lunesDe(desde);
  const lineas: string[] = [];
  for (let i = 0; i < 7; i++) {
    const fecha = sumarDias(lunes, i);
    for (const it of agendaDia(t, fecha).filter((x) => !x.cancelado)) {
      const donde = it.evento?.tipo === 'partido' ? (it.evento.casa === false ? ' · fuera' : ' · en casa') : '';
      const lugar = it.evento?.lugar || it.fijo?.pista;
      lineas.push(`${fechaLarga(fecha)} ${it.hora} · ${it.tipo === 'partido' ? `Partido vs ${it.titulo || 'rival'}` : it.titulo || 'Entreno'}${donde}${lugar ? ` (${lugar})` : ''}`);
    }
  }
  return [`${equipo} · semana del ${fechaLarga(lunes)}`, ...(lineas.length ? lineas : ['Esta semana no hay nada apuntado.'])].join('\n');
}

/** Mes (AAAA-MM) de cada entreno con lista pasada, a partir de su clave. */
function mesDeClave(t: Temporada, clave: string): string | undefined {
  const m = /\|(\d{4}-\d{2})-\d{2}$/.exec(clave);
  if (m) return m[1];
  const ev = t.eventos.find((e) => e.id === clave);
  return ev?.fecha.slice(0, 7);
}

/** Asistencia de un jugador mes a mes (solo los entrenos y partidos con lista). */
export function asistenciaPorMes(t: Temporada | undefined, jugadorId: string): { mes: string; vino: number; de: number }[] {
  const meses = new Map<string, { vino: number; de: number }>();
  for (const [clave, ids] of Object.entries(t?.asistencia ?? {})) {
    const mes = t ? mesDeClave(t, clave) : undefined;
    if (!mes) continue;
    const m = meses.get(mes) ?? { vino: 0, de: 0 };
    m.de += 1;
    if (ids.includes(jugadorId)) m.vino += 1;
    meses.set(mes, m);
  }
  return [...meses.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mes, v]) => ({ mes, ...v }));
}

export const nombreMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1] ?? mes} ${mes.slice(0, 4)}`;

/** Hoja de un jugador para su familia: horarios, próximos partidos y asistencia. Nada de salud ni de notas del entrenador. */
export function hojaJugador(j: Jugadora, equipo: Equipo, t: Temporada | undefined, hoyTexto: string): string {
  const proximos = (t?.eventos ?? []).filter((e) => e.tipo === 'partido' && e.fecha >= hoyTexto).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)).slice(0, 6);
  const fijos = [...(t?.fijos ?? [])].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora));
  const meses = asistenciaPorMes(t, j.id);
  const vino = meses.reduce((n, m) => n + m.vino, 0);
  const de = meses.reduce((n, m) => n + m.de, 0);
  const staff = (equipo.staff ?? []).filter((s) => s.contacto);
  const filas = (xs: string[][]) => xs.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('');
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>${esc(j.nombre || 'Ficha')}</title>
<style>@page{size:A4;margin:14mm}body{font:14px/1.45 system-ui,sans-serif;color:#111}h1{margin:0}h2{margin:18px 0 4px;font-size:15px}table{border-collapse:collapse;width:100%}td{border:1px solid #999;padding:5px 8px;vertical-align:top}td:first-child{width:30%;font-weight:700}.num{font-size:42px;font-weight:800}</style>
<div><span class="num">${esc(j.numero || '–')}</span> <h1 style="display:inline">${esc(j.nombre || 'Jugador')}</h1></div>
<p>${esc(equipo.nombre)}${equipo.temporada ? ` · ${esc(equipo.temporada)}` : ''}${j.posicion ? ` · ${esc(j.posicion)}` : ''}</p>
<h2>Entrenos de la semana</h2>${fijos.length ? `<table>${filas(fijos.map((f) => [DIAS_LARGOS[f.dia], `${f.hora}${f.pista ? ` · ${f.pista}` : ''}${f.vestuario ? ` · vestuario ${f.vestuario}` : ''}`]))}</table>` : '<p>Aún sin horarios.</p>'}
<h2>Próximos partidos</h2>${proximos.length ? `<table>${filas(proximos.map((e) => [fechaLarga(e.fecha), `${e.hora} · ${e.titulo || 'rival'} · ${e.casa === false ? 'fuera' : 'en casa'}${e.lugar ? ` (${e.lugar})` : ''}${e.casa === false && e.salida ? ` · salida ${e.salida}` : ''}`]))}</table>` : '<p>Aún sin partidos.</p>'}
${de ? `<h2>Asistencia</h2><p>${vino} de ${de} entrenos y partidos con lista.</p>` : ''}
${staff.length ? `<h2>Contacto</h2><table>${filas(staff.map((s) => [s.nombre || s.papel, s.contacto!]))}</table>` : ''}
</html>`;
}

/** Informe de fin de temporada del equipo, en texto: resultados, objetivos y asistencia. Se puede copiar o guardar. */
export function informeTemporada(equipo: Equipo, t: Temporada, jugadoras: Jugadora[], conNombres = true): string {
  const jugados = t.eventos.filter((e) => e.tipo === 'partido' && e.resultado);
  const pf = jugados.reduce((n, e) => n + e.resultado!.a, 0);
  const pc = jugados.reduce((n, e) => n + e.resultado!.c, 0);
  const lineas = [`${equipo.nombre}${equipo.temporada ? ` · temporada ${equipo.temporada}` : ''}`, ''];
  lineas.push(`Partidos con resultado: ${jugados.length}`);
  for (const [id, nombre] of COMPETICIONES) {
    const n = jugados.filter((e) => competicionDe(e) === id).length;
    if (n) { const b = balanceDe(t, id); lineas.push(`  ${nombre}: ${b.g} ganados y ${b.p} perdidos (${n} partidos)`); }
  }
  if (jugados.length) lineas.push(`Puntos: ${pf} a favor y ${pc} en contra (${pf - pc >= 0 ? '+' : ''}${pf - pc})`);
  const mejor = [...jugados].sort((a, b) => (b.resultado!.a - b.resultado!.c) - (a.resultado!.a - a.resultado!.c))[0];
  if (mejor && mejor.resultado!.a > mejor.resultado!.c) lineas.push(`Mejor resultado: ${mejor.resultado!.a}–${mejor.resultado!.c} contra ${mejor.titulo || 'el rival'}`);
  if (equipo.objetivos?.length) {
    lineas.push('', `Objetivos: ${equipo.objetivos.filter((o) => o.hecho).length} de ${equipo.objetivos.length} cumplidos`);
    for (const o of equipo.objetivos) lineas.push(`  ${o.hecho ? '[x]' : '[ ]'} ${o.texto}`);
  }
  const listas = Object.keys(t.asistencia ?? {}).length;
  if (listas) {
    lineas.push('', `Asistencia (${listas} entrenos y partidos con lista):`);
    const filas = [...jugadoras].sort(porDorsal).map((j) => {
      const vino = Object.values(t.asistencia ?? {}).filter((l) => l.includes(j.id)).length;
      return `  ${conNombres ? `${dorsal(j)} ${j.nombre || 'Sin nombre'}` : dorsal(j)}: ${vino} de ${listas} (${Math.round((vino / listas) * 100)} %)`;
    });
    lineas.push(...filas);
  }
  if (t.anteriores?.length) lineas.push('', `Temporadas anteriores guardadas: ${t.anteriores.map((a) => a.etiqueta).join(', ')}`);
  return lineas.join('\n');
}
