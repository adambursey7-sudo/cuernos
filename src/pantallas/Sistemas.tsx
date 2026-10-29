import { Marca } from '../Logo';
import { Pista } from '../pizarra/Pista';
import { todosLosSistemas } from '../sistemas/almacen';
import { NIVELES } from '../sistemas/tipos';

const nombreNivel = (id: string) => NIVELES.find((n) => n.id === id)?.nombre ?? id;

export function Sistemas({ abrir, crear }: { abrir: (id: string) => void; crear: () => void }) {
  const lista = todosLosSistemas();
  return (
    <section className="pantalla">
      <Marca className="marca-cabecera" />
      <div className="titulo-fila">
        <h1 className="titulo">Sistemas</h1>
        <button className="nueva" onClick={crear}>+ Nueva jugada</button>
      </div>
      <ul className="lista">
        {lista.map((s) => (
          <li key={s.id}>
            <button className="tarjeta" onClick={() => abrir(s.id)}>
              <span className="mini">
                <Pista sistema={s} t={0} />
              </span>
              <span className="datos">
                <span className="nombre">{s.nombre}</span>
                <span className="meta">
                  Desde {nombreNivel(s.nivelMinimo).toLowerCase()} · {s.pasos.length} {s.pasos.length === 1 ? 'paso' : 'pasos'}
                </span>
                {s.propio && <span className="mia">Mía</span>}
                {s.borrador && <span className="aviso">Borrador por revisar</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
