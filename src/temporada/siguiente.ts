// «Lo siguiente» de la pantalla Hoy: el próximo partido o entreno no cancelado, a partir de ahora.
import { corta, diasEntre, sumarDias } from './fechas';
import { agendaDia, type Item, type Temporada } from './temporada';

const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

/** Un entreno o partido que empezó hace menos de 90 min sigue contando como «lo siguiente» (está en marcha). */
export function siguiente(t: Temporada, hoyTexto: string, ahora: string, dias = 60): Item | undefined {
  for (let i = 0; i <= dias; i++) {
    const fecha = sumarDias(hoyTexto, i);
    const item = agendaDia(t, fecha).find((x) => !x.cancelado && (i > 0 || minutos(x.hora) + 90 >= minutos(ahora)));
    if (item) return item;
  }
  return undefined;
}

/** «Hoy», «Mañana» o «jue 3 nov». */
export function cuando(fecha: string, hoyTexto: string): string {
  const d = diasEntre(hoyTexto, fecha);
  return d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : corta(fecha);
}
