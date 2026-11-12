---
name: spot-prodotti
description: Crea video pubblicitari verticali 4K (Instagram/TikTok) per prodotti alimentari partendo da foto: prodotti scontornati che si muovono davvero (AI Wan 2.2 gratis), sito del cliente come sfondo o "sito che prende vita", voce italiana, musica orchestrale, logo e slogan. Usare quando l'utente manda foto di prodotti e chiede un video, uno spot, un reel, un effetto (fette che scendono, panino che si apre, prodotto che gira).
---

# Spot prodotti (metodo collaudato con Salumi Sei Colli)

Tutto è in `video/`. Strumenti in `video/strumenti/`, composizioni Remotion in `video/remotion/src/`,
esempi completi (props + copioni) in `video/esempi/`.

## Cosa vuole il cliente (lezioni apprese — rispettarle)
- **Movimento VERO** dei prodotti (fette che si sollevano/scendono, panino che si apre): si ottiene solo con l'AI video
  (`anima_ai.py`). Foto ferme che si spostano/ruotano NON bastano: il cliente le rifiuta.
- **Niente computer/laptop**: il sito sta a tutto schermo (stile "SitoVivo") o scorre dietro (stile "Vetrina").
- **Molto fine ed elegante** ("fa paura" = bellissimo, NON horror). Nero e oro, Playfair + Montserrat.
- **Niente lucido sulle persone** (effetto `Lucido` solo su salumi, mai su volti).
- Scontorni perfetti: controllare sempre su sfondo rosso/verde, togliere aloni bianchi (choke 2-3 px +
  decontaminazione), togliere loghi stampati e bollini di Instagram dalle foto (inpainting OpenCV).
- La voce non deve essere tagliata: non togliere il silenzio finale dei file edge-tts.
- Prima di lavorare a lungo, fare una **proposta breve** e aspettare l'ok. Parlare semplice, in italiano.

## Strumenti
| Comando | Uso |
|---|---|
| `anima_ai.py foto out.mp4 --prompt "..." [--studio] [--scontorna] [--ingrandisci]` | movimento reale con Wan 2.2 (Hugging Face, token già nel proxy). UN movimento semplice per clip. Quota gratis ~3-4 clip/giorno; se "exceeded quota" ridurre `--secondi 3.5 --passi 6` |
| `migliora_clip_ai.py in.mp4 out.mp4 inizio fine rallenta` | Real-ESRGAN + 30 fps fluidi per clip AI 480x832 |
| `foto_3d.py foto out.mp4 --movimento avvicina\|orbita\|sali --centro-x --margine` | parallasse 3D da foto (Depth Anything) |
| `ingrandisci.py` | Real-ESRGAN su foto (mantiene alpha) |
| `scontorna_video.py frames/ alpha/` | rembg per fotogramma (clip Kling/AI → webm trasparente) |
| `voce_sottotitoli.py copione.txt voce.wav parole.json --durata N` | voce edge-tts Diego + tempi parola |
| `musica_orchestra.py out.wav DURATA CLIMAX SLOGAN` | musica orchestrale elegante |
| `musica_trailer.py` | colonna da trailer (solo se richiesto stile forte) |
| `finalizza.py muto.mp4 audio.wav NOME --colore caldo` | grading + 4K + 1080 + copertina |

Mix audio standard: voce con compressore + sidechain sulla musica + `loudnorm=I=-14`.

## Composizioni Remotion (render 4K: `--scale=2`, concurrency 3, crf 15)
- **SitoVivo** (preferita dal cliente): pagine del sito ricreate nero/oro che scorrono; ogni pagina titolo + pulsante +
  media (`scheda` = clip in riquadro, `esce` = webm trasparente che esce dalla pagina); finale logo + slogan.
- **Vetrina**: sito catturato che scorre in 3D dietro, PNG che scendono/girano, effetti (polvere, bokeh, luci).
- **Sinfonia**: logo d'oro 3D con spessore, prodotti in orbita (meno gradita: oggetti fermi).
- **Trailer**: stile cinema forte (buio, BOOM) — solo su richiesta.
Prima del 4K fare sempre stills a `--scale=0.25` e un foglio di controllo; nei render chiudere i processi Chrome se si blocca.

## Prompt AI che funzionano (inglese, semplici)
- fette: "the thin glossy slices of coppa gently lift up and flutter softly in the air like silk, curling and swaying slowly, then settle back down"
- taglio: "the chef slowly slices the ham with a long knife, a paper-thin translucent slice peels off and gently falls down"
- panino: "the bread roll slowly splits open into two halves, the top half lifts up" (azioni multiple → risultati confusi)
Volti di persone reali possono cambiare: usare i primi 2-3 secondi o inquadrare le mani.
