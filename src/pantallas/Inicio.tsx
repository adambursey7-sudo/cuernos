// Inicio de club (interfaz C, elegida por Adam el 29/10): «Seguir donde lo dejaste» y colecciones que se deslizan de lado.
import type { ReactNode } from 'react';
import { Marca } from '../Logo';
import { Pista } from '../pizarra/Pista';
import { todosLosEjercicios } from '../ejercicios/ejercicios';
import { buscarSistema, todosLosSistemas } from '../sistemas/almacen';
import type { Sistema } from '../sistemas/tipos';
import { leerUltima } from '../ultima';

function Coleccion({ titulo, verTodas, children }: { titulo: string; verTodas?: () => void; children: ReactNode }) {
  return (
    <section className="coleccion" aria-label={titulo}>
      <div className="coleccion-cabeza">
        <h2 className="sub">{titulo}</h2>
        {verTodas && <button className="ver-todas" onClick={verTodas}>Ver todas</button>}
      </div>
      <ul className="carrusel">{children}</ul>
    </section>
  );
}

function TarjetaJugada({ s, abrir }: { s: Sistema; abrir: () => void }) {
  return (
    <li>
      <button className="tarjeta-col" onClick={abrir}>
        <span className="mini"><Pista sistema={s} t={0} /></span>
        <span className="nombre">{s.nombre}</span>
        <span className="meta">{s.pasos.length} {s.pasos.length === 1 ? 'paso' : 'pasos'}{s.borrador ? ' · borrador' : ''}</span>
      </button>
    </li>
  );
}

export function Inicio({ abrir, abrirEjercicio, crear, verTodas, verEjercicios }: {
  abrir: (id: string, paso?: number) => void;
  abrirEjercicio: (id: string) => void;
  crear: () => void;
  verTodas: () => void;
  verEjercicios: () => void;
}) {
  const lista = todosLosSistemas();
  const mias = lista.filter((s) => s.propio);
  const libro = lista.filter((s) => !s.propio);
  const ataque = libro.filter((s) => s.tipo === 'ataque');
  const defensa = libro.filter((s) => s.tipo === 'defensa');
  const ejercicios = todosLosEjercicios().filter((e) => !e.sistema.propio);

  // Si la última jugada se borró, o es la primera vez, se propone empezar por la primera del libro.
  const ultima = leerUltima();
  const seguida = ultima ? buscarSistema(ultima.id) : undefined;
  const sigue = seguida ? { s: seguida, paso: Math.min(ultima!.paso, seguida.pasos.length - 1) } : lista[0] ? { s: lista[0], paso: 0 } : undefined;

  return (
    <section className="pantalla inicio">
      <Marca className="marca-cabecera" />
      <h1 className="saludo">Hola, entrenador</h1>

      {sigue && (
        <button className="seguir" onClick={() => abrir(sigue.s.id, sigue.paso)}>
          <span className="mini"><Pista sistema={sigue.s} t={sigue.paso + 1} /></span>
          <span className="datos">
            <span className="rotulo">{seguida ? 'Seguir donde lo dejaste' : 'Para empezar'}</span>
            <span className="nombre">{sigue.s.nombre}</span>
            <span className="paso-de">Paso {sigue.paso + 1} de {sigue.s.pasos.length}</span>
          </span>
        </button>
      )}

      {mias.length === 0 ? (
        <button className="nueva-ancha" onClick={crear}>
          <span className="mas" aria-hidden="true">+</span>
          <span className="datos">
            <span className="nombre">Nueva jugada</span>
            <span className="meta">Dibújala con el dedo y se guarda en «Mis jugadas»</span>
          </span>
        </button>
      ) : (
        <Coleccion titulo="Mis jugadas" verTodas={verTodas}>
          <li>
            <button className="tarjeta-col nueva-col" onClick={crear}>
              <span className="mas" aria-hidden="true">+</span>
              <span className="nombre">Nueva jugada</span>
            </button>
          </li>
          {mias.map((s) => <TarjetaJugada key={s.id} s={s} abrir={() => abrir(s.id)} />)}
        </Coleccion>
      )}

      {ataque.length > 0 && (
        <Coleccion titulo="Ataque" verTodas={verTodas}>
          {ataque.map((s) => <TarjetaJugada key={s.id} s={s} abrir={() => abrir(s.id)} />)}
        </Coleccion>
      )}

      {defensa.length > 0 && (
        <Coleccion titulo="Defensa" verTodas={verTodas}>
          {defensa.map((s) => <TarjetaJugada key={s.id} s={s} abrir={() => abrir(s.id)} />)}
        </Coleccion>
      )}

      {ejercicios.length > 0 && (
        <Coleccion titulo="Ejercicios" verTodas={verEjercicios}>
          {ejercicios.map((e) => (
            <li key={e.id}>
              <button className="tarjeta-col ejercicio" onClick={() => abrirEjercicio(e.id)}>
                <span className="formato">{e.formato || '·'}</span>
                <span className="texto-ejercicio">{e.nombre}</span>
                <span className="meta">De {e.sistema.nombre}</span>
              </button>
            </li>
          ))}
        </Coleccion>
      )}
    </section>
  );
}
