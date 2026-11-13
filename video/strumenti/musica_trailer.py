#!/usr/bin/env python3
"""
musica_trailer.py — colonna sonora originale in stile trailer cinematografico
(libera da diritti, generata al momento): drone di tensione, ostinato di archi,
colpi BOOM, "BRAAAM" di ottoni, whoosh sugli stacchi, silenzio drammatico, finale luminoso.

Uso:
  python3 musica_trailer.py uscita.wav --durata 25 \
      --boom 3.2 20.2 --braam 3.2 16.4 --whoosh 7.6 --tagli 12.4:15.6:7 \
      --silenzio 15.6:16.4 --luce 20.2
"""
import argparse
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(11)


def f(m):
    return 440 * 2 ** ((m - 69) / 12)


class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR)
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def put(self, s, t, pan=0.5, gain=1.0):
        i = int(t * SR)
        if i >= self.n or i + len(s) <= 0:
            return
        a, b = max(0, -i), min(len(s), self.n - i)
        self.L[i + a:i + b] += s[a:b] * gain * np.sqrt(1 - pan)
        self.R[i + a:i + b] += s[a:b] * gain * np.sqrt(pan)


def lowpass(x, cut):
    """filtro passa-basso a 1 polo (cut può essere un array: filtro che si apre)."""
    a = np.exp(-2 * np.pi * np.asarray(cut) / SR) * np.ones(len(x))
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):  # semplice ma sufficiente per suoni brevi
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def saw(freq, tt):
    ph = (freq * tt) % 1.0
    return 2 * ph - 1


def boom(dur=3.5):
    tt = np.arange(int(dur * SR)) / SR
    fr = 30 + 45 * np.exp(-tt * 6)
    sub = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 1.4)
    hit = rng.normal(0, 1, len(tt)) * np.exp(-tt * 18)
    hit = lowpass(hit, 1800)
    return 0.9 * sub + 0.5 * hit


def braam(note_basse=(38, 45, 50), dur=3.2):
    tt = np.arange(int(dur * SR)) / SR
    s = np.zeros(len(tt))
    for m in note_basse:
        for d in (-0.006, 0, 0.007):
            s += saw(f(m) * (1 + d), tt)
    env = np.minimum(1, tt / 0.05) * np.exp(-tt * 0.9)
    cut = 200 + 1600 * np.exp(-tt * 1.5)
    return lowpass(s * env / 9, cut) * 1.6


def whoosh(dur=0.9, verso=1):
    tt = np.arange(int(dur * SR)) / SR
    env = np.sin(np.pi * tt / dur) ** 2
    cut = 300 + 5000 * (tt / dur if verso > 0 else 1 - tt / dur)
    return lowpass(rng.normal(0, 1, len(tt)), cut) * env * 0.5


def kick(dur=0.5):
    tt = np.arange(int(dur * SR)) / SR
    fr = 45 + 110 * np.exp(-tt * 35)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 7)


def archi(m, dur, vol, att=0.4, rel=0.8):
    tt = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, tt / att) * np.clip((dur - tt) / rel, 0, 1)
    s = np.zeros(len(tt))
    for _ in range(5):
        det = rng.normal(0, 0.003)
        vib = 1 + 0.004 * np.sin(2 * np.pi * (5 + rng.uniform(-.3, .3)) * tt + rng.uniform(0, 6))
        ph = 2 * np.pi * np.cumsum(f(m) * (1 + det) * vib) / SR
        s += sum((1 / (h + 1)) ** 1.2 * np.sin((h + 1) * ph) for h in range(6))
    return vol * env * s / 5


def staccato(m, vol):
    tt = np.arange(int(0.22 * SR)) / SR
    ph = 2 * np.pi * f(m) * tt
    s = sum((1 / (h + 1)) ** 1.1 * np.sin((h + 1) * ph) for h in range(7))
    return vol * s * np.minimum(1, tt / 0.008) * np.exp(-tt * 14)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("uscita")
    ap.add_argument("--durata", type=float, default=25)
    ap.add_argument("--boom", type=float, nargs="*", default=[])
    ap.add_argument("--braam", type=float, nargs="*", default=[])
    ap.add_argument("--whoosh", type=float, nargs="*", default=[])
    ap.add_argument("--tagli", default="", help="inizio:fine:numero  (montaggio veloce)")
    ap.add_argument("--silenzio", default="", help="inizio:fine")
    ap.add_argument("--luce", type=float, default=None, help="momento del finale luminoso")
    a = ap.parse_args()
    D = a.durata
    mx = Mix(D)
    sil = tuple(map(float, a.silenzio.split(":"))) if a.silenzio else (D + 1, D + 2)
    primo = min(a.boom + a.braam) if (a.boom or a.braam) else 3.0

    # 1) drone di tensione + riser prima del primo colpo
    tt = np.arange(int(primo * SR)) / SR
    drone = sum(np.sin(2 * np.pi * f(m) * tt * (1 + d)) for m in (26, 38) for d in (-0.002, 0.002))
    drone *= np.minimum(1, tt / 1.5) * 0.12
    mx.put(drone, 0)
    riser = whoosh(primo, 1) * np.linspace(0.2, 1.4, int(primo * SR))
    mx.put(riser, 0, gain=0.6)
    for k in np.arange(0.8, primo - 0.2, 0.75):  # battito sordo
        mx.put(kick(0.4), k, gain=0.35)

    # 2) ostinato di archi (Re minore) dal primo colpo fino al silenzio
    prog = [(50, 53, 57), (46, 50, 53), (48, 52, 55), (45, 49, 52)]
    croma = 60 / 132 / 2
    t = primo
    i = 0
    while t < sil[0] - 0.05:
        ch = prog[(i // 16) % 4]
        cresc = min(1, 0.35 + (t - primo) / (sil[0] - primo))
        mx.put(staccato(ch[0] - 12 if i % 2 == 0 else ch[0], 0.16 * cresc), t, 0.45)
        if i % 16 == 0:
            for m in ch:
                mx.put(archi(m, croma * 16 + 0.5, 0.045 * cresc), t, rng.uniform(0.3, 0.7))
            mx.put(archi(ch[0] - 24, croma * 16 + 0.5, 0.06 * cresc), t, 0.5)
        t += croma
        i += 1

    # 3) montaggio veloce: cassa + whoosh su ogni stacco
    if a.tagli:
        t0, t1, n = a.tagli.split(":")
        for t in np.linspace(float(t0), float(t1), int(n), endpoint=False):
            mx.put(kick(), t, gain=0.7)
            mx.put(whoosh(0.35, -1), t - 0.12, pan=rng.uniform(0.2, 0.8), gain=0.7)

    for t in a.whoosh:
        mx.put(whoosh(0.9, 1), t - 0.6, gain=0.9)
        mx.put(kick(), t, gain=0.5)
    for t in a.braam:
        mx.put(braam(), t, gain=0.9)
    for t in a.boom:
        mx.put(boom(), t, gain=1.0)

    # 4) finale luminoso (Re maggiore, archi acuti + pianoforte che brilla)
    if a.luce:
        rest = D - a.luce
        for m in (50, 57, 62, 66, 69, 74, 78):
            mx.put(archi(m, rest, 0.05 if m > 60 else 0.07, att=0.3, rel=2.5), a.luce, rng.uniform(0.3, 0.7))
        for k, m in enumerate((74, 78, 81, 86, 81, 78)):
            tt = np.arange(int(3 * SR)) / SR
            p = sum((0.5 ** h) * np.sin(2 * np.pi * f(m) * (h + 1) * tt) * np.exp(-tt * (1.5 + h)) for h in range(5))
            mx.put(p * 0.08, a.luce + 0.3 + k * 0.28, rng.uniform(0.2, 0.8))

    x = np.stack([mx.L, mx.R], 1)
    # silenzio drammatico (lascia solo la coda del riverbero)
    s0, s1 = int(sil[0] * SR), int(sil[1] * SR)
    if s0 < len(x):
        x[s0:min(s1, len(x))] *= np.linspace(1, 0, min(s1, len(x)) - s0)[:, None] ** 4
    # riverbero da sala
    Lr = int(3.2 * SR)
    ir = rng.normal(0, 1, (Lr, 2)) * np.exp(-np.arange(Lr) / SR * 1.8)[:, None]
    ir[:int(.02 * SR)] = 0
    N = 1 << int(np.ceil(np.log2(len(x) + Lr)))
    wet = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], N) * np.fft.rfft(ir[:, c], N), N)[:len(x)] for c in (0, 1)], 1)
    wet /= np.abs(wet).max() / max(1e-9, np.abs(x).max())
    y = 0.75 * x + 0.45 * wet
    tt = np.arange(len(y)) / SR
    y *= np.clip((D - tt) / 1.2, 0, 1)[:, None]
    y = np.tanh(y / np.abs(y).max() * 1.6) / np.tanh(1.6)  # leggera saturazione "cinematografica"
    y *= 0.92
    w = wave.open(a.uscita, "wb")
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((y * 32767).astype("<i2").tobytes())
    w.close()
    print("ok", a.uscita)


if __name__ == "__main__":
    main()
