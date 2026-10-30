// Hoja «Compartir» (3.1, opción C elegida por Adam): enlace animado, GIF, imagen del paso y QR para el equipo.
import { useEffect, useState } from 'react';
import { encode } from 'uqr';
import type { Sistema } from '../sistemas/tipos';
import { leerColores } from '../temas';
import { crearEnlace } from './enlace';
import './compartir.css';

type Vista = 'menu' | 'qr';

export function HojaCompartir({ s, conDefensa, paso, hacerGif, cerrar }: {
  s: Sistema;
  conDefensa: boolean;
  /** Paso que se está viendo (desde 0): el de la imagen. */
  paso: number;
  hacerGif: () => void;
  cerrar: () => void;
}) {
  const [enlace, setEnlace] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>('menu');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    // La dirección de la app tal y como la ve quien envía (en GitHub Pages, …/cuernos/).
    crearEnlace(s, conDefensa, leerColores(), location.origin + location.pathname).then(setEnlace, () => setAviso('No se ha podido crear el enlace.'));
  }, [s, conDefensa]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [cerrar]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace!);
      setAviso('Enlace copiado. Pégalo en el chat del equipo.');
    } catch {
      setAviso('No se ha podido copiar el enlace.');
    }
  };

  const enviarEnlace = async () => {
    if (!enlace) return;
    const datos = { title: s.nombre, text: `${s.nombre} · ábrela animada:`, url: enlace };
    if (navigator.share) {
      try {
        await navigator.share(datos);
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    await copiar();
  };

  const enviarImagen = async () => {
    setOcupado(true);
    try {
      const { crearImagen, compartirArchivo } = await import('../pizarra/gif');
      await compartirArchivo(await crearImagen(s, conDefensa, paso), `${s.nombre} paso ${paso + 1}`, 'png');
    } catch {
      setAviso('No se ha podido crear la imagen.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="hoja-fondo" onClick={cerrar}>
      <div className="hoja" role="dialog" aria-modal="true" aria-label={`Compartir ${s.nombre}`} onClick={(e) => e.stopPropagation()}>
        <div className="hoja-asa" aria-hidden="true" />
        {vista === 'menu' ? (
          <>
            <h2 className="hoja-titulo">Compartir {s.nombre}</h2>
            <button className="hoja-fila principal" onClick={enviarEnlace} disabled={!enlace}>
              <span className="icono" aria-hidden="true">↗</span>
              <span><b>Enlace animado</b><small>Se abre en el móvil del jugador, sin instalar nada</small></span>
            </button>
            <button className="hoja-fila" onClick={hacerGif}>
              <span className="icono" aria-hidden="true">▶</span>
              <span><b>GIF</b><small>Se mueve en el chat</small></span>
            </button>
            <button className="hoja-fila" onClick={enviarImagen} disabled={ocupado}>
              <span className="icono" aria-hidden="true">▣</span>
              <span><b>Imagen del paso {paso + 1}</b><small>{ocupado ? 'Preparando…' : 'Para el vestuario o para imprimir'}</small></span>
            </button>
            <button className="hoja-fila" onClick={() => setVista('qr')} disabled={!enlace}>
              <span className="icono" aria-hidden="true">▦</span>
              <span><b>QR para el equipo</b><small>Lo escanean con la cámara, sin pasar teléfonos</small></span>
            </button>
          </>
        ) : (
          <>
            <h2 className="hoja-titulo centrado">{s.nombre}</h2>
            <p className="hoja-nota">Escanea con la cámara</p>
            {/* Negro sobre blanco siempre, sea cual sea el tema: así lo lee cualquier cámara. */}
            <Qr texto={enlace!} nombre={s.nombre} />
            <div className="fila-chips centrado">
              <button className="chip on" onClick={copiar}>Copiar enlace</button>
              <button className="chip" onClick={() => setVista('menu')}>Volver</button>
            </div>
          </>
        )}
        {aviso && <p className="hoja-aviso" role="status">{aviso}</p>}
        <button className="hoja-cerrar" onClick={cerrar}>Cerrar</button>
      </div>
    </div>
  );
}

/** El QR en un solo trazo SVG: cada cuadro negro es un «M x y h1 v1 h-1 z». */
function Qr({ texto, nombre }: { texto: string; nombre: string }) {
  const { data, size } = encode(texto, { ecc: 'L', border: 2 });
  let d = '';
  data.forEach((fila, y) => fila.forEach((negro, x) => negro && (d += `M${x} ${y}h1v1h-1z`)));
  return (
    <svg className="qr" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label={`Código QR de ${nombre}`}>
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
