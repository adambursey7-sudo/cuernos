// Ficha para imprimir de un sistema (3.2, opción A elegida por Adam): un folio con los pasos en miniatura, la idea, la lectura y los errores.
// En pantalla se ve el folio tal y como saldrá; en papel desaparece todo lo demás (ver imprimir.css).
import { useEffect } from 'react';
import { Pista } from '../pizarra/Pista';
import { NIVELES, type Nivel, type Sistema } from '../sistemas/tipos';
import './imprimir.css';

export function Ficha({ s, nivel, volver }: { s: Sistema; nivel: Nivel; volver: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && volver();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [volver]);

  const nombreNivel = NIVELES.find((n) => n.id === nivel)!.nombre;
  const lectura = s.lecturas[nivel];
  const desde = NIVELES.find((n) => n.id === s.nivelMinimo)!.nombre;

  return (
    <section className="pantalla ficha-imprimir">
      <div className="no-imprimir ficha-barra">
        <button className="atras" onClick={volver} aria-label="Volver">‹</button>
        <button className="chip on" onClick={() => window.print()}>⎙ Imprimir o guardar PDF</button>
      </div>

      <article className="papel">
        <header>
          <h1>{s.nombre}</h1>
          <p>{s.tipo === 'ataque' ? 'Ataque' : 'Defensa'} contra defensa {s.contra} · desde {desde}</p>
          {s.borrador && <p className="papel-aviso">Borrador: falta que el entrenador lo confirme.</p>}
        </header>

        <div className="papel-pasos">
          {s.pasos.map((p, i) => (
            <figure key={i}>
              <Pista sistema={s} t={i + 0.01} />
              <figcaption>
                <b>Paso {i + 1}</b>
                {p.texto}
              </figcaption>
            </figure>
          ))}
        </div>

        <h2>Idea</h2>
        <p>{s.idea}</p>
        {lectura && (
          <>
            <h2>Lectura en {nombreNivel.toLowerCase()}</h2>
            <p>{lectura}</p>
          </>
        )}
        <div className="papel-columnas">
          <div>
            <h2>Errores típicos</h2>
            <ul>{s.errores.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
          <div>
            <h2>Ejercicios</h2>
            <ul>{s.ejercicios.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        </div>
        <footer>Horns · {new Date().toLocaleDateString('es-ES')}</footer>
      </article>
    </section>
  );
}
