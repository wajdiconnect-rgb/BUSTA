#!/usr/bin/env python3
"""
sfoca_sfondo.py — effetto "obiettivo da fotografo" su una ripresa VERA: il prodotto resta nitido,
lo sfondo (es. la fabbrica) diventa sfocato, morbido e più scuro. Niente ritagli: il passaggio tra
prodotto e sfondo è graduale, quindi non si vedono bordi tagliati. Prima stabilizza l'immagine.

Uso:
  python3 sfoca_sfondo.py clip_1080x1920.mp4 uscita.mp4 [--sfocatura 22] [--scurisci 0.8] [--zoom 1.0]
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
a.add_argument("--sfocatura", type=float, default=22)
a.add_argument("--scurisci", type=float, default=0.8)
a.add_argument("--zoom", type=float, default=1.0)
a.add_argument("--fisso", action="store_true", help="camera ferma: zona nitida fissa per tutto il clip (niente sfarfallio)")
p = a.parse_args()

tmp = p.out + "_lavoro"
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(tmp)
trf = os.path.join(tmp, "t.trf")
stab = os.path.join(tmp, "stab.mp4")
# 1) stabilizzazione (2 passaggi), con leggero zoom per nascondere i bordi
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p.src, "-vf", f"vidstabdetect=shakiness=6:accuracy=15:result={trf}", "-f", "null", "-"], check=True)
z = max(p.zoom, 1.0)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p.src, "-vf",
                f"vidstabtransform=input={trf}:smoothing=30:zoom=4:optzoom=0,scale=iw*{z}:ih*{z},crop=1080:1920",
                "-c:v", "libx264", "-crf", "12", stab], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", stab, os.path.join(tmp, "%04d.png")], check=True)
files = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))

sess = new_session("isnet-general-use")
raw = []
for k, f in enumerate(files):
    im = Image.open(os.path.join(tmp, f)).convert("RGB")
    raw.append(np.asarray(remove(im, session=sess, only_mask=True)).astype(np.float32) / 255)
    if k % 20 == 0:
        print("maschera", k, len(files), flush=True)

# 2) maschere morbide: allargate, sfumate e mediate nel tempo (nessun bordo visibile)
soft = []
for m in raw:
    m = cv2.dilate((m > 0.4).astype(np.float32), np.ones((31, 31), np.uint8))
    soft.append(cv2.GaussianBlur(m, (0, 0), 28))
fin = []
for k in range(len(soft)):
    w = soft[max(0, k - 3):k + 4]
    fin.append(np.clip(np.mean(w, 0) * 1.15, 0, 1))

if p.fisso:
    media = np.clip(np.mean(soft, 0) * 2.2, 0, 1)
    fin = [np.maximum(media, f_) for f_ in fin]
for k, f in enumerate(files):
    path = os.path.join(tmp, f)
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    bg = cv2.GaussianBlur(img, (0, 0), p.sfocatura)
    g = bg.mean(2, keepdims=True)
    bg = (bg * 0.8 + g * 0.2) * p.scurisci  # sfondo più morbido, meno colorato e più scuro
    m = fin[k][..., None]
    out = img * m + bg * (1 - m)
    # vignettatura morbida da obiettivo
    H, W = out.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = 1 - 0.28 * np.clip((((xx - W / 2) / (W / 2)) ** 2 + ((yy - H * 0.45) / (H / 2)) ** 2) - 0.25, 0, 1)
    out = out * v[..., None]
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(path)
    if k % 20 == 0:
        print("sfoca", k, len(files), flush=True)

subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(tmp, "%04d.png"),
                "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", p.out], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print("ok", p.out)
