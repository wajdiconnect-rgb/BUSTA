#!/usr/bin/env python3
"""
migliora_reale.py — prende un pezzo di un video VERO (anche molto compresso, es. da WeChat),
toglie le bande colorate, lo ingrandisce con l'AI (Real-ESRGAN, gratis sul processore)
e lo salva verticale 1080x1920 a 30 fps, pronto per il montaggio.

Uso:
  python3 migliora_reale.py video.mp4 uscita.mp4 INIZIO DURATA [--taglia x:y:w:h] [--orizzontale]

--taglia       ritaglio dell'area utile (es. 46:0:276:480 per togliere le bande verdi)
--orizzontale  il video è orizzontale: lo mette al centro, con lo stesso video sfocato dietro
"""
import argparse
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ingrandisci import ingrandisci_rgb, modello  # noqa: E402

a = argparse.ArgumentParser()
a.add_argument("src")
a.add_argument("out")
a.add_argument("inizio", type=float)
a.add_argument("durata", type=float)
a.add_argument("--taglia", default="")
a.add_argument("--orizzontale", action="store_true")
a.add_argument("--4k", dest="k4", action="store_true", help="uscita 2160x3840")
p = a.parse_args()

tmp = p.out + "_fotogrammi"
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(tmp)
vf = "fps=30"
if p.taglia:
    x, y, w, h = p.taglia.split(":")
    vf = f"crop={w}:{h}:{x}:{y},fps=30"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(p.inizio), "-t", str(p.durata), "-i", p.src, "-vf", vf, os.path.join(tmp, "%04d.png")], check=True)

m = modello()
W, H = (2160, 3840) if p.k4 else (1080, 1920)
files = sorted(os.listdir(tmp))
for k, f in enumerate(files):
    path = os.path.join(tmp, f)
    big = Image.fromarray(ingrandisci_rgb(m, np.array(Image.open(path).convert("RGB"))))
    if p.orizzontale:
        fondo = big.resize((int(big.width * H / big.height), H), Image.LANCZOS)
        l = (fondo.width - W) // 2
        fondo = fondo.crop((l, 0, l + W, H)).filter(ImageFilter.GaussianBlur(40))
        fondo = Image.eval(fondo, lambda v: int(v * 0.55))
        fr = big.resize((W, int(big.height * W / big.width)), Image.LANCZOS)
        fondo.paste(fr, (0, (H - fr.height) // 2))
        out = fondo
    else:
        s = max(W / big.width, H / big.height)
        r = big.resize((round(big.width * s), round(big.height * s)), Image.LANCZOS)
        l, t = (r.width - W) // 2, (r.height - H) // 2
        out = r.crop((l, t, l + W, t + H))
    out.save(path)
    if k % 30 == 0:
        print(f"{k}/{len(files)}", flush=True)

subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(tmp, "%04d.png"),
                "-vf", "eq=saturation=1.06:contrast=1.04,unsharp=5:5:0.35", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", p.out], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print("ok", p.out)
