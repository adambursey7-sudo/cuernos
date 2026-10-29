import { Pista } from '../pizarra/Pista';
import { SISTEMAS } from '../sistemas/datos';
import { NIVELES } from '../sistemas/tipos';

const nombreNivel = (id: string) => NIVELES.find((n) => n.id === id)?.nombre ?? id;

export function Sistemas({ abrir }: { abrir: (id: string) => void }) {
  return (
    <section className="pantalla">
      <h1 className="titulo">Sistemas</h1>
      <ul className="lista">
        {SISTEMAS.map((s) => (
          <li key={s.id}>
            <button className="tarjeta" onClick={() => abrir(s.id)}>
              <span className="mini">
                <Pista sistema={s} t={0} />
              </span>
              <span className="datos">
                <span className="nombre">{s.nombre}</span>
                <span className="meta">
                  Desde {nombreNivel(s.nivelMinimo).toLowerCase()} · {s.pasos.length} pasos
                </span>
                {s.borrador && <span className="aviso">Borrador por revisar</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
