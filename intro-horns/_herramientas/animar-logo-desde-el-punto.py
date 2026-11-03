import subprocess, numpy as np, math, sys
from PIL import Image, ImageFilter
W, H, FPS = 1080, 1920, 24
FIN = r"C:\dev\baloncesto-app\intro-horns\C - Túnel\4 - La palabra se forma\final.png"
OUT = sys.argv[1]
fin = Image.open(FIN).convert("RGB"); A = np.asarray(fin).astype(float)
L = A.mean(2)
wa = np.clip((A[..., 2] - 115) / 120, 0, 1)
oa = np.clip((A[..., 0] - A[..., 2]) / 216, 0, 1)
WHITE = np.array([255, 248, 238.0]); ORANGE = np.array([243, 106, 27.0])
def elem(mask, col, x0, x1, y0=780, y1=1140):
    m = np.zeros((H, W)); m[y0:y1, x0:x1] = mask[y0:y1, x0:x1]
    return m
H_m = elem(wa, WHITE, 120, 290); R_m = elem(wa, WHITE, 480, 625); N_m = elem(wa, WHITE, 645, 815); S_m = elem(wa, WHITE, 830, 960)
dot_m = elem(wa, WHITE, 340, 430); arcs_m = elem(oa, ORANGE, 300, 470)
CXO, CYO = 384, 960
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2) * 1.41
fondo = np.array([41, 57, 93.0]) * (1 - np.clip(r, 0, 1))[..., None] + np.array([20, 28, 48.0]) * np.clip(r, 0, 1)[..., None]

def mover(mask, ax, ay, sc, dx=0, dy=0):
    ys, xs = np.nonzero(mask > 0.01)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop = Image.fromarray((mask[y0:y1, x0:x1] * 255).astype(np.uint8))
    ns = (max(1, round((x1 - x0) * sc)), max(1, round((y1 - y0) * sc)))
    crop = crop.resize(ns, Image.LANCZOS)
    nx = round(ax + (x0 - ax) * sc + dx); ny = round(ay + (y0 - ay) * sc + dy)
    out = np.zeros((H, W))
    ys0, xs0 = max(0, ny), max(0, nx); ye, xe = min(H, ny + ns[1]), min(W, nx + ns[0])
    if ye > ys0 and xe > xs0:
        out[ys0:ye, xs0:xe] = np.asarray(crop).astype(float)[ys0 - ny:ye - ny, xs0 - nx:xe - nx] / 255
    return out
top_a = arcs_m.copy(); top_a[CYO:] = 0
bot_a = arcs_m.copy(); bot_a[:CYO] = 0
def ease(p): p = min(1, max(0, p)); return p * p * (3 - 2 * p)
def comp(base, mask, col, a=1.0):
    m = (mask * a)[..., None]
    return base * (1 - m) + col * m
def glowadd(base, mask, col, amount, rad):
    if amount <= 0.001: return base
    g = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))
    return base + np.asarray(g).astype(float)[..., None] / 255 * col * amount

def frame(t):
    img = fondo.copy()
    # el punto: viaja del centro a su sitio y se vuelve cálido
    mv = ease(t / 0.9)
    px = 540 + (CXO - 540) * mv
    dm = mover(dot_m, 540, 960, 1.0, dx=px - 540 - (CXO - 540) * 0)  # dot_m ya está en su sitio final: se desplaza
    dm = mover(dot_m, CXO, CYO, 3.4 - 2.4 * mv, dx=px - CXO)
    pulso = 1 + 0.08 * math.sin(t * 9)
    calor = ease((t - 0.45) / 0.6)
    gcol = WHITE * (1 - calor) + ORANGE * calor
    gl = 0.9 + 0.5 * ease((t - 0.3) / 0.8) * (1 - ease((t - 1.9) / 1.0))
    img = glowadd(img, dm, gcol, gl * 1.3, 38)
    img = glowadd(img, dm, gcol, gl * 0.8, 14)
    # arcos que nacen del punto y se cierran en la O
    pa = ease((t - 0.95) / 0.75)
    if pa > 0:
        gap = 26 * (1 - ease((t - 1.65) / 0.4))
        sc = 0.25 + 0.75 * pa
        ta = mover(top_a, CXO, CYO, sc, dy=-gap * pa); ba = mover(bot_a, CXO, CYO, sc, dy=gap * pa)
        am = np.maximum(ta, ba)
        img = glowadd(img, am, ORANGE, 0.8 * (1 - ease((t - 2.2) / 0.9)) + 0.15, 30)
        img = comp(img, am, ORANGE, min(1, pa * 1.6))
    img = comp(img, dm, WHITE)
    # letras
    for k, m in enumerate([H_m, R_m, N_m, S_m]):
        pl = ease((t - (2.1 + 0.3 * k)) / 0.4)
        if pl > 0:
            lm = mover(m, 540, 960, 0.94 + 0.06 * pl) * 1.0
            img = glowadd(img, lm, ORANGE, 0.9 * pl * (1 - pl) * 2, 22)
            img = comp(img, lm, WHITE, pl)
    # cierre exacto con el logo oficial
    pf = ease((t - 4.1) / 0.4)
    if pf > 0: img = img * (1 - pf) + A * pf
    return np.clip(img, 0, 255).astype(np.uint8)

enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "15", OUT], stdin=subprocess.PIPE)
N = int(5.0 * FPS)
for n in range(N): enc.stdin.write(frame(n / FPS).tobytes())
enc.stdin.close(); enc.wait(); print("ok", N)
