import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/graduate/400.css';
import './estilos.css';
import { aplicarColores, leerColores } from './temas';
import { App } from './App';
import { ConIntro } from './Intro';
import { leerEnlace } from './compartir/enlace';
import { Visor } from './compartir/Visor';

aplicarColores(leerColores());
const raiz = createRoot(document.getElementById('raiz')!);

// Un enlace de jugada (…#j= o …#p=) abre solo el visor, con los colores de quien la manda y sin guardarlos.
leerEnlace(location.hash)
  .then(
    (compartida) => {
      if (compartida?.colores) aplicarColores(compartida.colores, false);
      return compartida ? <Visor datos={compartida} /> : <ConIntro><App /></ConIntro>;
    },
    () => <Visor datos="roto" />,
  )
  .then((pantalla) => raiz.render(<StrictMode>{pantalla}</StrictMode>));

// Si se pega un enlace de jugada con Horns ya abierto, solo cambia lo de detrás de «#»: se vuelve a cargar para leerlo.
window.addEventListener('hashchange', () => {
  if (/^#(.*&)?[jp]=/.test(location.hash)) location.reload();
});
