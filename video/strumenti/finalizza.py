#!/usr/bin/env python3
"""
finalizza.py — ultimo passaggio: unisce video + audio, applica un colore
cinematografico e prepara i file da pubblicare.

Uscite:  NOME_4K.mp4 (2160x3840)  NOME_1080.mp4 (leggero, per il telefono)  NOME_copertina.jpg

Colori disponibili (--colore):
  caldo     toni dorati e morbidi, ideale per salumi, pane, formaggi, vino
  cinema    ombre fredde e pelle/cibo caldi (look da film)
  vivace    più contrasto e saturazione, per frutta e bevande
  nessuno   lascia i colori come sono

Uso:
  python3 finalizza.py video_muto.mp4 audio.wav NOME [--colore caldo] [--copertina 20.5]
"""
import argparse
import subprocess

COLORI = {
    "caldo": "colorbalance=rs=0.04:gs=0.01:bs=-0.04:rm=0.03:bm=-0.03:rh=0.02:bh=-0.02,"
             "eq=contrast=1.05:saturation=1.08:gamma=0.98,curves=all='0/0 0.12/0.10 0.5/0.52 0.9/0.93 1/1'",
    "cinema": "colorbalance=rs=-0.05:gs=-0.01:bs=0.06:rm=0.04:gm=0.0:bm=-0.04:rh=0.04:bh=-0.03,"
              "eq=contrast=1.08:saturation=1.05,curves=all='0/0.02 0.25/0.22 0.75/0.78 1/0.98'",
    "vivace": "eq=contrast=1.1:saturation=1.22:gamma=0.97,unsharp=5:5:0.4",
    "nessuno": "null",
}


def run(cmd):
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("audio")
    ap.add_argument("nome")
    ap.add_argument("--colore", default="caldo", choices=list(COLORI))
    ap.add_argument("--copertina", type=float, default=2.0, help="secondo del fotogramma di copertina")
    a = ap.parse_args()

    v4k = f"{a.nome}_4K.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-i", a.audio,
         "-map", "0:v", "-map", "1:a", "-vf", f"{COLORI[a.colore]},format=yuv420p",
         "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-profile:v", "high",
         "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", v4k])
    run(["ffmpeg", "-y", "-v", "error", "-i", v4k, "-vf", "scale=1080:1920:flags=lanczos",
         "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-c:a", "copy",
         "-movflags", "+faststart", f"{a.nome}_1080.mp4"])
    run(["ffmpeg", "-y", "-v", "error", "-ss", str(a.copertina), "-i", v4k, "-frames:v", "1",
         "-q:v", "2", f"{a.nome}_copertina.jpg"])
    print("ok", v4k, f"{a.nome}_1080.mp4", f"{a.nome}_copertina.jpg")


if __name__ == "__main__":
    main()
