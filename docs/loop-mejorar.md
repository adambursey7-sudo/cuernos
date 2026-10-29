# Loop «Cuernos profesional»

Empezado el 29/10/2026. Objetivo de Adam: que Cuernos sea muy dinámica y se parezca a las apps profesionales, cogiendo
lo mejor de cada una. Trabaja en `C:\dev\baloncesto-app`, rama `loop/mejorar`; lo aprobado se une a `main` y se publica.

## Lo mejor de cada app (de dónde sale cada idea)
- **FastDraw / TacticalPad:** animación fluida por fotogramas, defensa que se mueve, velocidad, modo presentación.
- **Coach's Clipboard / CoachesPad:** dibujar una jugada con el dedo en segundos y compartirla.
- **Elite Hoops:** biblioteca de más de 200 ejercicios, planes de entrenamiento en PDF, modo presentación.
- **The Hoops Geek:** planificador arrastrando ejercicios, vídeo o nota en cada uno, compartir con un enlace.
- **Sportplan:** biblioteca grande de ejercicios por categoría y planificador de sesiones.
- **농구링 플레이북 (app coreana nueva):** la IA comenta espacios y emparejamientos (queda para un loop futuro, porque cuesta dinero).

## Decisiones de Adam (29/10)
- Bloques: pizarra viva + editor, ejercicios y sesiones, compartir e imprimir, acabado profesional. La IA, más adelante.
- **Con defensa** en la pizarra (se puede ocultar con un botón).
- Todo **solo en el móvil**: sin cuentas, gratis. Botón de copia de seguridad (descargar y cargar un archivo).
- **Por tramos:** al acabar cada tramo, bocetos y parar hasta que Adam lo apruebe.

## Reglas del loop
1. **Diseño antes de programar:** cada pantalla nueva tiene 2 o 3 formas, con boceto, ventajas e inconvenientes, en la página de bocetos. Se pregunta a Adam y esa parte no se programa hasta que conteste (lo que no dependa de ella sí avanza).
2. **Página de bocetos** (`docs/loop-mejorar/bocetos.html`, artifact https://claude.ai/artifact/5ixBoL1CLZttL7gJMf97FJ; para publicar, copiar la página y `capturas/` a la carpeta temporal de la sesión y publicar desde allí con `url`): cada vuelta añade arriba una entrada con capturas reales en tamaño iPhone, «Hecho» y «Mejorable». Lo mejorable lo arregla el loop por su cuenta si no es una decisión de diseño.
3. **Cada vuelta:** `npm test` y `npm run build` sin errores, y capturas con `scripts/capturas.mjs`. La IA no inventa jugadas: los ejercicios y sistemas salen de las fichas de `sistemas/` o se marcan como borrador para que Adam los revise.
4. **Al cerrar un tramo:** `/code-review low`, entrada de cierre en los bocetos, aviso a Adam y parar. Se une a `main` y se publica (`sh scripts/publicar.sh`) solo cuando Adam lo aprueba.
5. Ligero para el portátil: nada de librerías pesadas; la pizarra sigue siendo SVG.
6. Nada de nombres de menores ni datos de jugadores reales en el código (es público).

## Tramo 1: pizarra viva y editor
- [x] 1.1 Diseño → Adam eligió (29/10): presentación **A · Solo pista** (pista entera, tocar derecha/izquierda para avanzar/retroceder, mandos que se esconden, explicación en una línea) y editor **B · Arrastra y elige** (arrastrar al jugador y elegir qué movimiento ha sido; si tiene balón, bote o pase primero; curva automática que se afina tocando la flecha).
- [x] 1.2 Defensa: X que siguen a su atacante entre él y la canasta, y reaccionan a los bloqueos (pasar por detrás o por delante); botón para ocultarla.
- [x] 1.3 Animación viva: balón que bota en los botes y viaja con arco en los pases, flechas de bote en zigzag, velocidad 0,5× / 1× / 2×, deslizar el dedo para cambiar de paso, pantalla completa.
- [x] 1.4 Editor: crear sistema, colocar jugadores arrastrando, añadir pasos dibujando cortes, botes, bloqueos y pases con el dedo, deshacer, duplicar como variante.
- [x] 1.5 Guardar en el móvil + copia de seguridad (descargar y cargar archivo).
- [x] 1.6 Cierre del tramo (revisión de código: 3 fallos arreglados). Esperando visto bueno de Adam para unir a main y publicar.

## Tramo 2: ejercicios y sesiones
- [ ] 2.1 Diseño: biblioteca de ejercicios y planificador de sesiones (2 o 3 formas) → preguntar.
- [ ] 2.2 Ejercicios de las fichas (2x0 a 5x5) con su pizarra animada, nivel, tiempo, material y número de jugadores; filtros por sistema y nivel.
- [ ] 2.3 Sesiones: montar el entrenamiento con ejercicios, tiempos y total; varias por equipo.
- [ ] 2.4 Cronómetro de pista: pantalla grande, aviso con sonido al cambiar de ejercicio y siguiente ejercicio a la vista.
- [ ] 2.5 Cierre del tramo.

## Tramo 3: compartir e imprimir
- [ ] 3.1 Enviar una jugada por enlace (que se abra animada en el móvil del jugador) o como imagen.
- [ ] 3.2 Ficha para imprimir de un sistema y de una sesión.
- [ ] 3.3 Cierre del tramo.

## Tramo 4: acabado profesional
- [ ] 4.1 Transiciones entre pantallas, gestos y estados vacíos cuidados.
- [ ] 4.2 Pantalla de bienvenida con el logo y primera vez guiada.
- [ ] 4.3 Revisión general con capturas, boceto final («Cambios» y «Mejoras para el próximo loop»).

## Registro
- 29/10: plan escrito y decisiones de Adam apuntadas.
- 29/10: 1.1 bocetos de diseño publicados (https://claude.ai/artifact/5ixBoL1CLZttL7gJMf97FJ); Adam eligió presentación A y editor B.
- 29/10: 1.2 defensa hecha (X entre atacante y canasta, ayuda hacia el balón, retraso que las deja atrás en cortes y bloqueos, botón para ocultarla); 8 pruebas pasan.
- 29/10: 1.3 animación viva hecha (balón que vuela y bota con sombra, botes en zigzag, Siguiente anima, velocidad, deslizar, modo presentación A con mandos que se esconden y columna lateral en horizontal); arreglado un choque de estilos que descolocaba las líneas de la pista; 9 pruebas pasan.
- 29/10: 1.4 editor hecho (arrastra y elige, pase, texto automático, deshacer, + paso, guardar en el móvil, editar, borrar, duplicar como variante); probado con un guion que arrastra como un dedo; 15 pruebas pasan. Pendiente para 1.5: curvar flechas.
- 29/10: 1.5 copia de seguridad (descargar y cargar archivo, probado borrando todo y recuperando) y flechas que se curvan al tocarlas; pestaña «Colores» pasa a «Ajustes»; 20 pruebas pasan.
- 29/10: 1.6 tramo 1 cerrado; revisión de código con 3 fallos arreglados (teclas de la presentación, copia vacía en Safari, Deshacer y textos); loop parado hasta que Adam apruebe.
- 29/10: Adam la probó en el iPhone (sin publicar). Hecho: no se selecciona texto al arrastrar y botón GIF (enviar o guardar). Bocetos v6 publicados: mover jugadores (A dibuja / B herramienta / C grabar), logo (A balón / B jugada / C la U son cuernos) e interfaz (A Marcador pro / B pizarra primero / C inicio de club); esperando que Adam elija. Unir a main y publicar, después.
- 29/10: Adam eligió interfaz C (inicio de club) y logo idea C con nombre HORNS. Bocetos v7: 6 versiones del logo HORNS; falta que elija una, el modo de mover jugadores (recomendada A) y si la app entera se llama Horns.
- 29/10: Adam quiere definir la tipografía y un logo con más gancho. Bocetos v8: 6 tipografías (Big Shoulders, Anton, Unbounded, Graduate, Teko, Archivo ancha) y 5 logos nuevos (zona-toro, costuras-cuernos, aro-toro, mano, toro de frente) con prompts para Gemini.
- 29/10: Adam eligió tipografía D · Graduate; el logo sigue sin convencerle, le gusta la U de cuernos. Bocetos v9: 8 variantes de la U con Graduate (clásica, gruesa con balón, universitaria, con contorno, afilada, encima, en arco, parche).
