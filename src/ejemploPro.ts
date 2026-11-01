// Datos de ejemplo para ver la app llena (capturas y pruebas a mano). Solo se carga en desarrollo, con ?ejemplo=pro en la dirección.
// Nombres inventados: «Ejemplo Uno», «Ejemplo Dos»… Nada real.
import { guardarDiario } from './diario/diario';
import { equipoEjemplo } from './equipo/equipos';
import { guardarTemporadas, type Evento } from './temporada/temporada';
import { sumarDias, lunesDe } from './temporada/fechas';

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
  const proximo: Evento = { id: 'ev-pro-prox', fecha: sumarDias(hoyTexto, 2), hora: '17:30', tipo: 'partido', titulo: 'Ejemplo Rival G', casa: true, lugar: 'Pabellón', balance: '', jornada: 7, convocados: ids.slice(0, 10) };
  const asistencia: Record<string, string[]> = {};
  for (let s = 1; s <= 6; s++) {
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
