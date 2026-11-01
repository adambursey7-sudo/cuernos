// Datos de ejemplo para ver la app llena (capturas y pruebas a mano). Solo se carga en desarrollo, con ?ejemplo=pro en la dirección.
// Nombres inventados: «Ejemplo Uno», «Ejemplo Dos»… Nada real.
import { guardarDiario } from './diario/diario';
import { equipoEjemplo } from './equipo/equipos';
import { guardarTemporadas, type Evento } from './temporada/temporada';
import { sumarDias, lunesDe } from './temporada/fechas';
import { esTriple } from './partido/mapa';
import { nuevoVivo, registrar, terminar, type Partido, type Tipo } from './partido/vivo';
import { totalPuntos } from './temporada/directo';

/** Zonas con su rango de posiciones, probabilidad de acierto y peso (cuánto se tira desde ahí). */
const PLANTILLAS: [number, number, number, number, number, number][] = [
  [38, 62, 4, 34, 0.55, 8], [8, 30, 14, 50, 0.38, 3], [70, 92, 14, 50, 0.36, 3], [38, 62, 40, 56, 0.34, 2],
  [4, 26, 46, 80, 0.27, 3], [38, 64, 62, 95, 0.31, 4], [74, 96, 46, 80, 0.3, 3], [1, 6, 3, 16, 0.36, 1], [94, 99, 3, 16, 0.33, 1],
];

/** Un partido ya jugado con tiros, rebotes y asistencias inventados (siempre los mismos para una semilla). */
function partidoSimulado(ids: string[], semilla: number, rival: number): Partido {
  let z = semilla;
  const azar = () => (z = (z * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const total = PLANTILLAS.reduce((n, p) => n + p[5], 0);
  let p: Partido = { directo: {}, rival, vivo: { ...nuevoVivo(ids.slice(0, 5)), duracion: 10 } };
  const jug = ids.slice(0, 8);
  for (let i = 0; i < 48; i++) {
    let r = azar() * total;
    const pl = PLANTILLAS.find((q) => (r -= q[5]) < 0) ?? PLANTILLAS[0];
    const x = Math.round((pl[0] + azar() * (pl[1] - pl[0])) * 10) / 10;
    const y = Math.round((pl[2] + azar() * (pl[3] - pl[2])) * 10) / 10;
    const ok = azar() < pl[4];
    const tipo = ((ok ? 'c' : 'f') + (esTriple(x, y) ? '3' : '2')) as Tipo;
    p = registrar(p, { tipo, j: jug[Math.floor(azar() * azar() * jug.length)], x, y }, 0);
    if (azar() < 0.35) p = registrar(p, { tipo: (['reb', 'ast', 'rob', 'per'] as const)[Math.floor(azar() * 4)], j: jug[Math.floor(azar() * jug.length)] }, 0);
    if (azar() < 0.12) p = registrar(p, { tipo: 'fal', j: jug[Math.floor(azar() * jug.length)] }, 0);
    if (i % 12 === 11) p = registrar(p, { tipo: 'c1', j: jug[Math.floor(azar() * jug.length)] }, 0);
  }
  const min: Record<string, number> = {};
  jug.forEach((id, k) => { min[id] = (k < 5 ? 1500 : 900) + Math.floor(azar() * 300); });
  return terminar({ ...p, vivo: { ...p.vivo, min, cuarto: 4, segundos: 600 } }, 0);
}

export function cargarEjemploPro(hoyTexto: string): void {
  const m = equipoEjemplo(hoyTexto, 'f', 'formacion');
  const lunes = lunesDe(hoyTexto);
  const ids = m.jugadoras.map((j) => j.id);
  // Seis partidos jugados, con resultado, y el próximo; asistencia a los entrenos de las últimas semanas.
  const resultados: [number, number][] = [[58, 51], [44, 49], [62, 40], [55, 55 - 3], [47, 60], [66, 52]];
  const jugados: Evento[] = resultados.map(([a, c], i) => ({
    id: `ev-pro-${i}`, fecha: sumarDias(lunes, -7 * (resultados.length - i) + 5), hora: '11:00', tipo: 'partido', titulo: `Ejemplo Rival ${'ABCDEF'[i]}`,
    casa: i % 2 === 0, lugar: i % 2 === 0 ? 'Pabellón' : 'Fuera', balance: '', jornada: i + 1, resultado: { a, c },
  }));
  // Los cuatro últimos tienen estadística y mapa de tiros: el resultado sale de lo apuntado.
  jugados.forEach((e, i) => {
    if (i < 2) return;
    const p = partidoSimulado(ids, 1234 + i * 77, 38 + ((i * 7) % 20));
    Object.assign(e, { directo: p.directo, vivo: p.vivo, resultado: { a: totalPuntos(p.directo), c: p.rival } });
  });
  const proximo: Evento = { id: 'ev-pro-prox', fecha: sumarDias(hoyTexto, 2), hora: '17:30', tipo: 'partido', titulo: 'Ejemplo Rival G', casa: true, lugar: 'Pabellón', balance: '', jornada: 7, convocados: ids.slice(0, 10) };
  const asistencia: Record<string, string[]> = {};
  for (let s = 0; s <= 6; s++) {
    for (const dia of [1, 3]) {
      const fecha = sumarDias(lunes, -7 * s + dia);
      const f = m.temporada.fijos.find((x) => x.dia === dia);
      if (f) asistencia[`${f.id}|${fecha}`] = ids.filter((_, k) => (k + s + dia) % 5 !== 0);
    }
  }
  guardarDiario({ equipos: [m.equipo], jugadoras: m.jugadoras });
  guardarTemporadas([{ ...m.temporada, eventos: [...jugados, proximo], asistencia }]);
  localStorage.setItem('horns.equipoActivo', m.equipo.id);
  // En desarrollo no hace falta entrar ni ver el vídeo de entrada para sacar capturas.
  localStorage.setItem('horns.acceso', 'prueba');
  localStorage.setItem('horns.intro.off', '1');
}
