// Un ejercicio abierto: su pizarra animada a lo grande (como la B de los bocetos), sus datos y de qué sistema sale.
import { useState } from 'react';
import { TIPOS, type Ejercicio as EjercicioDatos } from '../ejercicios/ejercicios';
import { Pista } from '../pizarra/Pista';
import { useJugada } from '../pizarra/useJugada';
import { NIVELES } from '../sistemas/tipos';
import { jugadoresDe } from './Ejercicios';

function Dato({ nombre, valor, borrador }: { nombre: string; valor: string; borrador?: boolean }) {
  return (
    <div className="dato">
      <dt>{nombre}</dt>
      <dd>
        {valor}
        {borrador && <span className="aviso"> borrador</span>}
      </dd>
    </div>
  );
}

export function Ejercicio({ e, volver, verSistema }: { e: EjercicioDatos; volver: () => void; verSistema: () => void }) {
  const p = e.pizarra;
  const total = p?.pasos.length ?? 1;
  const jugada = useJugada(total);
  const { paso, t } = jugada;
  // Con defensa si el formato la tiene (2x2, 3x3, 5x5); se puede quitar.
  const [conDefensa, setConDefensa] = useState(!!e.defensores);
  const revisa = (x: EjercicioDatos['porRevisar'][number]) => e.porRevisar.includes(x);

  return (
    <section className="pantalla sistema ficha-ejercicio">
      <div className="cabecera">
        <button className="atras" onClick={volver} aria-label="Volver">‹</button>
        <h1 className="nombre-sistema">
          {e.formato && <span className="formato">{e.formato}</span>} {e.nombre}
        </h1>
      </div>

      {p ? (
        <>
          <div className="marcador-fila">
            <div className="marcador" aria-live="polite">
              <span className="numero">{paso + 1}</span>
              <span className="de">/ {total}</span>
            </div>
            <div className="extras">
              <button className="chip" onClick={() => jugada.cambiarVelocidad()} aria-label="Cambiar la velocidad">
                {String(jugada.velocidad).replace('.', ',')}×
              </button>
              <button className={conDefensa ? 'chip defensa on' : 'chip defensa'} aria-pressed={conDefensa} onClick={() => setConDefensa(!conDefensa)} aria-label="Enseñar u ocultar la defensa">
                ✕
              </button>
            </div>
          </div>
          <div className="pizarra">
            <Pista sistema={p} t={t} conDefensa={conDefensa} />
          </div>
          <p className="explica">{p.pasos[paso].texto}</p>
          <div className="mandos">
            <button onClick={() => jugada.anterior()} disabled={t <= 1}>Atrás</button>
            <button onClick={() => jugada.todo()}>▶ Todo</button>
            <button className="principal" onClick={() => jugada.siguiente()} disabled={t >= total}>Siguiente</button>
          </div>
        </>
      ) : (
        <p className="vacio">Este ejercicio aún no tiene pizarra: se dibuja cuando revises la ficha.</p>
      )}

      <dl className="datos-ejercicio">
        <Dato nombre="Tipo" valor={TIPOS.find((x) => x.id === e.tipo)!.nombre} borrador={revisa('tipo')} />
        {jugadoresDe(e) && <Dato nombre="Jugadores" valor={jugadoresDe(e)!.replace('jug.', 'jugadores')} />}
        <Dato nombre="Tiempo" valor={`${e.minutos} min`} borrador={revisa('tiempo')} />
        <Dato nombre="Material" valor={e.material.join(', ')} borrador={revisa('material')} />
        <Dato nombre="Nivel" valor={`Desde ${NIVELES.find((n) => n.id === e.nivel)!.nombre.toLowerCase()}`} />
      </dl>
      {e.porRevisar.length > 0 && (
        <p className="pie-borrador">
          Lo marcado como <b>borrador</b> no está en la ficha{revisa('pizarra') ? ', y la pizarra está sacada de los pasos del sistema' : ''}: revísalo antes de usarlo con el equipo.
        </p>
      )}
      <button className="ver-sistema" onClick={verSistema}>Sale de la ficha de {e.sistema.nombre} ›</button>
    </section>
  );
}
