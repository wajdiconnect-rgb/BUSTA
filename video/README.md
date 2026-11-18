# Spot verticali dalle foto

Dai una foto e una frase che descrive l'effetto, ottieni un video pubblicitario
verticale (1080x1920, 30 fps, audio a -14 LUFS) pronto per Instagram Reels e TikTok.

```
./spot prosciutto.jpg "il prosciutto si affetta piano piano" --titolo "Prosciutto di Parma" --cta "Ordina ora"
```

Oppure in Claude Code: `/spot prosciutto.jpg "il prosciutto si affetta piano piano"`. Claude scrive
titolo, voce e prompt AI per te, crea il video e controlla il risultato.

## Cosa fa ogni strumento

| Strumento | Ruolo |
|---|---|
| **Wan 2.2 / LTX-Video** (Hugging Face, gratis) | anima la foto con l'AI: il prosciutto si affetta, il latte scende, la bottiglia si apre |
| **MoviePy** | montaggio: effetto AI in slow motion, poi chiusura sul prodotto in dissolvenza |
| **Remotion** | scritte animate: marchio, titolo parola per parola, sottotitolo, pulsante CTA che pulsa |
| **edge-tts** | voce fuori campo italiana (Isabella, Elsa, Diego, Giuseppe) |
| **FFmpeg** | formato 9:16 con sfondo sfocato, musica, abbassamento automatico della musica sotto la voce, esportazione finale |

Se l'AI non risponde (quota finita o Space spento), il video viene fatto lo stesso con un
movimento di macchina cinematografico in FFmpeg, e il terminale lo segnala.

## Installazione (una volta sola)

```
cd video
./installa.sh
```

Serve: Python 3.10+, Node.js 20+, FFmpeg (lo script lo installa con Homebrew o apt).

**Token gratuito Hugging Face**, necessario per gli effetti AI: senza token la quota
gratuita condivisa finisce subito.
1. Crea un account su huggingface.co
2. Vai su https://huggingface.co/settings/tokens → *Create new token* → tipo **Read**
3. Aggiungi al tuo `~/.zshrc` (Mac) o `~/.bashrc`: `export HF_TOKEN=hf_...`

Con l'account gratuito hai alcuni minuti di GPU al giorno, cioè diversi video.

## Opzioni

```
--titolo "..."        scritta grande (l'ultima parola prende il colore di accento)
--sottotitolo "..."   riga sotto il titolo
--cta "..."           pulsante finale (default "Scopri di più")
--marchio "..."       nome in alto
--colore "#FFD23F"    colore di accento
--voce "..."          testo della voce; --voce "" = niente voce
--speaker isabella    isabella | elsa | diego | giuseppe
--musica brano.mp3    la tua musica (altrimenti ne genera una originale semplice)
--durata 12           secondi (si allunga da solo se la voce è più lunga)
--motore auto         auto | wan | ltx | nessuno
--prompt-en "..."     prompt inglese per l'AI (più preciso della traduzione automatica)
--uscita file.mp4
```

## Consigli per risultati migliori

- Foto nitida, prodotto ben illuminato e centrato, sfondo pulito.
- Una sola azione per frase: "il latte scende nel bicchiere", non tre cose insieme.
- Per la musica usa brani senza diritti (YouTube Audio Library, Pixabay Music):
  quella generata è solo un sottofondo di riserva.
- Le scritte stanno fuori dalle zone coperte dai pulsanti di TikTok e Instagram.

## Stile "Vetrina" (spot premium, come Salumi Sei Colli)

Il sito del cliente scorre in 3D sullo sfondo, i prodotti scontornati scendono e
ruotano sopra, clip AI (es. Kling) senza sfondo, chiusura con logo e slogan.
Composizione: `remotion/src/Vetrina.tsx`; esempio completo: `esempi/seicolli_vetrina.json`.

```
cd video/remotion
npx remotion render src/index.ts Vetrina uscita.mp4 --props=../esempi/seicolli_vetrina.json \
  --public-dir=CARTELLA_CON_FOTO_E_SITO --scale=2      # --scale=2 = 4K (2160x3840)
```

Effetti da accendere nel JSON, sotto `"effetti"`:

| Chiave | Effetto |
|---|---|
| `polvere` | polvere dorata che fluttua in profondità |
| `bokeh` | grandi luci calde sfocate, atmosfera da ristorante |
| `luci` | lampo di luce calda a ogni cambio scena |
| `grana` | grana pellicola cinematografica |
| `vignetta` | bordi scuri, l'occhio va al centro |
| `scia` | scia di movimento sui prodotti (export ~5 volte più lento) |
| `sottotitoli` | sottotitoli animati parola per parola (da `voce_sottotitoli.py`) |

## Strumenti extra (`strumenti/`)

| Comando | A cosa serve |
|---|---|
| `anima_ai.py foto.jpg out.mp4 --prompt "..." [--studio] [--scontorna] [--ingrandisci]` | **movimento vero con l'AI** (Wan 2.2 gratis su Hugging Face): fette che si sollevano, panino che si apre. Un movimento semplice per clip |
| `foto_3d.py foto.jpg out.mp4 --movimento avvicina\|orbita\|sali` | l'AI calcola la profondità (Depth Anything V2) e crea un vero movimento di camera 3D da una foto ferma |
| `ingrandisci.py foto.png foto_x2.png --scala 2` | ingrandimento AI (Real-ESRGAN): foto piccole nitide per il 4K, mantiene la trasparenza |
| `scontorna_video.py cartella_frame cartella_uscita` | toglie lo sfondo a ogni fotogramma di una clip (es. Kling) |
| `voce_sottotitoli.py copione.txt voce.wav parole.json` | voce italiana + tempi di ogni parola per i sottotitoli |
| `musica_orchestra.py musica.wav DURATA CLIMAX SLOGAN` | musica orchestrale originale con crescendo sul logo |
| `finalizza.py video.mp4 audio.wav NOME --colore caldo\|cinema\|vivace` | colore cinematografico + file 4K, 1080 e copertina |

Copione per `voce_sottotitoli.py` (secondi | frase):
```
0.8  | Prosciutto di Parma. Stagionato con pazienza.
6.0  | Affettato al momento, sottile come seta.
```

## Modificare la grafica delle scritte

```
cd video/remotion && npm run studio
```

Apre Remotion Studio nel browser: il file da modificare è `remotion/src/Spot.tsx`.
