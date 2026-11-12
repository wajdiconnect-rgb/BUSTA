#!/usr/bin/env python3
"""
voce_sottotitoli.py — crea la voce fuori campo italiana (edge-tts) da un copione
con i tempi, e un file JSON con il momento esatto di ogni parola, da usare per i
sottotitoli animati in Remotion (effetti.sottotitoli).

Copione (file di testo), una battuta per riga:  secondi | frase
  0.8  | Prosciutto di Parma. Stagionato con pazienza.
  6.0  | Affettato al momento, sottile come seta.

Uso:
  python3 voce_sottotitoli.py copione.txt voce.wav parole.json [--voce diego] [--durata 27]
"""
import argparse
import asyncio
import json
import os
import ssl
import subprocess
import tempfile

VOCI = {
    "diego": "it-IT-DiegoNeural",
    "giuseppe": "it-IT-GiuseppeMultilingualNeural",
    "isabella": "it-IT-IsabellaNeural",
    "elsa": "it-IT-ElsaNeural",
    # inglese
    "andrew": "en-US-AndrewMultilingualNeural",
    "christopher": "en-US-ChristopherNeural",
    "guy": "en-US-GuyNeural",
    "ryan": "en-GB-RyanNeural",
    "thomas": "en-GB-ThomasNeural",
    # francese, spagnolo, tedesco, arabo
    "henri": "fr-FR-HenriNeural",
    "remy": "fr-FR-RemyMultilingualNeural",
    "denise": "fr-FR-DeniseNeural",
    "alvaro": "es-ES-AlvaroNeural",
    "conrad": "de-DE-ConradNeural",
    "hamed": "ar-SA-HamedNeural",
}


def prepara_rete():
    import edge_tts.communicate as comm

    ca = os.environ.get("SSL_CERT_FILE") or (
        "/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
    if ca:
        comm._SSL_CTX = ssl.create_default_context(cafile=ca)
    return os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")


async def battuta(testo, voce, file_mp3, proxy, rate, pitch):
    import edge_tts

    c = edge_tts.Communicate(testo, voce, rate=rate, pitch=pitch, boundary="WordBoundary", proxy=proxy)
    parole = []
    with open(file_mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                parole.append({"testo": ch["text"], "inizio": ch["offset"] / 1e7,
                               "fine": (ch["offset"] + ch["duration"]) / 1e7})
    return parole


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("copione")
    ap.add_argument("voce_wav")
    ap.add_argument("parole_json")
    ap.add_argument("--voce", default="diego", choices=list(VOCI))
    ap.add_argument("--velocita", default="-6%")
    ap.add_argument("--tono", default="-4Hz")
    ap.add_argument("--durata", type=float, default=None, help="lunghezza totale in secondi")
    a = ap.parse_args()

    righe = []
    for r in open(a.copione, encoding="utf-8"):
        if "|" in r and not r.strip().startswith("#"):
            t, frase = r.split("|", 1)
            righe.append((float(t), frase.strip()))
    proxy = prepara_rete()
    tmp = tempfile.mkdtemp(prefix="voce_")
    tutte, ingressi, filtri = [], [], []
    for i, (t0, frase) in enumerate(righe):
        mp3 = os.path.join(tmp, f"b{i}.mp3")
        parole = asyncio.run(battuta(frase, VOCI[a.voce], mp3, proxy, a.velocita, a.tono))
        # edge-tts mette ~0.1s di silenzio iniziale: lo lasciamo, i tempi delle parole lo includono
        for p in parole:
            tutte.append({"testo": p["testo"], "inizio": round(t0 + p["inizio"], 3),
                          "fine": round(t0 + p["fine"], 3)})
        ingressi += ["-i", mp3]
        ms = int(t0 * 1000)
        filtri.append(f"[{i}:a]aresample=48000,adelay={ms}|{ms}[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(righe)))
    fc = ";".join(filtri) + f";{mix}amix=inputs={len(righe)}:normalize=0,aformat=channel_layouts=stereo"
    if a.durata:
        fc += f",apad,atrim=0:{a.durata}"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *ingressi, "-filter_complex", fc,
                    "-c:a", "pcm_s16le", a.voce_wav], check=True)
    json.dump(tutte, open(a.parole_json, "w"), ensure_ascii=False, indent=1)
    print("ok", a.voce_wav, a.parole_json, f"{len(tutte)} parole")


if __name__ == "__main__":
    main()
