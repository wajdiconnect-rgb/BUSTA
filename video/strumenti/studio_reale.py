#!/usr/bin/env python3
"""
studio_reale.py — porta un prodotto VERO (ripreso in fabbrica) in uno studio fotografico:
toglie lo sfondo fotogramma per fotogramma (rembg isnet), tiene la base/supporto (zona fissa
indicata a mano, ritagliata con GrabCut), e lo mette su un fondale chiaro da set fotografico
con ombra di contatto, riflesso sul pavimento lucido e alone di luce colorata dello schermo.

Uso:
  python3 studio_reale.py clip_1080x1920.mp4 uscita.mp4 [--base x0,y0,x1,y1] [--scala 0.9] [--alza 0]

--base   rettangolo (px nel 1080x1920) che contiene il supporto fisso del prodotto (camera ferma)
--scala  rimpicciolisce il prodotto nel fotogramma (aria intorno, come una foto di studio)
"""
import argparse
import os
import shutil
import subprocess

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

a = argparse.ArgumentParser()
a.add_argument("src")
a.add_argument("out")
a.add_argument("--base", default="")
a.add_argument("--scala", type=float, default=0.9)
a.add_argument("--alza", type=int, default=0, help="sposta il prodotto in su (px)")
a.add_argument("--larghezza", type=float, default=0, help="se >0: il prodotto occupa questa frazione della larghezza (es. 0.8)")
a.add_argument("--convesso", action="store_true", help="oggetti tondi/convessi (sfere): forma piena e pulita, niente pezzi staccati")
a.add_argument("--rettangolo", action="store_true", help="schermo piatto: maschera geometrica pulita a 4 lati")
p = a.parse_args()

W, H = 1080, 1920
tmp = p.out + "_lavoro"
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(tmp)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p.src, os.path.join(tmp, "%04d.png")], check=True)
files = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))
frames = [np.asarray(Image.open(os.path.join(tmp, f)).convert("RGB")) for f in files]

# 1) maschere del prodotto, fotogramma per fotogramma
sess = new_session("isnet-general-use")
masks = []
for k, fr in enumerate(frames):
    m = np.asarray(remove(Image.fromarray(fr), session=sess, only_mask=True, post_process_mask=True)).astype(np.float32) / 255
    masks.append(m)
    if k % 20 == 0:
        print("maschera", k, len(frames), flush=True)

# 2) supporto fisso: GrabCut dentro al rettangolo indicato, sul primo fotogramma
if p.base:
    x0, y0, x1, y1 = [int(v) for v in p.base.split(",")]
    g = np.zeros(frames[0].shape[:2], np.uint8)
    bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
    bgr = cv2.cvtColor(frames[len(frames) // 2], cv2.COLOR_RGB2BGR)
    cv2.grabCut(bgr, g, (x0, y0, x1 - x0, y1 - y0), bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    base = np.where((g == cv2.GC_FGD) | (g == cv2.GC_PR_FGD), 1.0, 0.0).astype(np.float32)
    base = cv2.morphologyEx(base, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats((base > 0.5).astype(np.uint8))
    if n > 1:
        aree = st[1:, cv2.CC_STAT_AREA]
        tieni = [1 + i for i, ar in enumerate(aree) if ar >= 0.15 * aree.max()]
        base = np.isin(lab, tieni).astype(np.float32)
    base = cv2.GaussianBlur(base, (0, 0), 1.5)
    masks = [np.maximum(m, base) for m in masks]

# 2a) oggetti convessi: per ogni pezzo grande, l'inviluppo convesso pieno
if p.convesso:
    nuove = []
    for m in masks:
        b = (m > 0.5).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(b)
        q = np.zeros_like(m)
        if n > 1:
            aree = st[1:, cv2.CC_STAT_AREA]
            for i, ar in enumerate(aree):
                if ar >= 0.15 * aree.max():
                    cnts, _ = cv2.findContours((lab == i + 1).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
                    cv2.fillPoly(q, [cv2.convexHull(max(cnts, key=cv2.contourArea))], 1.0)
        q = cv2.GaussianBlur(cv2.erode(q, np.ones((5, 5), np.uint8)), (0, 0), 1.5)
        nuove.append(q)
    masks = nuove

# 2b) schermo piatto: un quadrilatero pulito, fermo (camera ferma)
if p.rettangolo:
    med = np.median(np.stack(masks[:: max(1, len(masks) // 15)]), 0)
    cnts, _ = cv2.findContours((med > 0.5).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cnts, key=cv2.contourArea)
    hull = cv2.convexHull(c)
    eps = 0.01 * cv2.arcLength(hull, True)
    poly = cv2.approxPolyDP(hull, eps, True)
    while len(poly) > 4:
        eps *= 1.2
        poly = cv2.approxPolyDP(hull, eps, True)
    q = np.zeros_like(med, np.float32)
    cv2.fillPoly(q, [poly], 1.0)
    q = cv2.GaussianBlur(cv2.erode(q, np.ones((5, 5), np.uint8)), (0, 0), 1.2)
    masks = [q.copy() for _ in masks]

# 3) maschere più stabili nel tempo (niente tremolii sui bordi)
sm = []
for k in range(len(masks)):
    a_, b_, c_ = masks[max(0, k - 1)], masks[k], masks[min(len(masks) - 1, k + 1)]
    m = 0.25 * a_ + 0.5 * b_ + 0.25 * c_
    m = cv2.GaussianBlur(m, (0, 0), 1.0)
    sm.append(np.clip((m - 0.08) / 0.84, 0, 1))
masks = sm

# piano del pavimento: fondo dell'oggetto (mediana nel tempo)
bottoms = []
for m in masks:
    ys = np.where(m.max(1) > 0.5)[0]
    bottoms.append(ys.max() if len(ys) else H * 0.75)
fondo_y = int(np.median(bottoms))
lefts, rights = [], []
for m in masks:
    xs = np.where(m.max(0) > 0.5)[0]
    if len(xs):
        lefts.append(xs.min())
        rights.append(xs.max())
cx = int((np.median(lefts) + np.median(rights)) / 2) if lefts else W // 2
larg = int(np.median(rights) - np.median(lefts)) if lefts else W // 2

# 4) fondale da studio fotografico (chiaro, caldo, morbido)
s = p.scala
if p.larghezza > 0 and larg > 0:
    s = p.larghezza * W / larg
tops = [np.where(m.max(1) > 0.5)[0].min() for m in masks if (m > 0.5).any()]
alt = fondo_y - (np.percentile(tops, 5) if tops else 0)
if alt > 0:
    s = min(s, (int(H * 0.70) - 170) / alt)  # mai tagliato in alto
nuovo_fondo = int(H * 0.70)  # dove appoggia il prodotto nel video finale
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
alto = np.array([214, 208, 200], np.float32)
centro = np.array([246, 243, 238], np.float32)
pav = np.array([222, 216, 207], np.float32)
t = np.clip((yy - nuovo_fondo + 260) / 520, 0, 1)[..., None]  # orizzonte morbido (fondale curvo)
base_col = alto * (1 - t) + pav * t
r = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - nuovo_fondo + 380) / (H * 0.42)) ** 2)[..., None]
luce = np.clip(1 - r, 0, 1) ** 1.6
fondale = base_col * (1 - luce) + centro * luce
vign = np.clip(1 - 0.18 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2), 0.75, 1)[..., None]
fondale = (fondale * vign).astype(np.float32)
rng = np.random.default_rng(1)
grana = rng.normal(0, 1.2, (H, W, 1)).astype(np.float32)

# trasformazione: il prodotto scalato e appoggiato sulla linea del pavimento
M = np.float32([[s, 0, W / 2 - cx * s], [0, s, nuovo_fondo - fondo_y * s - p.alza]])

for k, (fr, m) in enumerate(zip(frames, masks)):
    prod = cv2.warpAffine(fr.astype(np.float32), M, (W, H), flags=cv2.INTER_LANCZOS4)
    mk = cv2.warpAffine(m, M, (W, H), flags=cv2.INTER_LINEAR)[..., None]
    img = fondale.copy()
    # alone colorato della luce dello schermo sul fondale
    glow = cv2.GaussianBlur(prod * mk, (0, 0), 90)
    img = img + glow * 0.55
    # ombra di contatto
    ombra = np.zeros((H, W), np.float32)
    cv2.ellipse(ombra, (W // 2, nuovo_fondo - p.alza + 6), (int(larg * s * 0.55), 34), 0, 0, 360, 1, -1)
    ombra = cv2.GaussianBlur(ombra, (0, 0), 22)[..., None]
    img = img * (1 - 0.38 * ombra)
    # riflesso sul pavimento lucido
    py = nuovo_fondo - p.alza
    rif_h = min(H - py, 520)
    if rif_h > 10:
        fl = np.flipud((prod * mk)[py - rif_h:py])
        flm = np.flipud(mk[py - rif_h:py])
        grad = np.linspace(0.22, 0.0, rif_h, dtype=np.float32)[:, None, None]
        fl = cv2.GaussianBlur(fl, (0, 0), 3)
        flm = cv2.GaussianBlur(flm, (0, 0), 3)[..., None] if flm.ndim == 2 else cv2.GaussianBlur(flm, (0, 0), 3)
        if flm.ndim == 2:
            flm = flm[..., None]
        reg = img[py:py + rif_h]
        img[py:py + rif_h] = reg * (1 - flm * grad) + fl * grad
    # prodotto
    img = img * (1 - mk) + prod * mk
    img = np.clip(img + grana, 0, 255).astype(np.uint8)
    Image.fromarray(img).save(os.path.join(tmp, files[k]))
    if k % 20 == 0:
        print("studio", k, len(frames), flush=True)

subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(tmp, "%04d.png"),
                "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", p.out], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print("ok", p.out)
