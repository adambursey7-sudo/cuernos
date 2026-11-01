// «¿Quién puede?»: voy / no voy / quizá de cada jugadora para un partido o entreno, con el mensaje para el grupo (solo dorsales)
// y el resumen de quién falta. También se pueden pegar las respuestas del grupo y se apuntan solas.
import { useState } from 'react';
import type { Jugadora } from '../diario/diario';
import {
  RESPUESTAS, interpretarRespuestas, mensajePedir, mensajeRecordar, mensajeResumen, ponerRespuesta, resumir, type Cita, type Respuesta,
} from '../disponibilidad/disponibilidad';
import { enviarTexto } from '../recursos/compartirTexto';
import { conDisponibilidad, type Item, type Temporada } from '../temporada/temporada';

export function DisponibilidadDia({ item, t, jugadoras, equipo, cambiar }: { item: Item; t: Temporada; jugadoras: Jugadora[]; equipo: string; cambiar: (t: Temporada) => void }) {
  const [abierta, setAbierta] = useState(false);
  const [pegado, setPegado] = useState('');
  const [aviso, setAviso] = useState('');
  const respuestas = t.disponibilidad?.[item.clave];
  const r = resumir(respuestas, jugadoras.map((j) => j.id));
  const dorsal = (id: string) => jugadoras.find((j) => j.id === id)?.numero || '?';
  const cita: Cita = { tipo: item.tipo, titulo: item.titulo, fecha: item.fecha, hora: item.hora, lugar: item.evento?.lugar || item.fijo?.pista, casa: item.evento?.casa };
  const porDorsal = { si: r.si.map(dorsal), no: r.no.map(dorsal), quiza: r.quiza.map(dorsal), faltan: r.faltan.map(dorsal) };

  const poner = (id: string, resp: Respuesta | null) => cambiar(conDisponibilidad(t, ponerRespuesta(t.disponibilidad, item.clave, id, resp)));
  const mandar = async (texto: string, ok: string) => {
    const res = await enviarTexto(texto);
    setAviso(res === 'nada' ? '' : res === 'copiado' ? `${ok} Copiado: pégalo en el grupo.` : ok);
  };
  const aplicarPegado = () => {
    const leidas = interpretarRespuestas(pegado);
    let nuevo = t.disponibilidad;
    const sinDorsal: string[] = [];
    let n = 0;
    for (const { numero, r: resp } of leidas) {
      const j = jugadoras.find((x) => String(Number(x.numero)) === numero);
      if (!j) { sinDorsal.push(numero); continue; }
      nuevo = ponerRespuesta(nuevo, item.clave, j.id, resp);
      n++;
    }
    cambiar(conDisponibilidad(t, nuevo));
    setPegado('');
    setAviso(`${n} ${n === 1 ? 'respuesta apuntada' : 'respuestas apuntadas'}${sinDorsal.length ? `. No encuentro los dorsales ${sinDorsal.map((d) => `#${d}`).join(' ')}.` : '.'}`);
  };

  return (
    <div className="disponibilidad">
      <button className="chip pequeno" aria-expanded={abierta} onClick={() => setAbierta(!abierta)}>
        ¿Quién puede? {r.si.length} van · {r.no.length} no · {r.faltan.length} sin contestar
      </button>
      {abierta && (
        <>
          <ul className="resp-lista">
            {jugadoras.map((j) => {
              const actual = respuestas?.[j.id];
              return (
                <li key={j.id}>
                  <span className="resp-quien"><b>#{j.numero || '?'}</b> {j.nombre || 'Sin nombre'}</span>
                  <span className="resp-botones" role="group" aria-label={`Respuesta de ${j.nombre || 'la jugadora'}`}>
                    {RESPUESTAS.map(([id, nombre]) => (
                      <button key={id} className={`resp ${id}${actual === id ? ' on' : ''}`} aria-pressed={actual === id} onClick={() => poner(j.id, actual === id ? null : id)}>{nombre}</button>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="fila-chips" role="group" aria-label="Mensajes para el grupo">
            <button className="chip" onClick={() => void mandar(mensajePedir(cita, equipo), 'Mensaje preparado.')}>Mandar al grupo: «¿quién puede?»</button>
            <button className="chip" disabled={r.faltan.length === 0} onClick={() => void mandar(mensajeRecordar(cita, equipo, porDorsal.faltan), 'Recordatorio preparado.')}>Recordar a los que faltan ({r.faltan.length})</button>
            <button className="chip" onClick={() => void mandar(mensajeResumen(cita, equipo, porDorsal), 'Resumen preparado.')}>Mandar el resumen</button>
          </div>
          <label className="campo-diario"><span>Pegar respuestas del grupo</span>
            <textarea rows={3} value={pegado} placeholder={'7 voy\n12 no puede\n4 quizá'} onChange={(ev) => setPegado(ev.target.value)} />
          </label>
          <button className="chip" disabled={!pegado.trim()} onClick={aplicarPegado}>Apuntar las respuestas</button>
          {aviso && <span className="meta" role="status">{aviso}</span>}
        </>
      )}
    </div>
  );
}
