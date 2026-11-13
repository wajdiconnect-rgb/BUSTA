#!/usr/bin/env python3
"""
ingrandisci.py — ingrandisce una foto con l'AI (Real-ESRGAN, gratuito, sul processore)
per avere dettagli nitidi nei video 4K. Mantiene la trasparenza dei PNG scontornati.

Uso:
  python3 ingrandisci.py foto.png foto_4x.png [--scala 2|3|4]
Il modello (5 MB) si scarica da solo la prima volta.
"""
import argparse
import os
import urllib.request

import numpy as np
import torch
from PIL import Image

URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth"
CARTELLA = os.path.expanduser("~/.cache/modelli_video")


def modello():
    import spandrel

    os.makedirs(CARTELLA, exist_ok=True)
    p = os.path.join(CARTELLA, "realesr-general-x4v3.pth")
    if not os.path.exists(p):
        urllib.request.urlretrieve(URL, p)
    m = spandrel.ModelLoader().load_from_file(p)
    m.model.eval()
    return m


@torch.inference_mode()
def ingrandisci_rgb(m, rgb: np.ndarray, tile=384, pad=16) -> np.ndarray:
    """Lavora a tasselli per non esaurire la memoria."""
    h, w = rgb.shape[:2]
    s = m.scale
    out = np.zeros((h * s, w * s, 3), np.float32)
    x = torch.from_numpy(rgb.astype(np.float32) / 255).permute(2, 0, 1)[None]
    for y0 in range(0, h, tile):
        for x0 in range(0, w, tile):
            y1, x1 = min(h, y0 + tile), min(w, x0 + tile)
            ya, xa = max(0, y0 - pad), max(0, x0 - pad)
            yb, xb = min(h, y1 + pad), min(w, x1 + pad)
            o = m(x[:, :, ya:yb, xa:xb])[0].permute(1, 2, 0).clamp(0, 1).numpy()
            oy, ox = (y0 - ya) * s, (x0 - xa) * s
            out[y0 * s:y1 * s, x0 * s:x1 * s] = o[oy:oy + (y1 - y0) * s, ox:ox + (x1 - x0) * s]
    return (out * 255 + 0.5).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ingresso")
    ap.add_argument("uscita")
    ap.add_argument("--scala", type=int, default=4, choices=[2, 3, 4])
    a = ap.parse_args()
    torch.set_num_threads(max(1, os.cpu_count() or 1))

    im = Image.open(a.ingresso)
    alpha = im.getchannel("A") if im.mode in ("RGBA", "LA") else None
    rgb = np.array(im.convert("RGB"))
    m = modello()
    big = Image.fromarray(ingrandisci_rgb(m, rgb))
    W, H = im.width * a.scala, im.height * a.scala
    if big.size != (W, H):
        big = big.resize((W, H), Image.LANCZOS)
    if alpha is not None:
        big = big.convert("RGBA")
        big.putalpha(alpha.resize((W, H), Image.LANCZOS))
    big.save(a.uscita)
    print("ok", a.uscita, big.size)


if __name__ == "__main__":
    main()
