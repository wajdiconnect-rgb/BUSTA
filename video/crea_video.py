#!/usr/bin/env python3
"""
crea_video.py — dalla foto al video pubblicitario verticale (1080x1920) per Instagram e TikTok.

Uso minimo:
    python3 crea_video.py foto.jpg "la mela si sbuccia da sola"

Passi:
  1. prepara la foto in formato 9:16 (sfondo sfocato, prodotto intero)
  2. effetto AI image-to-video su Hugging Face (Wan 2.2 o LTX-Video, gratis)
     -> se l'AI non è disponibile usa un effetto cinematografico con FFmpeg
  3. montaggio con MoviePy: clip AI + chiusura sul prodotto, dissolvenze
  4. scritte animate con Remotion (titolo, sottotitolo, pulsante CTA, marchio)
  5. voce italiana con edge-tts + musica (tua o generata) con ducking, FFmpeg
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import shutil
import ssl
import subprocess
import sys
import tempfile
import time
from pathlib import Path

QUI = Path(__file__).resolve().parent
REMOTION = QUI / "remotion"
W, H, FPS = 1080, 1920, 30

VOCI = {
    "isabella": "it-IT-IsabellaNeural",
    "elsa": "it-IT-ElsaNeural",
    "diego": "it-IT-DiegoNeural",
    "giuseppe": "it-IT-GiuseppeMultilingualNeural",
}

# Spazi gratuiti su Hugging Face (ZeroGPU). Con HF_TOKEN la quota gratuita è molto più alta.
SPAZIO_WAN = os.environ.get("SPAZIO_WAN", "zerogpu-aoti/wan2-2-fp8da-aoti-faster")
SPAZIO_LTX = os.environ.get("SPAZIO_LTX", "Lightricks/ltx-video-distilled")

# Piccolo vocabolario per trasformare la frase italiana in un prompt inglese
# (i modelli video capiscono meglio l'inglese). Si può sempre passare --prompt-en.
VOCABOLARIO = {
    "mela": "apple", "arancia": "orange", "limone": "lemon", "banana": "banana",
    "fragola": "strawberry", "frutta": "fruit", "latte": "milk", "caffè": "coffee",
    "caffe": "coffee", "tazza": "cup", "bicchiere": "glass", "bottiglia": "bottle",
    "vino": "wine", "birra": "beer", "acqua": "water", "succo": "juice",
    "cioccolato": "chocolate", "pane": "bread", "pizza": "pizza", "formaggio": "cheese",
    "miele": "honey", "olio": "olive oil", "pasta": "pasta", "gelato": "ice cream",
    "torta": "cake", "biscotto": "cookie", "biscotti": "cookies", "crema": "cream",
    "profumo": "perfume", "scatola": "box", "barattolo": "jar", "lattina": "can",
    "tappo": "cap", "vasetto": "jar", "confezione": "package", "pacco": "package",
    "si sbuccia": "peels itself, the skin curling off in a smooth spiral",
    "sbuccia": "peeling", "scende": "pours down", "cade": "falls", "versa": "pours",
    "si versa": "is poured", "si apre": "opens", "apre": "opens", "si chiude": "closes",
    "gira": "rotates", "ruota": "rotates slowly", "esplode": "bursts", "schizza": "splashes",
    "schizzi": "splashes", "gocce": "droplets", "goccia": "drop", "fuma": "steams",
    "fumo": "steam", "vapore": "steam", "si scioglie": "melts", "scioglie": "melts",
    "brilla": "sparkles", "luccica": "glistens", "vola": "floats in the air",
    "si taglia": "is sliced", "taglia": "slices", "fetta": "slice", "fette": "slices",
    "bolle": "bubbles", "frizzante": "sparkling", "schiuma": "foam", "ghiaccio": "ice",
    "fresco": "fresh", "fresca": "fresh", "lentamente": "slowly", "piano": "slowly",
    "veloce": "fast", "da sola": "by itself", "da solo": "by itself", "nel": "into the",
    "nella": "into the", "sul": "onto the", "sulla": "onto the", "dal": "from the",
    "dalla": "from the", "la": "the", "il": "the", "lo": "the", "le": "the", "i": "the",
    "gli": "the", "un": "a", "una": "a", "e": "and", "con": "with",
}

NEGATIVO = ("worst quality, blurry, jittery, distorted, deformed, morphing, extra objects, "
            "text, watermark, logo change, inconsistent motion, low resolution")


def log(msg: str) -> None:
    print(f"▶ {msg}", flush=True)


def esegui(cmd: list[str], **kw) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError(f"Comando fallito: {' '.join(cmd[:4])}…\n{r.stderr[-2500:]}")


def durata_media(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip())


# ---------------------------------------------------------------- 1. foto 9:16
def prepara_foto(foto: Path, out: Path) -> None:
    """Foto a 1080x1920: prodotto intero al centro, sfondo con la stessa foto sfocata."""
    vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
          f"gblur=sigma=40,eq=brightness=-0.06[bg];"
          f"[b]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];"
          f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1")
    esegui(["ffmpeg", "-y", "-v", "error", "-i", str(foto), "-filter_complex", vf,
            "-frames:v", "1", "-q:v", "2", str(out)])


# ---------------------------------------------------------------- 2. prompt + AI
def prompt_inglese(frase: str) -> str:
    t = frase.lower().strip()
    for it in sorted(VOCABOLARIO, key=len, reverse=True):
        t = re.sub(rf"(?<!\w){re.escape(it)}(?!\w)", VOCABOLARIO[it], t)
    return t


def componi_prompt(azione_en: str) -> str:
    return (f"{azione_en}. Premium product commercial, cinematic slow motion, "
            "smooth realistic motion, studio lighting, shallow depth of field, "
            "camera mostly static with a gentle push-in, high detail, 4k")


def _salva_video(risultato, dest: Path) -> Path:
    v = risultato[0] if isinstance(risultato, (list, tuple)) else risultato
    if isinstance(v, dict):
        v = v.get("video") or v.get("path")
    shutil.copy(v, dest)
    return dest


def genera_ai(motore: str, img: Path, prompt: str, dest: Path, secondi: float) -> Path:
    from gradio_client import Client, handle_file

    token = os.environ.get("HF_TOKEN") or None
    if motore == "wan":
        c = Client(SPAZIO_WAN, token=token, verbose=False)
        r = c.predict(input_image=handle_file(str(img)), prompt=prompt, steps=6,
                      negative_prompt=NEGATIVO, duration_seconds=min(secondi, 5.0),
                      randomize_seed=True, api_name="/generate_video")
    elif motore == "ltx":
        c = Client(SPAZIO_LTX, token=token, verbose=False)
        r = c.predict(prompt=prompt, negative_prompt=NEGATIVO,
                      input_image_filepath=handle_file(str(img)),
                      height_ui=832, width_ui=480, mode="image-to-video",
                      duration_ui=min(secondi, 6.0), randomize_seed=True,
                      improve_texture_flag=True, api_name="/image_to_video")
    else:
        raise ValueError(motore)
    return _salva_video(r, dest)


def zoom_lento(img: Path, dest: Path, secondi: float, z_fine: float = 1.15) -> Path:
    """Movimento di macchina 'Ken Burns' fluido (usato anche come riserva se l'AI non c'è)."""
    n = max(1, int(secondi * FPS))
    vf = (f"scale={W*2}:{H*2}:flags=lanczos,"
          f"zoompan=z='1+({z_fine}-1)*(1-cos(PI*on/{n}))/2':x='iw/2-(iw/zoom/2)':"
          f"y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS},"
          f"eq=saturation=1.08:contrast=1.04,vignette=PI/6,format=yuv420p")
    esegui(["ffmpeg", "-y", "-v", "error", "-i", str(img), "-vf", vf, "-frames:v", str(n),
            "-c:v", "libx264", "-crf", "17", "-preset", "medium", str(dest)])
    return dest


# ---------------------------------------------------------------- 3. montaggio MoviePy
def montaggio(clip_effetto: Path, foto916: Path, dest: Path, durata: float, lavoro: Path) -> None:
    import math
    from moviepy import VideoFileClip, CompositeVideoClip, vfx

    eff = VideoFileClip(str(clip_effetto)).without_audio()
    # copertura 9:16 a piena risoluzione (mai bordi neri)
    scala = max(W / eff.w, H / eff.h)
    eff = eff.resized(new_size=(math.ceil(eff.w * scala), math.ceil(eff.h * scala)))
    eff = eff.cropped(x_center=eff.w / 2, y_center=eff.h / 2, width=W, height=H)

    # l'effetto occupa ~60% dello spot; se è corto lo rallentiamo un po' (slow motion)
    obiettivo = durata * 0.6
    if eff.duration < obiettivo:
        eff = eff.with_effects([vfx.MultiplySpeed(max(0.6, eff.duration / obiettivo))])
    eff = eff.subclipped(0, min(eff.duration, obiettivo))

    # chiusura sul prodotto (packshot) con leggera spinta in avanti, in dissolvenza incrociata
    xfade = 0.6
    resto = durata - eff.duration + xfade
    pack = VideoFileClip(str(zoom_lento(foto916, lavoro / "packshot.mp4", resto + 0.3, 1.06)))
    pack = pack.with_start(eff.duration - xfade).with_effects([vfx.CrossFadeIn(xfade)])

    video = CompositeVideoClip([eff, pack], size=(W, H)).with_duration(durata)
    video.write_videofile(str(dest), fps=FPS, codec="libx264", audio=False,
                          preset="medium", ffmpeg_params=["-crf", "17", "-pix_fmt", "yuv420p"],
                          logger=None)
    eff.close()
    pack.close()


# ---------------------------------------------------------------- 4. scritte Remotion
def browser_locale() -> str | None:
    for p in [*map(str, Path("/opt/pw-browsers").glob("chromium_headless_shell-*/*/chrome-headless-shell")),
              os.environ.get("REMOTION_BROWSER", "")]:
        if p and Path(p).exists():
            return p
    return None


def scritte_remotion(base: Path, dest: Path, props: dict, lavoro: Path) -> bool:
    pub = lavoro / "public"
    pub.mkdir(exist_ok=True)
    shutil.copy(base, pub / "base.mp4")
    (lavoro / "props.json").write_text(json.dumps(props, ensure_ascii=False))
    cmd = ["npx", "remotion", "render", "src/index.ts", "Spot", str(dest),
           f"--props={lavoro / 'props.json'}", f"--public-dir={pub}", "--log=error",
           "--codec=h264", "--crf=17"]
    b = browser_locale()
    if b:
        cmd.append(f"--browser-executable={b}")
    r = subprocess.run(cmd, cwd=REMOTION, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:] or r.stdout[-2000:], file=sys.stderr)
        return False
    return True


def scritte_ffmpeg(base: Path, dest: Path, props: dict) -> None:
    """Riserva se Remotion non è installato: scritte semplici con drawtext."""
    font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    def esc(s: str) -> str:
        return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’")

    d = props["durata"]
    vf = (f"drawtext=fontfile={font}:text='{esc(props['titolo'].upper())}':fontsize=84:"
          f"fontcolor=white:borderw=4:bordercolor=black@0.6:x=(w-tw)/2:y=330:"
          f"alpha='min(1,max(0,(t-0.4)*3))':enable='lt(t,{d-3.2})',"
          f"drawtext=fontfile={font}:text='{esc(props['cta'].upper())}':fontsize=64:"
          f"fontcolor=black:box=1:boxcolor={props['colore']}:boxborderw=30:"
          f"x=(w-tw)/2:y=h-500:enable='gte(t,{d-3.2})'")
    esegui(["ffmpeg", "-y", "-v", "error", "-i", str(base), "-vf", vf, "-c:v", "libx264",
            "-crf", "17", "-pix_fmt", "yuv420p", str(dest)])


# ---------------------------------------------------------------- 5. voce e musica
def voce_edge(testo: str, voce: str, dest: Path) -> Path:
    import edge_tts
    import edge_tts.communicate as comm

    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    ca = os.environ.get("SSL_CERT_FILE") or (
        "/root/.ccr/ca-bundle.crt" if Path("/root/.ccr/ca-bundle.crt").exists() else None)
    if ca:
        comm._SSL_CTX = ssl.create_default_context(cafile=ca)
    asyncio.run(edge_tts.Communicate(testo, voce, rate="+4%", proxy=proxy).save(str(dest)))
    return dest


def musica_generata(dest: Path, durata: float) -> Path:
    """Musica di sottofondo originale (libera da diritti): pad morbido + battito leggero."""
    bpm = 100
    beat = 60 / bpm
    accordi = [(261.63, 329.63, 392.00), (220.00, 261.63, 329.63),
               (174.61, 220.00, 261.63), (196.00, 246.94, 293.66)]
    giro = beat * 4
    parti = []
    for i, ch in enumerate(accordi):
        f = "+".join(f"sin(2*PI*{fr}*t)+0.4*sin(2*PI*{fr*2}*t)" for fr in ch)
        cond = f"between(mod(t,{giro*4}),{giro*i},{giro*(i+1)})"
        parti.append(f"{cond}*({f})")
    pad = f"0.06*({'+'.join(parti)})*(0.75+0.25*sin(2*PI*t/{beat}))"
    kick = f"0.35*sin(2*PI*55*t)*exp(-mod(t,{beat})*18)"
    hat = f"0.04*(random(0)*2-1)*exp(-mod(t+{beat/2},{beat})*60)"
    expr = f"{pad}+{kick}+{hat}"
    esegui(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
            f"aevalsrc='{expr}':s=44100:d={durata}",
            "-af", "lowpass=f=5000,aecho=0.8:0.7:180:0.25,"
                   f"afade=t=in:d=0.8,afade=t=out:st={max(0, durata-1.5)}:d=1.5",
            "-ac", "2", str(dest)])
    return dest


def mix_finale(video: Path, voce: Path | None, musica: Path, dest: Path, durata: float) -> None:
    ingressi = ["-i", str(video), "-stream_loop", "-1", "-i", str(musica)]
    if voce:
        ingressi += ["-i", str(voce)]
        fc = (f"[1:a]atrim=0:{durata},asetpts=PTS-STARTPTS,volume=0.55,"
              f"afade=t=out:st={durata-1.5}:d=1.5[m];"
              f"[2:a]adelay=500|500,apad,atrim=0:{durata},volume=1.6,asplit[v1][v2];"
              f"[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];"
              f"[md][v2]amix=inputs=2:duration=first:normalize=0,"
              f"loudnorm=I=-14:TP=-1.5:LRA=11[a]")
    else:
        fc = (f"[1:a]atrim=0:{durata},afade=t=out:st={durata-1.5}:d=1.5,"
              f"loudnorm=I=-14:TP=-1.5:LRA=11[a]")
    esegui(["ffmpeg", "-y", "-v", "error", *ingressi, "-filter_complex", fc,
            "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-preset", "slow",
            "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{durata}",
            "-movflags", "+faststart", str(dest)])


# ---------------------------------------------------------------- principale
def main() -> None:
    ap = argparse.ArgumentParser(description="Foto + frase → spot verticale per Instagram/TikTok")
    ap.add_argument("foto", type=Path)
    ap.add_argument("effetto", help='es. "la mela si sbuccia", "il latte scende nel bicchiere"')
    ap.add_argument("--titolo", default=None, help="scritta grande animata")
    ap.add_argument("--sottotitolo", default="")
    ap.add_argument("--cta", default="Scopri di più", help="testo del pulsante finale")
    ap.add_argument("--marchio", default="", help="nome del marchio in alto")
    ap.add_argument("--colore", default="#FFD23F", help="colore di accento (hex)")
    ap.add_argument("--voce", default=None, help="testo della voce fuori campo ('' = niente voce)")
    ap.add_argument("--speaker", default="isabella", choices=list(VOCI))
    ap.add_argument("--musica", type=Path, default=None, help="tuo file musicale (mp3/wav)")
    ap.add_argument("--durata", type=float, default=12.0, help="secondi (consigliati 8-15)")
    ap.add_argument("--motore", default="auto", choices=["auto", "wan", "ltx", "nessuno"])
    ap.add_argument("--prompt-en", default=None, help="prompt inglese per l'AI (sovrascrive la traduzione)")
    ap.add_argument("--uscita", type=Path, default=None)
    a = ap.parse_args()

    if not a.foto.exists():
        sys.exit(f"Foto non trovata: {a.foto}")
    titolo = a.titolo or a.effetto.capitalize()
    testo_voce = a.voce if a.voce is not None else f"{titolo}. {a.sottotitolo} {a.cta}!".replace("  ", " ")
    uscita = a.uscita or a.foto.with_name(f"{a.foto.stem}_spot_9x16.mp4")
    lavoro = Path(tempfile.mkdtemp(prefix="spot_"))
    log(f"cartella di lavoro: {lavoro}")

    # voce prima: la durata dello spot si allunga se il parlato è lungo
    voce = None
    if testo_voce.strip():
        log("voce fuori campo (edge-tts)")
        try:
            voce = voce_edge(testo_voce, VOCI[a.speaker], lavoro / "voce.mp3")
            a.durata = max(a.durata, durata_media(voce) + 1.5)
        except Exception as e:  # noqa: BLE001
            print(f"  voce non disponibile ({e}); continuo senza", file=sys.stderr)

    log("preparo la foto in 9:16")
    foto916 = lavoro / "foto916.jpg"
    prepara_foto(a.foto, foto916)

    azione = a.prompt_en or prompt_inglese(a.effetto)
    prompt = componi_prompt(azione)
    log(f"prompt AI: {prompt}")
    clip = None
    motori = {"auto": ["wan", "ltx"], "wan": ["wan"], "ltx": ["ltx"], "nessuno": []}[a.motore]
    for m in motori:
        log(f"effetto AI con {m.upper()} su Hugging Face (può richiedere 1-4 minuti)…")
        t0 = time.time()
        try:
            clip = genera_ai(m, foto916, prompt, lavoro / f"ai_{m}.mp4", a.durata * 0.5)
            log(f"  fatto in {time.time()-t0:.0f}s")
            break
        except Exception as e:  # noqa: BLE001
            msg = str(e).splitlines()[0][:300]
            print(f"  {m} non disponibile: {msg}", file=sys.stderr)
    usato_ai = clip is not None
    if not clip:
        log("uso l'effetto cinematografico FFmpeg (senza AI)")
        clip = zoom_lento(foto916, lavoro / "effetto.mp4", a.durata * 0.6, 1.18)

    log("montaggio (MoviePy)")
    base = lavoro / "base.mp4"
    montaggio(clip, foto916, base, a.durata, lavoro)

    log("scritte animate (Remotion)")
    props = {"video": "base.mp4", "durata": a.durata, "titolo": titolo,
             "sottotitolo": a.sottotitolo, "cta": a.cta, "marchio": a.marchio, "colore": a.colore}
    con_scritte = lavoro / "scritte.mp4"
    if not (REMOTION / "node_modules").exists() or not scritte_remotion(base, con_scritte, props, lavoro):
        log("  Remotion non disponibile: scritte di riserva con FFmpeg")
        scritte_ffmpeg(base, con_scritte, props)

    log("musica e mix audio (FFmpeg)")
    musica = a.musica if a.musica and a.musica.exists() else musica_generata(lavoro / "musica.wav", a.durata)
    mix_finale(con_scritte, voce, musica, uscita, a.durata)

    esegui(["ffmpeg", "-y", "-v", "error", "-ss", f"{min(1.5, a.durata/3)}", "-i", str(uscita),
            "-frames:v", "1", "-q:v", "2", str(uscita.with_suffix(".jpg"))])
    print(f"\n✅ Video pronto: {uscita}  ({a.durata:.1f}s, 1080x1920, "
          f"{'effetto AI' if usato_ai else 'effetto FFmpeg'})")
    print(f"   Copertina:   {uscita.with_suffix('.jpg')}")


if __name__ == "__main__":
    main()
