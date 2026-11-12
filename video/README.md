# Spot verticali dalle foto

Dai una foto e una frase che descrive l'effetto, ottieni un video pubblicitario
verticale (1080x1920, 30 fps, audio a -14 LUFS) pronto per Instagram Reels e TikTok.

```
./spot mela.jpg "la mela si sbuccia da sola" --titolo "Mele appena colte" --cta "Ordina ora"
```

Oppure in Claude Code: `/spot mela.jpg "la mela si sbuccia da sola"`. Claude scrive
titolo, voce e prompt AI per te, crea il video e controlla il risultato.

## Cosa fa ogni strumento

| Strumento | Ruolo |
|---|---|
| **Wan 2.2 / LTX-Video** (Hugging Face, gratis) | anima la foto con l'AI: la mela si sbuccia, il latte scende, la bottiglia si apre |
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

## Modificare la grafica delle scritte

```
cd video/remotion && npm run studio
```

Apre Remotion Studio nel browser: il file da modificare è `remotion/src/Spot.tsx`.
