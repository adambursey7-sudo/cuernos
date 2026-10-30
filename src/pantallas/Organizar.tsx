// Barra común de búsqueda, colecciones y favoritos para «Recursos» y «Mis ejercicios» (tramo 3).
import { useState } from 'react';
import { coleccionesDe, type Filtro } from '../recursos/organizar';

export const FILTRO_VACIO: Filtro = { texto: '', soloFavoritos: false };

export function BarraFiltro({ lista, filtro, cambiar }: { lista: { coleccion: string }[]; filtro: Filtro; cambiar: (f: Filtro) => void }) {
  const colecciones = coleccionesDe(lista);
  return (
    <div className="org-barra">
      <input className="org-buscar" type="search" value={filtro.texto} maxLength={80} placeholder="Buscar por título, nota o etiqueta" aria-label="Buscar" onChange={(e) => cambiar({ ...filtro, texto: e.target.value })} />
      <div className="niveles filtro" role="group" aria-label="Colecciones">
        <button className={filtro.soloFavoritos ? 'chip on' : 'chip'} aria-pressed={filtro.soloFavoritos} onClick={() => cambiar({ ...filtro, soloFavoritos: !filtro.soloFavoritos })}>★ Favoritos</button>
        {colecciones.length > 0 && (
          <button className={filtro.coleccion === undefined ? 'chip on' : 'chip'} aria-pressed={filtro.coleccion === undefined} onClick={() => cambiar({ ...filtro, coleccion: undefined })}>Todas</button>
        )}
        {colecciones.map((c) => (
          <button key={c} className={filtro.coleccion === c ? 'chip on' : 'chip'} aria-pressed={filtro.coleccion === c} onClick={() => cambiar({ ...filtro, coleccion: filtro.coleccion === c ? undefined : c })}>{c}</button>
        ))}
      </div>
    </div>
  );
}

/** Elegir o crear la colección de un elemento. */
export function CampoColeccion({ valor, existentes, cambiar }: { valor: string; existentes: string[]; cambiar: (c: string) => void }) {
  const [nueva, setNueva] = useState('');
  const todas = [...new Set([...existentes, ...(valor ? [valor] : [])])].sort((a, b) => a.localeCompare(b, 'es'));
  const crear = () => {
    const c = nueva.trim().slice(0, 40);
    if (c) { cambiar(c); setNueva(''); }
  };
  return (
    <div className="campo-diario">
      <span>Colección</span>
      <div className="niveles filtro" role="group" aria-label="Colección">
        <button className={valor ? 'chip' : 'chip on'} aria-pressed={!valor} onClick={() => cambiar('')}>Ninguna</button>
        {todas.map((c) => <button key={c} className={c === valor ? 'chip on' : 'chip'} aria-pressed={c === valor} onClick={() => cambiar(c)}>{c}</button>)}
      </div>
      <div className="rec-acciones">
        <input id="org-nueva" value={nueva} maxLength={40} placeholder="Nueva colección (Calentamientos…)" onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') crear(); }} />
        <button className="secundario" onClick={crear} disabled={!nueva.trim()}>Crear</button>
      </div>
    </div>
  );
}

export function Estrella({ activa, cambiar }: { activa: boolean; cambiar: () => void }) {
  return <button className={activa ? 'chip on' : 'chip'} aria-pressed={activa} aria-label="Favorito" onClick={cambiar}>{activa ? '★ Favorito' : '☆ Favorito'}</button>;
}
