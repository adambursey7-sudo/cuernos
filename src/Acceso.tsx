// Pantalla de acceso (falsa por ahora: solo existe el usuario de Adam y nada sale del móvil).
// Al entrar suena una pequeña animación (los cuernos se abren y sale el saludo) y la app aparece por detrás.
import { useState } from 'react';
import { GlifoO } from './Logo';

const CLAVE = 'horns.acceso';
const USUARIO = 'Adam';
const CONTRASENA = '8520';

const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
const poner = (v: string | null) => { try { if (v === null) localStorage.removeItem(CLAVE); else localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento: pedirá entrar cada vez */ } };

/** Usuario con la sesión abierta, o null. */
export const usuarioActual = () => (leer() === USUARIO ? USUARIO : null);
export const cerrarSesion = () => { poner(null); location.reload(); };

export function ConAcceso({ children }: { children: React.ReactNode }) {
  const [dentro, setDentro] = useState(usuarioActual() !== null);
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [fallo, setFallo] = useState(false);
  const [fase, setFase] = useState<'pide' | 'entra' | 'fuera'>('pide');

  if (dentro) return <>{children}</>;

  const entrar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (usuario.trim().toLowerCase() !== USUARIO.toLowerCase() || clave !== CONTRASENA) { setFallo(true); return; }
    poner(USUARIO);
    setFase('entra');
    setTimeout(() => setFase('fuera'), 1500);
    setTimeout(() => setDentro(true), 1900);
  };

  return (
    <>
      {fase === 'fuera' && children}
      <div className={`acceso ${fase}`}>
        <div className="acceso-logo"><GlifoO className="acceso-o" /></div>
        {fase === 'pide' ? (
          <form className="acceso-form" onSubmit={entrar}>
            <h1 className="acceso-titulo">Horns</h1>
            <label>Usuario
              <input value={usuario} onChange={(e) => { setUsuario(e.target.value); setFallo(false); }} autoComplete="username" autoCapitalize="words" autoFocus />
            </label>
            <label>Contraseña
              <input type="password" inputMode="numeric" value={clave} onChange={(e) => { setClave(e.target.value); setFallo(false); }} autoComplete="current-password" />
            </label>
            {fallo && <p className="acceso-fallo" role="alert">Usuario o contraseña incorrectos</p>}
            <button type="submit">Entrar</button>
          </form>
        ) : (
          <p className="acceso-hola" role="status">Hola Coach {USUARIO}</p>
        )}
      </div>
    </>
  );
}
