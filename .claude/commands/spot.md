---
description: Foto + frase → video pubblicitario verticale (Instagram/TikTok)
argument-hint: <foto> "<frase che descrive l'effetto>" [note su testo, marchio, voce, musica]
---

Crea uno spot pubblicitario verticale 1080x1920 partendo da: $ARGUMENTS

Procedura:
1. Individua la foto (percorso indicato o file allegato) e la frase dell'effetto.
   Se manca una delle due, chiedila con una sola domanda.
2. Se mancano gli strumenti, installali: `pip install -r video/requirements.txt` e
   `cd video/remotion && npm install` (FFmpeg deve essere presente).
3. Guarda la foto e prepara, in italiano, testi da pubblicità brevi e incisivi:
   - `--titolo` (max 4-5 parole), `--sottotitolo` (max 6-7 parole), `--cta` (2-3 parole)
   - `--voce`: 1-2 frasi da leggere in 6-10 secondi
   - `--marchio` se si capisce dalla foto o dalle note
   - `--colore`: un accento hex che si intona con il prodotto
4. Traduci l'effetto in un prompt inglese preciso per il modello video (`--prompt-en`):
   descrivi soggetto, movimento e camera, es. "the red apple peels itself, the skin
   curling off in one continuous spiral, revealing the white flesh".
5. Esegui `python3 video/crea_video.py FOTO "FRASE" --titolo ... --prompt-en ...`
   (motore `auto`: prova Wan 2.2, poi LTX-Video, poi l'effetto FFmpeg senza AI).
6. Controlla 3-4 fotogrammi del risultato (ffmpeg) e correggi se le scritte coprono
   il prodotto o l'effetto AI è deformato (rigenera, o usa `--motore ltx`/`wan`).
7. Invia all'utente il video e la copertina, dicendo quale motore è stato usato.
