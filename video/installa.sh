#!/usr/bin/env bash
# Installa tutto il necessario per creare spot verticali dalle foto.
# Funziona su macOS (con Homebrew) e Linux (Debian/Ubuntu).
set -e
cd "$(dirname "$0")"

echo "1/4 FFmpeg"
if ! command -v ffmpeg >/dev/null; then
  if command -v brew >/dev/null; then brew install ffmpeg
  elif command -v apt-get >/dev/null; then sudo apt-get update && sudo apt-get install -y ffmpeg
  else echo "Installa FFmpeg da https://ffmpeg.org/download.html"; exit 1; fi
fi

echo "2/4 Python: MoviePy, edge-tts, collegamento Hugging Face"
python3 -m pip install -r requirements.txt

echo "3/4 Node.js + Remotion"
if ! command -v npm >/dev/null; then
  echo "Installa Node.js (versione 20 o superiore) da https://nodejs.org e rilancia questo script."; exit 1
fi
(cd remotion && npm install --no-fund --no-audit)
(cd remotion && npx remotion browser ensure) || true

echo "4/5 Strumenti AI extra: foto 3D (Depth Anything) e ingrandimento (Real-ESRGAN)"
if [ "$(uname)" = "Linux" ]; then
  python3 -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
fi
python3 -m pip install -r requirements-ai.txt

echo "5/5 Token gratuito Hugging Face (per gli effetti AI)"
if [ -z "$HF_TOKEN" ]; then
  echo "  Crea un token gratuito su https://huggingface.co/settings/tokens (tipo 'Read')"
  echo "  e aggiungi al tuo ~/.zshrc o ~/.bashrc:   export HF_TOKEN=hf_..."
fi
chmod +x spot strumenti/*.py
echo "✅ Pronto. Prova:  ./spot prosciutto.jpg \"il prosciutto si affetta piano piano\""
