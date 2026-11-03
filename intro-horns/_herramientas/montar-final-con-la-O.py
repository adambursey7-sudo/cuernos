import subprocess, numpy as np, math, sys
from PIL import Image, ImageFilter
SRC = r"C:\Users\adamg\Downloads\Man_running_dodging_objects_351277d7_1080p.mp4"
OUT = sys.argv[1]
SRCO = r"C:\dev\baloncesto-app\intro-horns\C - Túnel\4 - La palabra se forma\adjuntar 2 - la O (para copiarla).png"
W, H, FPS = 1080, 1920, 24
CX, CY = 557, 820            # donde está la luz al final del vídeo
ZOOM0, NZ, NB = 156, 36, 60  # frame donde empieza el zoom, frames de zoom, frames de la escena de la O

# --- la O con transparencia
im = Image.open(SRCO).convert("RGB").crop((290, 800, 480, 1120))
a = np.asarray(im).astype(float)
bg = np.array([36, 52, 88.0])
d = np.sqrt(((a - bg) ** 2).sum(2))
alpha = np.clip((d - 18) / 90, 0, 1)
S = 3.4
sz = (int(im.width * S), int(im.height * S))
rgb = np.asarray(im.resize(sz, Image.LANCZOS)).astype(float)
al = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).resize(sz, Image.LANCZOS)).astype(float) / 255
# el centro del punto: la mitad de la imagen recortada
mid = sz[1] // 2
top_a, bot_a = al.copy(), al.copy()
dot = np.zeros_like(al)
# separa arriba/abajo: el punto es lo blanco del centro
white = (rgb[..., 0] > 225) & (rgb[..., 1] > 215)
dot[white] = al[white]
arcs = al * (~white)

def O_layer(t):
    gap = 16 * min(1, t / 0.7)
    sc = 1 + 0.06 * math.sin(t * 5)
    lay = np.zeros((H, W, 4))
    ox = W // 2 - sz[0] // 2
    oy = H // 2 - sz[1] // 2
    def put(mask, dy, scale=1.0):
        m = Image.fromarray((mask * 255).astype(np.uint8))
        c = Image.fromarray(rgb.astype(np.uint8))
        if scale != 1.0:
            ns = (int(sz[0] * scale), int(sz[1] * scale)); m = m.resize(ns, Image.LANCZOS); c = c.resize(ns, Image.LANCZOS)
        else:
            ns = sz
        x = W // 2 - ns[0] // 2; y = H // 2 - ns[1] // 2 + dy
        m = np.asarray(m).astype(float) / 255; c = np.asarray(c).astype(float)
        ys, xs = max(0, y), max(0, x); ye, xe = min(H, y + ns[1]), min(W, x + ns[0])
        sl = (slice(ys - y, ye - y), slice(xs - x, xe - x))
        t_ = lay[ys:ye, xs:xe]
        t_[..., :3] = np.where(m[sl][..., None] > t_[..., 3:4], c[sl], t_[..., :3])
        t_[..., 3] = np.maximum(t_[..., 3], m[sl])
    topm = arcs.copy(); topm[mid:] = 0
    botm = arcs.copy(); botm[:mid] = 0
    put(dot, 0, sc)
    return lay

yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2) * 1.41
fondo = np.stack([41, 57, 93], -1) * (1 - np.clip(r, 0, 1))[..., None] + np.stack([20, 28, 48], -1) * np.clip(r, 0, 1)[..., None]

def escena(t, flash):
    lay = O_layer(t)
    pat=[1,0.1,1,0.25,1,0.05,0.9,0.3,1]
    gain = pat[min(int(t/0.14),len(pat)-1)] if t<1.26 else 1.0
    lay[...,3] *= gain
    al_ = lay[..., 3:4]
    base = fondo.copy()
    glow = Image.fromarray((lay[..., :3] * al_).astype(np.uint8)).filter(ImageFilter.GaussianBlur(45))
    base = base + np.asarray(glow).astype(float) * gain * (0.9 + 0.25 * math.sin(t * 5))
    base = base * (1 - al_) + lay[..., :3] * al_
    base = base * (1 - flash) + 255 * flash
    return np.clip(base, 0, 255).astype(np.uint8)

dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", SRC, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", OUT], stdin=subprocess.PIPE)
n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    if n >= ZOOM0:
        p = (n - ZOOM0) / NZ
        e = p * p * (3 - 2 * p)
        s = 1 + 5.5 * e ** 1.6
        cw, ch = W / s, H / s
        x0 = min(max(CX - cw / 2, 0), W - cw); y0 = min(max(CY - ch / 2, 0), H - ch)
        img = Image.fromarray(f).resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))
        fl = np.clip((p - 0.45) / 0.55, 0, 1) ** 1.5
        f = (np.asarray(img).astype(float) * (1 - fl) + 255 * fl).astype(np.uint8)
    enc.stdin.write(f.tobytes()); n += 1
for k in range(NB):
    t = k / FPS
    fl = max(0, 1 - t / 0.35)
    enc.stdin.write(escena(t, fl).tobytes())
enc.stdin.close(); enc.wait()
print("frames", n, "+", NB)
