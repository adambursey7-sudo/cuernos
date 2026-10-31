# Loop «Diario del entrenador»

Pedido por Adam el 30/10/2026. Trabaja en `C:\dev\baloncesto-t-diario`, rama `loop/diario` (sacada de `main`, que ya tiene todo lo anterior y está publicada). Lo aprobado se une a `main` y se publica con `sh scripts/publicar.sh`.

## El proyecto
Horns pasa de ser una biblioteca de jugadas a ser el **cuaderno del entrenador**: lo que hoy se apunta en una libreta, hecho en el móvil y enlazado con las pizarras.

1. **Plantilla y fichas de jugadoras:** nombre (o apodo), número, posición, puntos fuertes, a mejorar, forma de jugar, cómo entrenarla, notas con fecha.
2. **Equipo:** forma de jugar, virtudes del equipo, qué hay que trabajar y cómo entrenarlo.
3. **Dorsales en las pizarras:** en lugar de 1–5, cada círculo lleva el número de la jugadora que hace ese puesto en ese equipo.
4. **Sistemas propios** con el editor ya hecho, pero pensando en el equipo (quién es la 1, quién es la 5).
5. **Temporada:** fases con objetivos, calendario con partidos, entrenamientos y sesiones enlazadas, semana a semana.
6. **Pasarlo a una IA:** un cuestionario que prepara el prompt (con plantilla, virtudes y calendario) para que lo copies y lo actives tú en Claude u otra IA, e importar lo que devuelva. Además, plantilla desde PDF y calendario desde `.ics`.

## Decisiones de Adam (30/10)
- **Plantilla:** A · lista con dorsal grande y ficha con tres pestañas (Perfil, Entrenar, Notas con fecha).
- **Números en pizarra:** A · «quién es quién» por equipo, con cambio puntual en una jugada. Sin nombres en la pizarra.
- **Temporada:** mezcla · fases arriba, calendario del mes y lista de la semana al tocar.
- **IA:** no automática. Un **cuestionario** dentro de la app va rellenando un prompt preparado (qué quiere, qué no, nivel, objetivos…); la persona lo **copia y lo activa ella** en Claude u otra IA, y lo que vuelva se pega en la app como borrador. Tiene que ser bonito, completo y **editable** (el prompt se puede retocar antes de copiarlo).
- **Plantilla desde un PDF:** subir el PDF con nombres y números y que las jugadoras se creen solas (se lee en el móvil, no se sube a ningún sitio). También desde texto pegado o CSV.
- **Calendario:** importar un `.ics` (Google Calendar, Apple, Outlook) para traer partidos y entrenos, y exportar la temporada a `.ics` para meterla en el calendario del móvil.
- Todo lo posible **automático** al importar (detectar dorsal, nombre y posición; detectar fecha, rival y casa/fuera), siempre con vista previa antes de guardar.

## Reglas del loop
1. **Diseño antes de programar:** cada pantalla nueva tiene 2 o 3 formas con boceto, ventajas e inconvenientes en `docs/loop-diario/bocetos.html`. Se pregunta a Adam y esa parte no se programa hasta que conteste; lo que no dependa de ella sí avanza.
2. **Bocetos cada vuelta:** entrada nueva arriba con capturas reales (tamaño iPhone), «Hecho» y «Mejorable». Lo mejorable lo arregla el loop por su cuenta si no es decisión de diseño. Al final, boceto de «Cambios» y «Mejoras para el próximo loop».
3. **Todo en el móvil, sin cuentas:** los datos viven en el móvil (localStorage) y entran en la **copia de seguridad** (`src/copia.ts`, versión 2 que sigue leyendo las copias viejas).
4. **Privacidad (el repo y la web son públicos):** ningún nombre ni dato de jugadora real en el código, tests, capturas ni bocetos; solo datos de ejemplo inventados y marcados. Las fichas no salen del móvil salvo que Adam exporte. Datos de salud: de momento no hay campo (se decide con Adam más adelante).
5. **Cada vuelta:** `npm test` y `npm run build` sin errores; capturas con `scripts/capturas.mjs`. La IA no inventa jugadas ni ejercicios: lo que venga de una IA entra como **borrador** hasta que Adam lo confirme.
6. Ligero para el portátil: sin librerías pesadas, calendario hecho a mano.
7. **Al cerrar cada tramo:** `/code-review low` (`medium` si toca el dosier y los datos de personas), entrada de cierre en bocetos, aviso a Adam por Telegram (corto, sin rutas) y parar hasta su visto bueno.
8. Servidor de pruebas en el puerto 5314.

## Tramo 1: plantilla y fichas
- [x] 1.1 Diseño → Adam eligió A (30/10).
- [x] 1.2 Modelo de datos y guardado (`src/diario/`): jugadora (id, nombre, número, posición, puntos fuertes, a mejorar, forma de jugar, cómo entrenarla, notas con fecha) y equipo (nombre, categoría, forma de jugar, virtudes, a trabajar). Varios equipos. Tests de guardado, número repetido y copia de seguridad.
- [x] 1.3 Pestaña **Equipo**: lista de la plantilla, alta, edición y baja de jugadora; ficha según lo elegido.
- [x] 1.4 Ficha del equipo (31/10, vuelta 5): pestaña Equipo → Habilidades (virtudes / a trabajar con semáforo, «cómo la entrenamos», nivel 1–5 y radar), etiquetas de habilidad en ejercicios y jugadas, «Añadir a una sesión» y «Montar sesión con lo más flojo». Código en `src/habilidades/` y `src/pantallas/Habilidades.tsx`, `Radar.tsx`.
- [x] 1.5 **Importar la plantilla:** desde un PDF (texto del PDF leído en el móvil con pdf.js cargado solo al usarlo), texto pegado o CSV; detecta dorsal, nombre y posición y enseña una vista previa editable antes de crear las fichas.
- [x] 1.6 Copia de seguridad con plantilla, equipo, etiquetas y diario; las lesiones solo entran si se marca «Incluir las lesiones» (31/10). Falta: revisión y entrada de cierre en bocetos.

## Tramo 2: dorsales en las pizarras
- [x] 2.1 Diseño → Adam eligió A (30/10).
- [x] 2.2 «Quién es quién» por equipo: la 1, 2, 3, 4 y 5 de cada sistema con su jugadora.
- [x] 2.3 Los círculos de la pizarra, el GIF, la hoja de compartir y la ficha A4 enseñan el número elegido (con interruptor 1–5 / dorsales).
- [x] 2.4 Editor de sistemas propios con los puestos del equipo; revisión; parar.

## Tramo 3: temporada y calendario
- [x] 3.1 Diseño → Adam eligió la mezcla (30/10).
- [x] 3.2 Temporada: fechas de inicio y fin, fases con objetivo (pretemporada, liga, parón…) y qué trabajar en cada una.
- [x] 3.3 Calendario: partidos (rival, casa/fuera, hora, resultado), entrenamientos fijos de la semana, festivos; las sesiones ya hechas se enlazan al día.
- [x] 3.3b Importar `.ics` (lector hecho a mano, sin librerías) con vista previa, y exportar la temporada a `.ics`.
- [x] 3.4 Vista mes (Equipo → Temporada) y «Esta semana» en Inicio; cada día enlaza su sesión («Abrir la sesión →»). El botón «Cronómetro» de Inicio abre y arranca solo la sesión de hoy (31/10); si hoy no hay sesión con ejercicios, abre la lista.
- [x] 3.5 Balance de partido (Adam eligió A, 30/10): etiquetas de lo que funcionó y falló, dorsales a mirar, frase corta y «Pasar a las fichas» (una nota con fecha por jugadora, sin repetir). Código en `src/temporada/temporada.ts` y la hoja del día de `Temporada.tsx`.

Decisiones de Adam (30/10, vuelta 3): dónde vive A+C (dentro de Equipo + «Esta semana» en Inicio); apuntar C+B+A (entrenos fijos, lista de jornadas y tocar el día); hoja del día A con «Abrir día»; .ics A (vista previa con casillas) y exportar. Resultado solo con puntos a favor y en contra; sin «Convocadas» (no contestó, supuesto mío). Código en `src/temporada/` y `src/pantallas/Temporada.tsx`, `ImportarCalendario.tsx`.

## Tramo 4: cuestionario y prompt para la IA
- [ ] 4.1 **Diseño** del cuestionario (bocetos) → Adam elige: paso a paso con una pregunta por pantalla, o una sola pantalla con secciones plegables. Con vista previa del prompt que se va rellenando.
- [ ] 4.2 Qué se puede pedir (cada una con sus preguntas): planificación de la temporada, plan de un mes, una sesión de entrenamiento, ejercicios para una carencia concreta, un sistema nuevo, preparación de un partido, informe de una jugadora. Preguntas sobre objetivos, nivel, tiempo, material, qué quiere y qué no, estilo de juego.
- [ ] 4.3 El prompt se monta solo con las respuestas y los datos del equipo (plantilla, virtudes, calendario), se puede **editar a mano**, y se copia con un botón. Opción de **quitar los nombres** (solo dorsal y posición) y aviso antes de copiar de que son datos de personas.
- [ ] 4.4 El prompt le pide a la IA un formato fijo; la app lo **pega o lo sube** (JSON), muestra vista previa y lo guarda como **borrador** (planificación, sesiones, ejercicios).
- [ ] 4.5 `/security-review` y cierre del loop con el boceto final de Cambios y Mejoras.

## Después (no entra en este loop)
Fotos de las jugadoras, estadísticas de partido en directo, asistencia a entrenamientos (existe el script del calendario de Cadete aparte), compartir la plantilla con el staff, datos de salud y confidencialidad por círculos (ver `PLAN.md`).

## Vuelta 2 (30/10): pizarra
- Hecho: «quién es quién» en la ficha del equipo (con «Rellenar según su posición»), interruptor 1–5 / equipo en la pizarra y en pantalla completa, leyenda puesto = dorsal bajo la explicación, el GIF, la hoja y las fichas usan lo elegido; el editor sigue con 1–5. Los ejercicios (2x0, 3x3) no cambian.
- Editor con la opción A de Adam: el jugador sigue al dedo, un toque lo marca, barra con corte/bote/bloqueo/pase/borrar, tira de pasos (se puede volver a cualquiera) y ▶ Ver. Falta: resaltar el camino al tocar un jugador en la pizarra de ver.

## Vuelta 5 (31/10): mezcla 2 de Adam («me gusta todo»)
Hecho: habilidades + semáforo + radar, «lo más flojo» → sesión, lesiones y disponibles (solo en el dispositivo; fuera de la copia salvo que se pida), diario de dos minutos (Equipo → Diario) e inicio «Tele de equipo» con logo y «Modo tele» a pantalla completa. Sin hacer (mezcla 3): rotación y minutos, informe del rival, habilidades por edad, compartir en PDF. Sin commit ni publicar; falta probar en iPhone y /code-review medium (datos de salud).
