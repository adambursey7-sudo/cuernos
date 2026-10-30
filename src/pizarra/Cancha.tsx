// Las líneas de la media pista (zona, tres puntos, tiro libre y canasta), sin suelo. Las comparten la pizarra y la
// pantalla de espacios para que todo case en el mismo sitio. Va dentro de un <svg viewBox="0 0 150 140">.
export function Cancha() {
  return (
    <>
      <rect className="zona" x="50.5" y="0" width="49" height="58" />
      <path className="linea" d="M0 .6H150M50.5 0V58H99.5V0M57 58a18 18 0 0 0 36 0M9 0V26A67.5 67.5 0 0 0 141 26V0M0 139.4H150" />
      <circle className="linea" cx="75" cy="12" r="2.3" />
      <path className="linea" d="M66 9H84" />
    </>
  );
}
