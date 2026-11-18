#!/usr/bin/env python3
"""
anima_ai.py — fa MUOVERE DAVVERO una foto con l'intelligenza artificiale (Wan 2.2,
gratis su Hugging Face) e prepara la clip per i video 4K.

Esempi:
  # fette che si muovono (la foto resta com'è, con il suo sfondo)
  python3 anima_ai.py coppa.jpg coppa_mossa.mp4 \
      --prompt "the thin glossy slices of coppa gently lift up and flutter like silk, then settle"

  # prodotto scontornato (PNG) su sfondo da studio, poi clip trasparente da mettere sopra il sito
  python3 anima_ai.py panino.png panino.webm --studio --scontorna \
      --prompt "the bread roll splits open into two halves, the top half lifts up"

Consigli: UN movimento semplice per clip (le istruzioni con 3 azioni insieme vengono male).
Scrivi il prompt in inglese. Ogni clip dura ~5 s e usa ~1 minuto di quota gratuita.

Token: su questo ambiente cloud il token è già inserito in automatico dal proxy.
Sul tuo computer: export HF_TOKEN=hf_...
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageFilter

SPAZIO = os.environ.get("SPAZIO_WAN", "zerogpu-aoti/wan2-2-fp8da-aoti-faster")
NEGATIVO = ("text, logo, watermark, letters, blurry, distorted, deformed, melting, extra objects, "
            "cartoon, low quality, static image")
QUI = os.path.dirname(os.path.abspath(__file__))


def studio(png: str, out: str, w=720, h=1280):
    """Mette un PNG scontornato su uno sfondo beige da studio con ombra morbida."""
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.clip(np.sqrt(((xx - w * .5) / w) ** 2 + ((yy - h * .42) / h) ** 2) * 1.6, 0, 1)[..., None]
    img = (np.array([214, 190, 160]) * (1 - d) + np.array([150, 118, 88]) * d).astype("uint8")
    bg = Image.fromarray(img).convert("RGBA")
    p = Image.open(png).convert("RGBA")
    p.thumbnail((int(w * .85), int(h * .55)), Image.LANCZOS)
    x, y = (w - p.width) // 2, int(h * .5 - p.height / 2)
    sh = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sh.paste((40, 25, 10, 255), (x + 10, y + 30), p.getchannel("A").point(lambda v: int(v * .45)))
    bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    bg.alpha_composite(p, (x, y))
    bg.convert("RGB").save(out, quality=95)


def genera(img: str, prompt: str, out: str, secondi: float, passi: int):
    from gradio_client import Client, handle_file

    token = os.environ.get("HF_TOKEN") or None
    c = Client(SPAZIO, token=token, verbose=False)
    r = c.predict(input_image=handle_file(img), prompt=prompt, negative_prompt=NEGATIVO, steps=passi,
                  duration_seconds=secondi, randomize_seed=True, api_name="/generate_video")
    v = r[0] if isinstance(r, (list, tuple)) else r
    v = v.get("video") if isinstance(v, dict) else v
    shutil.copy(v, out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("foto")
    ap.add_argument("uscita", help=".mp4 normale, oppure .webm con --scontorna (trasparente)")
    ap.add_argument("--prompt", required=True, help="il movimento, in inglese")
    ap.add_argument("--secondi", type=float, default=5)
    ap.add_argument("--passi", type=int, default=8)
    ap.add_argument("--studio", action="store_true", help="la foto è un PNG scontornato: mettila su sfondo da studio")
    ap.add_argument("--ingrandisci", action="store_true", help="Real-ESRGAN fotogramma per fotogramma (più lento)")
    ap.add_argument("--scontorna", action="store_true", help="toglie lo sfondo da ogni fotogramma (webm trasparente)")
    a = ap.parse_args()

    tmp = tempfile.mkdtemp(prefix="anima_")
    src = a.foto
    if a.studio:
        src = os.path.join(tmp, "studio.jpg")
        studio(a.foto, src)
    prompt = (a.prompt.rstrip(". ") + ". Premium food commercial, slow motion, realistic, soft warm studio light, "
              "static camera, no text")
    print("▶ genero il movimento con Wan 2.2 (circa 1 minuto)…", flush=True)
    grezzo = os.path.join(tmp, "grezzo.mp4")
    genera(src, prompt, grezzo, a.secondi, a.passi)

    # fluido a 30 fps (interpolazione del movimento)
    fluido = os.path.join(tmp, "fluido.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", grezzo, "-vf",
                    "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1", "-c:v", "libx264", "-crf", "14",
                    "-pix_fmt", "yuv420p", fluido], check=True)

    cartella = os.path.join(tmp, "frame")
    os.makedirs(cartella)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", fluido, os.path.join(cartella, "%04d.png")], check=True)

    if a.ingrandisci:
        print("▶ ingrandisco con Real-ESRGAN…", flush=True)
        sys.path.insert(0, QUI)
        from ingrandisci import ingrandisci_rgb, modello

        m = modello()
        for f in sorted(os.listdir(cartella)):
            p = os.path.join(cartella, f)
            big = ingrandisci_rgb(m, np.array(Image.open(p).convert("RGB")))
            Image.fromarray(big).resize((big.shape[1] // 2, big.shape[0] // 2), Image.LANCZOS).save(p)

    if a.scontorna:
        print("▶ tolgo lo sfondo da ogni fotogramma…", flush=True)
        alpha = os.path.join(tmp, "alpha")
        os.makedirs(alpha)
        subprocess.run([sys.executable, "-I", os.path.join(QUI, "scontorna_video.py"), cartella, alpha], check=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", "30", "-i", os.path.join(alpha, "%04d.png"),
                        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "18", "-row-mt", "1",
                        "-auto-alt-ref", "0", a.uscita], check=True)
    else:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", "30", "-i", os.path.join(cartella, "%04d.png"),
                        "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", a.uscita], check=True)
    print("✅", a.uscita)


if __name__ == "__main__":
    main()
