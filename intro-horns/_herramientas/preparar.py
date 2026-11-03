import os, shutil, json, base64, io
from PIL import Image

R = 'C:/dev/baloncesto-app/intro-horns/'
L = R + '_herramientas/logos/'
C = R + '_herramientas/capturas-app/'
STYLE = ("Photorealistic cinematic title-sequence look for a premium basketball coaching app: deep navy night background (#1e2a44), "
         "polished warm-orange parquet floor reflections, vivid orange (#f26b1d) energy light, cream-white (#fff8ee) lettering, "
         "soft volumetric haze, shallow depth of field, anamorphic lens flares, subtle film grain. Vertical 9:16, 1080x1920, sharp HD.")
d1 = '1 - La O despierta/'
d2 = '2 - Las pantallas entran en la O/'
d3 = '3 - El logo entero/'
for d in (d1, d2, d3):
    os.makedirs(R + d, exist_ok=True)


def w(p, t):
    open(R + p, 'w', encoding='utf8').write(t)


shutil.copy(L + 'logo-sin-O.png', R + d1 + 'adjuntar 1 - logo sin O.png')
shutil.copy(L + 'collage-flotando.png', R + d2 + 'adjuntar 1 - pantallas flotando.png')
shutil.copy(L + 'logo-O-abierta.png', R + d3 + 'adjuntar 1 - O abierta.png')
shutil.copy(L + 'collage-entrando.png', R + d3 + 'adjuntar 2 - pantallas encogiendo.png')
shutil.copy(L + 'logo-completo.png', R + d3 + 'final.png')

w(d1 + 'gemini.txt', f"""PLANO 1 · LA O DESPIERTA (0-3 s)
Chat NUEVO de Gemini (Crear imagen). Adjunta «adjuntar 1 - logo sin O.png». Guarda como «inicio.jpg».

Edit the photo into a real film still. Keep the letters H and RNS EXACTLY as they are (same font, same size, same position, do not redraw or change them). In the empty gap between H and R, add a glowing orange ring of light, like a portal about to open, with a bright small spark in its centre. Under the lettering add a dark polished basketball parquet floor with soft orange reflections of the letters.
{STYLE}
No extra text, no other letters, no watermark.
""")
w(d1 + 'flow.txt', f"""Frames to Video, 9:16, 8 s. Fotograma inicial «inicio.jpg» (de este plano). Fotograma final «pantallas.jpg» (el de la carpeta 2).

The ring of light in the gap breathes and grows brighter. Light dust floats through the air. Then, one by one, glowing phone screens of a basketball app fade into view around the lettering, floating in a loose circle, and end exactly as in the final frame. The letters H and RNS stay perfectly still and sharp. Slow push-in of the camera.
Sound: a low warm hum that swells, a soft whoosh for each screen. No dialogue, no voice-over, no music.
Style: {STYLE}
""")
w(d2 + 'gemini.txt', f"""PLANO 2 · IMAGEN «pantallas.jpg» (final del plano 1 e inicio del plano 2)
Chat NUEVO de Gemini (Crear imagen). Adjunta «adjuntar 1 - pantallas flotando.png». Guarda como «pantallas.jpg».

Edit the photo into a real film still. Keep the composition: eight phone screens of a basketball coaching app floating in a loose circle around the word, and the letters H and RNS in the middle with a gap between them. Keep the CONTENT of every screen as it is (same colours, same layout, same court drawings). Do not redraw or change the letters H and RNS. Make the screens look like real glass phones with soft reflections and orange light spilling from the gap between the letters. Add dark polished parquet floor reflections below.
{STYLE}
No extra text, no watermark.
""")
w(d2 + 'flow.txt', f"""Frames to Video, 9:16, 8 s. Fotograma inicial «pantallas.jpg». Fotograma final «abierta.jpg» (carpeta 3).

The phone screens start to spin slowly around the gap between H and RNS, getting smaller and faster, like water down a drain. One after another each screen shrinks and is sucked into the glowing gap with a flash of orange light and a thin trail. The last screen disappears into the light and the gap opens wide, as in the final frame. The letters H and RNS stay sharp and still.
Sound: rising whoosh, a soft pop and shimmer each time a screen goes in, a deep swell at the end. No dialogue, no voice-over, no music.
Style: {STYLE}
""")
w(d3 + 'gemini.txt', f"""PLANO 3 · IMAGEN «abierta.jpg» (final del plano 2 e inicio del plano 3)
Chat NUEVO de Gemini (Crear imagen). Adjunta «adjuntar 1 - O abierta.png» y «adjuntar 2 - pantallas encogiendo.png». Guarda como «abierta.jpg».

Edit the first photo into a real film still. Keep EXACTLY the letters H and RNS and the two orange curved horns above and below the gap (they are open, with a bright cream ball in the middle). Do not redraw or change the letters. Make the horns glow with orange molten light, the ball burn bright white, and add a few tiny luminous app-screen fragments and light trails streaming into the ball. The second photo is only a reference for the mood of the spiralling light. Dark polished parquet reflections below.
{STYLE}
No extra text, no watermark.
""")
w(d3 + 'flow.txt', f"""Frames to Video, 9:16, 8 s. Fotograma inicial «abierta.jpg». Fotograma final «final.png» (ya está en esta carpeta: es el logo exacto, hecho por Claude).

The last light streams into the ball. The two orange horns snap shut around it with a bright flash and a shockwave of light, closing the letter O. The logo HORNS ends complete and perfectly sharp, exactly as in the final frame, with a final soft lens flare and a gentle glint on the ball. Camera slowly settles.
Sound: a deep impact hit, a shimmer, then silence. No dialogue, no voice-over, no music.
Style: {STYLE}
""")
w('00 - COMO VA.txt', """INTRO DE LA APP HORNS · FLOW Y GEMINI (unos 12 s, vertical 9:16, HD 1080x1920)

LA IDEA (la que me pediste)
Sale solo HORNS con la O vacía. Van apareciendo las pantallas de la app (jugadas, pizarra, editor, ejercicios,
sesiones, cronómetro, compartir, colores) y entran una a una en la O, que se abre y las traga. Al final los cuernos
se cierran, entra el balón y queda el logo entero. Los bocetos están en bocetos.html (y en el enlace que te pasé).

LOS PLANOS
1 - La O despierta                   0-3 s     La O vacía brilla; aparecen las pantallas alrededor.
2 - Las pantallas entran en la O     3-9 s     Giran, se encogen y entran una a una en la O.
3 - El logo entero                   9-12 s    Los cuernos se cierran con un destello y queda HORNS completo.

ORDEN
 1. GEMINI (chat nuevo por imagen, Crear imagen, adjunta lo que dice cada gemini.txt):
      plano 1 -> inicio.jpg        plano 2 -> pantallas.jpg        plano 3 -> abierta.jpg
    Las letras las dibujo yo (la IA las deforma): los prompts le dicen que no las toque. Si cambia una letra, dile
    «no cambies las letras» en el mismo chat. Guarda cada imagen en su carpeta con ese nombre.
 2. ENSÉÑAME las 3 imágenes. Las reviso (letras intactas, que parezcan la misma serie) y las recorto a 9:16 si hace falta.
 3. FLOW (Frames to Video, 9:16, 8 s), 2 versiones por plano:
      plano 1: inicio.jpg  -> pantallas.jpg
      plano 2: pantallas.jpg -> abierta.jpg
      plano 3: abierta.jpg -> final.png (ya está en la carpeta 3)
    Pega el flow.txt de cada carpeta. Guarda los vídeos como «video 1a.mp4», «video 1b.mp4»...
 4. Yo monto: recorto cada plano a sus segundos, pongo sonido y música corta, y la meto en la app como intro.

En _herramientas están las capturas de la app y los dibujos del logo (no hace falta tocarlos).
""")


def b64(p, ancho):
    im = Image.open(p).convert('RGB')
    im = im.resize((ancho, int(im.height * ancho / im.width)))
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=78)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


img = {k: b64(L + k + '.png', 300) for k in ['logo-sin-O', 'collage-flotando', 'collage-entrando', 'logo-O-abierta', 'logo-completo']}
for k in ['3-pizarra', '5-sesion', '6-cronometro', '9-compartir']:
    img[k] = b64(C + k + '.png', 150)
json.dump(img, open(R + '_herramientas/miniaturas.json', 'w'))
print({k: len(v) // 1024 for k, v in img.items()})
