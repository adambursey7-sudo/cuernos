import os, shutil

R = 'C:/dev/baloncesto-app/intro-horns/'
B = R + '_herramientas/bocetos-png/'
L = R + '_herramientas/logos/'
ESCUDO = 'C:/Users/adamg/OneDrive/Escritorio/My things/JOBS/FESD Dominicas/_General/FESD Santa Rosa (de Descargas)/Escudo FESD vector.svg'
BASE = R + 'C - Túnel/'
d1 = '1 - Entra en el túnel/'
d2 = '2 - Esquiva las cosas/'
d3 = '3 - Sonríe al ver la O/'
d4 = '4 - La palabra se forma/'
for d in (d1, d2, d3, d4):
    os.makedirs(BASE + d, exist_ok=True)

ESTILO = ("Photorealistic cinematic film still, epic sports-brand title sequence, vertical 9:16, 1080x1920, sharp HD. A long round concrete-and-wood tunnel "
          "with a polished warm basketball parquet floor, dark navy walls (#1e2a44) with thin orange light strips, deep perspective, volumetric haze, "
          "anamorphic lens flare, shallow depth of field, subtle film grain. At the far end of the tunnel a bright orange glowing ring of light, like a portal.")
HOMBRE = ("The man is an adult basketball coach in his 30s, short dark hair, light stubble, athletic, wearing a pink hooded sweatshirt with a white round club emblem "
          "(use the attached emblem as the print), dark sports trousers and white sneakers. He is a generic character, not a real person.")
OBJETOS = ("Flying around him in the tunnel, sharp and detailed: basketballs, a whistle, a notebook, a stopwatch, orange traffic cones, a tactics whiteboard, "
           "ballpoint pens, a tablet, white paper sheets with a red PDF label, a wall calendar, pink and green team jerseys, a water bottle and one whole basketball hoop "
           "with its backboard and pole.")
SIN = "No text, no letters, no numbers, no logo other than the round emblem on the sweatshirt, no watermark."


def w(p, t):
    open(BASE + p, 'w', encoding='utf8').write(t)


for d in (d1, d2, d3, d4):
    shutil.copy(ESCUDO if False else B + 'boceto-uno.png', BASE + d + 'tmp.png')
    os.remove(BASE + d + 'tmp.png')

shutil.copy(B + 'boceto-uno.png', BASE + d1 + 'adjuntar 1 - boceto.png')
shutil.copy(B + 'boceto-dos.png', BASE + d1 + 'adjuntar 2 - boceto del final.png')
shutil.copy(B + 'boceto-dos.png', BASE + d2 + 'adjuntar 1 - boceto.png')
shutil.copy(B + 'boceto-tres.png', BASE + d2 + 'adjuntar 2 - boceto del final.png')
shutil.copy(B + 'boceto-cara.png', BASE + d3 + 'adjuntar 1 - boceto.png')
shutil.copy(B + 'boceto-cuatro.png', BASE + d4 + 'adjuntar 1 - boceto.png')
shutil.copy(L + 'logo-completo.png', BASE + d4 + 'final.png')
shutil.copy(L + 'logo-O-abierta.png', BASE + d4 + 'adjuntar 2 - la O (para copiarla).png')
if os.path.exists(R + '_herramientas/escudo.png'):
    for d in (d1, d2, d3, d4):
        shutil.copy(R + '_herramientas/escudo.png', BASE + d + 'adjuntar - escudo del cole.png')

w(d1 + 'gemini.txt', f"""PLANO 1 · ENTRA EN EL TÚNEL (0-3 s)
Chat NUEVO de Gemini (Crear imagen). Adjunta «adjuntar 1 - boceto.png» y «adjuntar - escudo del cole.png». Guarda como «inicio.jpg».

Create a film still using the first image ONLY as the composition guide (tunnel, vanishing point, position of the man and of the objects); redraw everything realistically. A man runs away from the camera into a long tunnel, seen from behind, small in the lower centre of the frame. {HOMBRE}
Objects float lightly in the air at the sides of the tunnel: a basketball, a whistle, a notebook, a green jersey, a cone, a pen. {ESTILO} The glowing orange ring at the far end is small and far away: keep it a simple ring with a small bright cream ball in the middle (it is the letter O of a logo).
{SIN}
""")
w(d1 + 'flow.txt', f"""Frames to Video, 9:16, 8 s. Fotograma inicial «inicio.jpg». Fotograma final «mitad.jpg» (el de la carpeta 2, «adjuntar 2 - boceto del final» es su guía).

The camera follows the man from behind as he starts to run down the tunnel. More and more objects float into the air around him and start drifting towards the camera: basketballs, a stopwatch, a whiteboard, a tablet, paper sheets, a calendar. The orange ring at the far end slowly grows. Smooth tracking shot, no cuts.
Sound: footsteps echoing on parquet, a low rising hum, soft whooshes of objects flying past. No dialogue, no voice-over, no music.
Style: {ESTILO}
""")
w(d2 + 'gemini.txt', f"""PLANO 1 (final) y PLANO 2 (inicio) · IMAGEN «mitad.jpg»
Chat NUEVO de Gemini (Crear imagen). Adjunta «adjuntar 1 - boceto.png» y «adjuntar - escudo del cole.png». Guarda como «mitad.jpg».

Create a film still using the image ONLY as the composition guide; redraw everything realistically. The same man from behind, now running in the middle of the tunnel. {HOMBRE}
{OBJETOS} Many are flying towards the camera at different depths, some blurred. The glowing orange ring at the far end is bigger now: a simple ring with a bright cream ball in the middle. {ESTILO}
{SIN}

Después, en el MISMO chat o en uno nuevo, haz «esquiva.jpg»: adjunta «adjuntar 2 - boceto del final.png» y pide lo mismo, pero el hombre se inclina esquivando, la canasta entera pasa a un lado, un balón y un cono casi le dan, y el anillo del fondo está aún más grande.
""")
w(d2 + 'flow.txt', f"""Frames to Video, 9:16, 8 s. Fotograma inicial «mitad.jpg». Fotograma final «esquiva.jpg».

The man runs faster down the tunnel and dodges the flying objects: he ducks under a basketball, jumps over an orange cone, leans away from a passing whiteboard and a whole basketball hoop that sweeps past him, and slips between paper sheets and a tablet. Nothing hits him. The camera keeps following from behind with a little shake. The orange ring at the far end keeps growing.
Sound: fast footsteps, objects whooshing past, a rising hum. No dialogue, no voice-over, no music.
Style: {ESTILO}
""")
w(d3 + 'gemini.txt', f"""PLANO 3 · SONRÍE AL VER LA O · IMAGEN «sonrisa.jpg»
Chat NUEVO de Gemini (Crear imagen). Adjunta «adjuntar 1 - boceto.png» y «adjuntar - escudo del cole.png». Guarda como «sonrisa.jpg».

Create a film still using the image ONLY as the composition guide; redraw everything realistically. Side-profile close-up of the running man looking ahead (to the right of the frame), a big genuine smile because he sees the glowing orange ring close now, in soft focus at the right edge of the frame. {HOMBRE} A few objects (a basketball, a pen) streak past in the blurred foreground. Warm orange light on his face. {ESTILO}
{SIN}

Después haz «luz.jpg» (es la imagen donde empieza el plano 4): adjunta «adjuntar 1 - boceto.png» de la carpeta 4 y pide: the glowing orange ring now fills most of the frame, two curved orange horns facing each other around a bright cream ball, the man small and running towards it with his arms open, a few objects floating around, intense light. Keep the ring as simple clean shapes.
""")
w(d3 + 'flow.txt', f"""Frames to Video, 9:16, 8 s. Fotograma inicial «sonrisa.jpg». Fotograma final «luz.jpg» (carpeta 4).

Close-up of the man's smiling face in profile as he runs, the glow on his face grows. His smile widens, he looks ahead and accelerates. The camera swings from his face to behind him and rushes forward, ending on the wide shot of him running towards the huge glowing ring, as in the final frame. Objects blur past.
Sound: breathing, footsteps getting faster, a rising whoosh and shimmer. No dialogue, no voice-over, no music.
Style: {ESTILO}
""")
w(d4 + 'gemini.txt', f"""PLANO 4 · IMAGEN «luz.jpg» (final del plano 3 e inicio del plano 4)
Se hace en la carpeta 3 (está explicada al final de su gemini.txt). Guárdala también aquí como «luz.jpg».
El final del plano 4 es «final.png» (ya está en esta carpeta: es el logo exacto, hecho por Claude; la IA deforma las letras).
""")

BASEFLOW = f"""Frames to Video, 9:16, 8 s. Fotograma inicial «luz.jpg». Fotograma final «final.png» (el logo HORNS exacto).

The camera rushes forward towards the huge glowing ring while the man runs into the light. As the camera gets close, the word forms around the ring so that the ring becomes the letter O of HORNS. The two curved orange horns close around the cream ball. The shot ends exactly on the final frame: the word HORNS complete, perfectly sharp and still, cream letters on dark navy with the orange O. The man is gone into the light. A last soft lens flare.
"""
FIN = f"""Sound: a deep rising whoosh, a shimmer for each letter, a final deep impact. No dialogue, no voice-over, no music.
Style: {ESTILO}
"""
VERS = {
    'V1 - letras vuelan': "HOW THE LETTERS APPEAR: the letters H, R, N and S fly in from the walls of the tunnel, spinning and trailing orange light, and lock into place one after another around the ring.\n",
    'V2 - letras giran en su sitio': "HOW THE LETTERS APPEAR: the letters H, R, N and S are already in place around the ring but edge-on and invisible; one by one they spin on their own axis like coins and flip to face the camera, each with a small flash.\n",
    'V3 - letras de objetos': "HOW THE LETTERS APPEAR: the flying objects (pens, cones, notebooks, whistle, paper sheets, basketballs) rush towards the ring and snap together into the shapes of the letters H, R, N and S, then melt into clean cream letters.\n",
    'V4 - letras de luz': "HOW THE LETTERS APPEAR: thin orange lines of light are drawn in the air as if by a fast pen and trace the letters H, R, N and S around the ring, then fill in with solid cream.\n",
    'V5 - letras en las paredes': "HOW THE LETTERS APPEAR: giant letters are built into the tunnel walls on both sides (H and N on the left, R and S on the right); as the camera passes between them they slide together towards the ring and join it to form the word.\n",
    'V6 - detras del hombre': "HOW THE LETTERS APPEAR: the man dives through the ring and, behind him, the word is revealed: the letters H, R, N and S appear one by one in the clear air, left and right, as if his run has drawn them.\n",
}
for n, t in VERS.items():
    w(d4 + f'flow {n}.txt', BASEFLOW + t + FIN)

w('00 - COMO VA.txt', """INTRO DE HORNS · OPCIÓN C, EL TÚNEL (unos 13-14 s, vertical 9:16, HD 1080x1920)

LA IDEA
Un entrenador corre por un túnel hacia la O de HORNS, que brilla al fondo. Le llueven cosas del baloncesto (balones, silbato,
libreta, cronómetro, conos, pizarras, bolis, tablets, papeles PDF, calendario, camisetas rosa y verde del cole, botella de
agua, una canasta entera) y las esquiva. Al ver la O cada vez más cerca, sonríe y acelera. La cámara se acerca y se forma
la palabra HORNS. Sin capturas de la app.

LOS PLANOS
1 - Entra en el túnel        0-3 s     Corre hacia la O pequeña del fondo; empiezan a flotar cosas.
2 - Esquiva las cosas        3-8 s     Se agacha, salta y se aparta de balones, conos y hasta una canasta.
3 - Sonríe al ver la O       8-10 s    Primer plano de perfil: sonríe y acelera.
4 - La palabra se forma      10-14 s   La cámara se acerca a la O y se forman las letras; queda HORNS.
Del plano 4 hay 6 versiones de cómo aparecen las letras (V1 a V6). Mira los bocetos y dime la que quieres,
o pídeme las que quieras mezclar.

IMÁGENES DE GEMINI (5): inicio.jpg, mitad.jpg, esquiva.jpg (carpetas 1 y 2), sonrisa.jpg y luz.jpg (carpeta 3)
  - Chat nuevo en cada una, «Crear imagen», adjunta lo que dice cada gemini.txt.
  - El «boceto.png» de cada carpeta es solo la guía de dónde va todo; Gemini lo redibuja realista.
  - Si cambia al hombre de una imagen a otra, pega la primera imagen en el chat y dile «same man as this one».
  - El hombre es un personaje inventado, no una persona real. No uso fotos de niños ni de nadie.
Luego ENSÉÑAME las 5 imágenes y las reviso antes de Flow.

FLOW (Frames to Video, 9:16, 8 s, 2 versiones por plano):
  plano 1: inicio.jpg -> mitad.jpg
  plano 2: mitad.jpg -> esquiva.jpg
  plano 3: sonrisa.jpg -> luz.jpg
  plano 4: luz.jpg -> final.png (usa el flow de la versión que elijas)
Los vídeos se guardan como «video 1a.mp4», «video 1b.mp4»... Yo monto, pongo sonido y la meto en la app.

La opción A (remolino con capturas) está guardada en «Opción A (guardada)».
""")
print('ok')
