// Jugada desde un vídeo (grabación de pantalla de un reel): el móvil saca unas imágenes, Jarvis se las pasa a Claude
// y vuelve un BORRADOR para revisar en la pizarra. Nada se guarda hasta tocar «Guardar como mía».
import { useRef, useState } from 'react';
import { PizarraGrande } from '../pizarra/PizarraGrande';
import { guardarMio, nuevoId } from '../sistemas/almacen';
import type { Sistema } from '../sistemas/tipos';
import { validarEjercicio } from '../recursos/ejercicioIA';
import { sacarFotogramas } from '../recursos/fotogramas';
import { enviarVideo, esperar, leerConexion } from '../recursos/jarvis';

type Fase = 'elegir' | 'sacando' | 'esperando';

export function JugadaVideo({ volver, guardada }: { volver: () => void; guardada: () => void }) {
  const con = leerConexion();
  const [fase, setFase] = useState<Fase>('elegir');
  const [error, setError] = useState('');
  const [borrador, setBorrador] = useState<Sistema | null>(null);
  const [aviso, setAviso] = useState('');
  const cancelado = useRef(false);

  const elegir = async (archivo: File | undefined) => {
    if (!archivo || !con) return;
    cancelado.current = false;
    setError('');
    try {
      setFase('sacando');
      const fotos = await sacarFotogramas(archivo);
      if (cancelado.current) return;
      setFase('esperando');
      const id = await enviarVideo(con, fotos);
      const crudo = await esperar(con, id, () => cancelado.current);
      const r = validarEjercicio(crudo, nuevoId());
      if (!r.ok) throw new Error(`Claude no ha podido dibujar la jugada (${r.motivo}). Prueba con un vídeo más claro o más corto.`);
      setBorrador({ ...r.sistema, tipo: 'ataque', nivelMinimo: 'senior', borrador: true });
    } catch (e) {
      if (!cancelado.current) setError(e instanceof Error ? e.message : 'No ha salido bien.');
    } finally {
      setFase('elegir');
    }
  };

  const guardar = () => {
    if (!borrador) return;
    try {
      guardarMio({ ...borrador, id: nuevoId(), propio: true });
      setAviso('Guardada en tus jugadas, como borrador por revisar.');
      guardada();
    } catch {
      setError('Este móvil no deja guardar.');
    }
  };

  return (
    <section className="pantalla borrador-ia">
      <div className="cabecera">
        <button className="atras" onClick={() => { cancelado.current = true; volver(); }} aria-label="Volver a las jugadas">‹</button>
        <h2 className="nombre-sistema">Jugada desde un vídeo</h2>
      </div>
      {!con && <p className="aviso">Primero conecta Jarvis: en Biblioteca → Ejercicios → «Pedir a Claude» se hace una sola vez.</p>}
      {con && !borrador && (
        <>
          <p className="meta">Elige una grabación de pantalla del reel o un vídeo de la jugada. Se sacan unas imágenes en tu móvil y solo esas van a Claude (por tu Jarvis). Sin nombres ni caras que importen: mejor un vídeo de la pizarra o de la pista vista desde arriba.</p>
          <label className="subir-archivo">
            <input type="file" accept="video/*" disabled={fase !== 'elegir'} onChange={(ev) => { void elegir(ev.target.files?.[0]); ev.target.value = ''; }} />
            {fase === 'sacando' ? 'Sacando imágenes…' : fase === 'esperando' ? 'Claude está dibujando… puede tardar un minuto' : 'Elegir vídeo'}
          </label>
          {fase === 'esperando' && <button className="secundario" onClick={() => { cancelado.current = true; setFase('elegir'); }}>Cancelar</button>}
        </>
      )}
      {error && <p className="aviso" role="alert">{error}</p>}
      {borrador && (
        <>
          <p className="meta">Borrador de Claude · {aviso ? 'guardado' : 'sin guardar'}</p>
          <h3 className="sub">{borrador.nombre}</h3>
          <PizarraGrande sistema={borrador} conPasos />
          {aviso ? <p className="aviso" role="status">{aviso}</p> : (
            <>
              <button className="principal ancho" onClick={guardar}>Guardar como mía</button>
              <button className="secundario" onClick={() => setBorrador(null)}>Probar con otro vídeo</button>
            </>
          )}
          <p className="meta">Claude solo ve imágenes sueltas: puede equivocarse. Míralo moverse y corrígelo en el editor antes de usarlo.</p>
        </>
      )}
    </section>
  );
}
