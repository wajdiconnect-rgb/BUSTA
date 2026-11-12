#!/usr/bin/env python3
"""
foto_3d.py — trasforma una foto ferma in un video con movimento di camera 3D
(effetto "parallasse": il soggetto si stacca dallo sfondo).

L'AI Depth Anything V2 (gratuita, gira sul processore) calcola la profondità
di ogni pixel; poi muoviamo una camera virtuale e deformiamo l'immagine.

Uso:
  python3 foto_3d.py foto.jpg uscita.mp4 [--durata 5] [--movimento avvicina|orbita|sali]
                                          [--forza 1.0] [--larghezza 1080 --altezza 1920]
"""
import argparse
import subprocess

import cv2
import numpy as np
from PIL import Image


def profondita(img: Image.Image) -> np.ndarray:
    from transformers import pipeline

    pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
    d = np.array(pipe(img)["depth"].resize(img.size, Image.BICUBIC)).astype(np.float32)
    d = (d - d.min()) / max(1e-6, d.max() - d.min())  # 1 = vicino, 0 = lontano
    # bordi morbidi della profondità per evitare strappi
    d = cv2.GaussianBlur(d, (0, 0), 3)
    return d


MARGINE = 1.12


def copri(img: np.ndarray, w: int, h: int, cx: float = 0.5, cy: float = 0.5):
    ih, iw = img.shape[:2]
    s = max(w / iw, h / ih) * MARGINE  # margine per il movimento
    r = cv2.resize(img, (int(iw * s + 0.5), int(ih * s + 0.5)), interpolation=cv2.INTER_LANCZOS4)
    y = int(np.clip(r.shape[0] * cy - h / 2, 0, r.shape[0] - h))
    x = int(np.clip(r.shape[1] * cx - w / 2, 0, r.shape[1] - w))
    return r, x, y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("foto")
    ap.add_argument("uscita")
    ap.add_argument("--durata", type=float, default=5.0)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--movimento", default="avvicina", choices=["avvicina", "orbita", "sali"])
    ap.add_argument("--forza", type=float, default=1.0)
    ap.add_argument("--larghezza", type=int, default=1080)
    ap.add_argument("--altezza", type=int, default=1920)
    ap.add_argument("--centro-x", type=float, default=0.5, help="centro orizzontale dell'inquadratura (0-1)")
    ap.add_argument("--centro-y", type=float, default=0.5)
    ap.add_argument("--margine", type=float, default=1.12, help="zoom di partenza (1.0 = foto intera)")
    a = ap.parse_args()
    global MARGINE
    MARGINE = a.margine

    src = Image.open(a.foto).convert("RGB")
    d = profondita(src)
    W, H = a.larghezza, a.altezza
    img, ox, oy = copri(np.array(src), W, H, a.centro_x, a.centro_y)
    dep, _, _ = copri(d, W, H, a.centro_x, a.centro_y)
    dep = dep[..., 0] if dep.ndim == 3 else dep

    n = int(a.durata * a.fps)
    gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
    D = dep[oy:oy + H, ox:ox + W]
    cx, cy = W / 2, H * 0.48
    p = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(a.fps), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "medium",
         "-pix_fmt", "yuv420p", a.uscita], stdin=subprocess.PIPE)
    for i in range(n):
        t = i / max(1, n - 1)
        e = 0.5 - 0.5 * np.cos(np.pi * t)  # partenza e arrivo morbidi
        k = a.forza
        if a.movimento == "avvicina":
            zoom = 1 + 0.10 * k * e          # dolly in: il vicino cresce più del lontano
            par = 0.06 * k * e
            sx = 26 * k * (e - 0.5)
            sy = 0.0
        elif a.movimento == "orbita":
            zoom = 1 + 0.04 * k * e
            par = 0.02 * k * e
            sx = 70 * k * np.sin(np.pi * (e - 0.5))
            sy = 0.0
        else:  # sali
            zoom = 1 + 0.05 * k * e
            par = 0.03 * k * e
            sx = 0.0
            sy = 60 * k * (e - 0.5)
        # mappa inversa: per ogni pixel d'uscita, dove leggere nella foto
        s = zoom + par * D
        mx = cx + (gx - cx) / s - sx * D + ox
        my = cy + (gy - cy) / s - sy * D + oy
        fr = cv2.remap(img, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_CUBIC,
                       borderMode=cv2.BORDER_REFLECT)
        p.stdin.write(fr.astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    print("ok", a.uscita)


if __name__ == "__main__":
    main()
