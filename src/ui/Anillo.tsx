// Anillo de progreso al estilo Apple Fitness: un arco que se llena con el porcentaje y un texto en el centro. SVG a mano.
import type { ReactNode } from 'react';

export function Anillo({ pct, tam = 72, grosor = 8, etiqueta, children }: { pct: number | null; tam?: number; grosor?: number; etiqueta: string; children?: ReactNode }) {
  const r = (tam - grosor) / 2;
  const largo = 2 * Math.PI * r;
  const lleno = pct === null ? 0 : Math.min(100, Math.max(0, pct)) / 100;
  return (
    <span className="anillo" style={{ width: tam, height: tam }} role="img" aria-label={etiqueta}>
      <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} aria-hidden="true">
        <circle className="anillo-fondo" cx={tam / 2} cy={tam / 2} r={r} strokeWidth={grosor} />
        <circle className="anillo-arco" cx={tam / 2} cy={tam / 2} r={r} strokeWidth={grosor} strokeDasharray={`${largo * lleno} ${largo}`} opacity={lleno > 0 ? 1 : 0} transform={`rotate(-90 ${tam / 2} ${tam / 2})`} />
      </svg>
      <span className="anillo-centro">{children ?? (pct === null ? '–' : `${pct}%`)}</span>
    </span>
  );
}
