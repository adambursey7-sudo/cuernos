// La media pista (suelo con grano de parqué, zona, tres puntos, tiro libre y canasta) con el logo de Horns pintado en el
// círculo de tiro libre. La comparten la pizarra y la pantalla de espacios para que todo case en el mismo sitio.
// `Suelo` y `Cancha` van dentro de un <svg viewBox="0 0 150 140">.
import { CUERNO, BALON, TRANSFORMAS } from '../Logo';
import parque from './parque.jpg';

/** Color del tema con el grano de la madera encima (multiplica, así no cambia el color del tema). */
export function Suelo({ alto = 140 }: { alto?: number }) {
  return (
    <>
      <rect className="suelo" width="150" height={alto} />
      <image href={parque} x="0" y={(alto - 140) / 2} width="150" height="140" preserveAspectRatio="none" className="grano" aria-hidden="true" />
    </>
  );
}

/** El logo pintado en el suelo: las dos mitades del círculo de tiro libre son los dos cuernos y el balón queda en la línea. */
function LogoEnSuelo() {
  const k = 36 / 80; // tan ancho como el círculo (36 unidades de pista) con la caja de la O de 80
  return (
    <g className="logo-suelo" transform={`translate(75 58) scale(${k}) translate(-50 -50)`} aria-hidden="true">
      {TRANSFORMAS.map((t) => <path key={t} d={CUERNO} transform={t} />)}
      <circle {...BALON} className="balon-suelo" />
    </g>
  );
}

export function Cancha() {
  return (
    <>
      <rect className="zona" x="50.5" y="0" width="49" height="58" />
      <LogoEnSuelo />
      <path className="linea" d="M0 .6H150M50.5 0V58H99.5V0M57 58a18 18 0 0 0 36 0M9 0V26A67.5 67.5 0 0 0 141 26V0M0 139.4H150" />
      <path className="linea rayas" d="M57 58a18 18 0 0 1 36 0" />
      <circle className="linea" cx="75" cy="12" r="2.3" />
      <path className="linea" d="M66 9H84" />
    </>
  );
}
