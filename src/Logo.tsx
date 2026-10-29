// Logo HORNS (elegido por Adam el 29/10, variante «cuernos afilados»): dos cuernos enfrentados, uno boca abajo,
// que cierran la O con un solo balón en medio. El nombre va en Graduate y la O es el dibujo, a la altura de las letras.

/** Cuerno de abajo en una caja de 100 x 100 (punta en y = 4); el de arriba es el mismo, volteado. */
export const CUERNO = 'M14 4C10 46 22 86 50 88C78 86 90 46 86 4C80 38 70 64 50 66C30 64 20 38 14 4Z';
export const PUNTA = 4;
export const APLASTADO = 0.54;
/** La O cabe en esta caja (las puntas se tocan en y = 50). */
export const CAJA_O = { x: 10, y: 4.6, ancho: 80, alto: 90.8 };
export const BALON = { cx: 50, cy: 50, r: 10 };
export const TRANSFORMAS = [
  `translate(0 ${50 - PUNTA * APLASTADO}) scale(1 ${APLASTADO})`,
  `translate(0 ${50 + PUNTA * APLASTADO}) scale(1 ${-APLASTADO})`,
];

/** La O de cuernos. Toma los colores del tema: cuernos en el color principal y balón en el del texto. */
export function GlifoO({ className, cuernos = 'var(--principal)', balon = 'var(--texto)' }: { className?: string; cuernos?: string; balon?: string }) {
  return (
    <svg className={className} viewBox={`${CAJA_O.x} ${CAJA_O.y} ${CAJA_O.ancho} ${CAJA_O.alto}`} aria-hidden="true">
      {TRANSFORMAS.map((t) => (
        <path key={t} d={CUERNO} fill={cuernos} transform={t} />
      ))}
      <circle {...BALON} fill={balon} />
    </svg>
  );
}

/** El nombre completo: H + la O de cuernos + RNS. */
export function Marca({ className = '' }: { className?: string }) {
  return (
    <span className={`marca ${className}`} role="img" aria-label="Horns">
      <span aria-hidden="true">H</span>
      <GlifoO className="marca-o" />
      <span aria-hidden="true">RNS</span>
    </span>
  );
}
