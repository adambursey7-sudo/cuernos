// Gráfica de líneas limpia en SVG, sin librerías: una o dos series, huecos donde falta el dato y el último valor escrito.
export interface Serie {
  nombre: string;
  /** Color CSS (por ejemplo `var(--principal)`). */
  color: string;
  valores: (number | null)[];
}

const W = 340;
const H = 150;
const M = { i: 30, d: 14, a: 12, b: 24 };

export function Grafica({ series, etiquetas, sufijo = '', etiqueta, minimo }: { series: Serie[]; etiquetas: string[]; sufijo?: string; etiqueta: string; minimo?: number }) {
  const todos = series.flatMap((s) => s.valores.filter((v): v is number => v !== null));
  if (todos.length === 0) return <p className="vacio">Todavía no hay datos para esta gráfica.</p>;
  let lo = Math.min(...todos, minimo ?? Infinity);
  let hi = Math.max(...todos);
  if (lo === hi) { lo -= 1; hi += 1; }
  const paso = (hi - lo) / 3;
  const n = Math.max(1, etiquetas.length - 1);
  const x = (i: number) => M.i + ((W - M.i - M.d) * i) / n;
  const y = (v: number) => M.a + (H - M.a - M.b) * (1 - (v - lo) / (hi - lo));
  const trazos = (s: Serie) => {
    const partes: string[] = [];
    let abierta = false;
    s.valores.forEach((v, i) => {
      if (v === null) { abierta = false; return; }
      partes.push(`${abierta ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`);
      abierta = true;
    });
    return partes.join('');
  };
  return (
    <svg className="grafica" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={etiqueta}>
      {[0, 1, 2, 3].map((k) => {
        const v = lo + paso * k;
        return <g key={k}><line x1={M.i} x2={W - M.d} y1={y(v)} y2={y(v)} className="rejilla" /><text x={M.i - 4} y={y(v) + 3} className="eje" textAnchor="end">{Math.round(v)}{sufijo}</text></g>;
      })}
      {etiquetas.length > 0 && <text x={x(0)} y={H - 6} className="eje" textAnchor="start">{etiquetas[0]}</text>}
      {etiquetas.length > 1 && <text x={x(etiquetas.length - 1)} y={H - 6} className="eje" textAnchor="end">{etiquetas[etiquetas.length - 1]}</text>}
      {series.map((s) => (
        <g key={s.nombre}>
          <path d={trazos(s)} className="trazo" style={{ stroke: s.color }} />
          {s.valores.map((v, i) => v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="3.2" className="punto" style={{ fill: s.color }} />)}
          {(() => {
            const i = s.valores.length - 1 - [...s.valores].reverse().findIndex((v) => v !== null);
            const v = s.valores[i];
            return v === null || v === undefined ? null : <text x={Math.min(x(i), W - M.d)} y={y(v) - 8} className="ultimo-valor" textAnchor="end" style={{ fill: s.color }}>{v}{sufijo}</text>;
          })()}
        </g>
      ))}
    </svg>
  );
}
