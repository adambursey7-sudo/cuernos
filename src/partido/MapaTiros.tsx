// Mapa de tiros sobre la pista de Horns: puntos (acierto o fallo) o calor por zona con su porcentaje. Todo en SVG, sin imágenes externas.
import { useId, useMemo, useState } from 'react';
import { Cancha, Suelo } from '../pizarra/Cancha';
import { colorCalor, porZona, posicionDe, resumenTiros, ZONAS, type Tiro, type Zona } from './mapa';

// Las zonas son rectángulos recortados por la línea de tres: dentro del arco (zona y media distancia) o fuera de él (triples).
const ARCO = 'M9 0V26A67.5 67.5 0 0 0 141 26V0Z';
const ESQ_IZQ = 'M0 0H9V26H0Z';
const ESQ_DER = 'M141 0H150V26H141Z';
const FUERA = `M0 0H150V140H0Z ${ARCO} ${ESQ_IZQ} ${ESQ_DER}`;
const FORMAS: Record<Zona, { d: string; dentro?: boolean; fuera?: boolean }> = {
  pintura: { d: 'M50.5 0H99.5V58H50.5Z' },
  'media-izq': { d: 'M0 0H50.5V140H0Z', dentro: true },
  'media-cen': { d: 'M50.5 58H99.5V140H50.5Z', dentro: true },
  'media-der': { d: 'M99.5 0H150V140H99.5Z', dentro: true },
  'esq-izq': { d: ESQ_IZQ },
  'esq-der': { d: ESQ_DER },
  'tri-izq': { d: 'M0 0H50.5V140H0Z', fuera: true },
  'tri-cen': { d: 'M50.5 0H99.5V140H50.5Z', fuera: true },
  'tri-der': { d: 'M99.5 0H150V140H99.5Z', fuera: true },
};

export function MapaTiros({ tiros, modo, alElegir, etiqueta }: { tiros: Tiro[]; modo: 'puntos' | 'calor'; alElegir?: (x: number, y: number) => void; etiqueta: string }) {
  const zonas = useMemo(() => porZona(tiros), [tiros]);
  const id = useId().replace(/:/g, '');
  const elegir = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!alElegir) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const { x, y } = posicionDe(ev.clientX - r.left, ev.clientY - r.top, r.width, r.height);
    alElegir(x, y);
  };
  return (
    <svg className={`pista mapa-tiros${alElegir ? ' elegible' : ''}`} viewBox="0 0 150 140" role="img" aria-label={etiqueta} onPointerUp={elegir}>
      <Suelo />
      <Cancha />
      {modo === 'calor' && (
        <>
          <defs>
            <clipPath id={`${id}-dentro`}><path d={ARCO} /></clipPath>
            <clipPath id={`${id}-fuera`}><path d={FUERA} clipRule="evenodd" /></clipPath>
          </defs>
          {ZONAS.filter((z) => zonas[z.id].i > 0).map((z) => {
            const f = FORMAS[z.id];
            return <path key={z.id} d={f.d} fill={colorCalor(zonas[z.id].pct)} opacity={0.62} clipPath={f.dentro ? `url(#${id}-dentro)` : f.fuera ? `url(#${id}-fuera)` : undefined} />;
          })}
        </>
      )}
      {modo === 'calor' && ZONAS.filter((z) => zonas[z.id].i > 0).map((z) => (
        <g key={z.id} className={`calor-texto${z.id.startsWith('esq') ? ' chico' : ''}`} transform={`translate(${z.cx} ${z.cy})`}>
          <text y="-1.5" className="pct">{zonas[z.id].pct}%</text>
          <text y="5" className="de">{zonas[z.id].a}/{zonas[z.id].i}</text>
        </g>
      ))}
      {modo === 'puntos' && tiros.map((t, i) => {
        const X = (t.x / 100) * 150;
        const Y = (t.y / 100) * 140;
        return t.ok
          ? <circle key={i} className="tiro-ok" cx={X} cy={Y} r="2.6" />
          : <path key={i} className="tiro-fallo" d={`M${X - 2.2} ${Y - 2.2}L${X + 2.2} ${Y + 2.2}M${X + 2.2} ${Y - 2.2}L${X - 2.2} ${Y + 2.2}`} />;
      })}
    </svg>
  );
}

/** Mapa con sus mandos: de quién (todas o una) y cómo se ve (puntos o calor), y las cifras de debajo. */
export function PanelMapa({ tiros, jugadoras }: { tiros: Tiro[]; jugadoras: { id: string; numero: string; nombre: string }[] }) {
  const [modo, setModo] = useState<'puntos' | 'calor'>('calor');
  const [quien, setQuien] = useState<string>('todas');
  const con = jugadoras.filter((j) => tiros.some((t) => t.j === j.id));
  const vistos = quien === 'todas' ? tiros : tiros.filter((t) => t.j === quien);
  const r = resumenTiros(vistos);
  const texto = (c: { a: number; i: number; pct: number | null }) => (c.i ? `${c.a}/${c.i} · ${c.pct}%` : '–');
  if (!tiros.length) return <p className="vacio">Todavía no hay tiros marcados en la pista. Activa «Marcar tiros» al apuntar y verás aquí de dónde tira cada una.</p>;
  return (
    <section className="panel-mapa" aria-label="Mapa de tiros">
      <div className="niveles envuelto" role="group" aria-label="De quién">
        <button className={quien === 'todas' ? 'chip on' : 'chip'} aria-pressed={quien === 'todas'} onClick={() => setQuien('todas')}>Equipo</button>
        {con.map((j) => <button key={j.id} className={quien === j.id ? 'chip on' : 'chip'} aria-pressed={quien === j.id} onClick={() => setQuien(j.id)}>#{j.numero || '?'}</button>)}
      </div>
      <div className="ramas" role="group" aria-label="Cómo verlo">
        <button className={modo === 'calor' ? 'on' : ''} aria-pressed={modo === 'calor'} onClick={() => setModo('calor')}>Calor</button>
        <button className={modo === 'puntos' ? 'on' : ''} aria-pressed={modo === 'puntos'} onClick={() => setModo('puntos')}>Tiros</button>
      </div>
      <MapaTiros tiros={vistos} modo={modo} etiqueta={`Mapa de tiros: ${r.tc.a} de ${r.tc.i}`} />
      <dl className="cifras-tiro">
        <div><dt>Tiros de campo</dt><dd>{texto(r.tc)}</dd></div>
        <div><dt>Dobles</dt><dd>{texto(r.t2)}</dd></div>
        <div><dt>Triples</dt><dd>{texto(r.t3)}</dd></div>
        <div><dt>Efectivo</dt><dd>{r.efg === null ? '–' : `${r.efg}%`}</dd></div>
      </dl>
      {modo === 'calor' && <p className="leyenda-calor"><i /> Rojo tira mal · verde tira bien. Cada zona dice cuántos metió de cuántos.</p>}
    </section>
  );
}
