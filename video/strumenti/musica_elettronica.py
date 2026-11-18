#!/usr/bin/env python3
"""
musica_elettronica.py — base elettronica/tech originale (libera da diritti):
arpeggio di synth filtrato, pad, cassa 4/4 morbida, hi-hat, riser e colpo sul finale.

Uso: python3 musica_elettronica.py uscita.wav DURATA FINALE [--bpm 118]
  FINALE = secondo in cui arriva il logo (riser prima, colpo + accordo lungo dopo)
"""
import argparse
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(5)


def f(m):
    return 440 * 2 ** ((m - 69) / 12)


def lp(x, cut):
    """passa-basso a un polo; cut può essere un numero o un array (filtro che si apre)"""
    from scipy.signal import lfilter
    if np.isscalar(cut):
        a = np.exp(-2 * np.pi * cut / SR)
        return lfilter([1 - a], [1, -a], x)
    out = np.zeros_like(x); zi = np.zeros(1); blk = 1024
    for i in range(0, len(x), blk):
        a = np.exp(-2 * np.pi * float(np.mean(cut[i:i + blk])) / SR)
        out[i:i + blk], zi = lfilter([1 - a], [1, -a], x[i:i + blk], zi=zi)
    return out


def saw(fr, tt):
    return 2 * ((fr * tt) % 1.0) - 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("uscita")
    ap.add_argument("durata", type=float)
    ap.add_argument("finale", type=float)
    ap.add_argument("--bpm", type=float, default=118)
    a = ap.parse_args()
    D, F = a.durata, a.finale
    n = int(D * SR)
    L = np.zeros(n); R = np.zeros(n)

    def put(s, t, pan=0.5, g=1.0):
        i = int(t * SR)
        if i >= n:
            return
        j = min(n, i + len(s))
        L[i:j] += s[:j - i] * g * np.sqrt(1 - pan); R[i:j] += s[:j - i] * g * np.sqrt(pan)

    beat = 60 / a.bpm
    prog = [(45, 52, 57, 60), (41, 48, 53, 57), (43, 50, 55, 59), (40, 47, 52, 55)]  # Am F G Em
    bar = beat * 4
    # pad + basso
    t = 0.0; k = 0
    while t < D:
        ch = prog[k % 4]
        tt = np.arange(int((bar + 0.3) * SR)) / SR
        env = np.minimum(1, tt / 0.4) * np.clip((bar + 0.3 - tt) / 0.4, 0, 1)
        pad = sum(saw(f(m + 12) * (1 + d), tt) for m in ch[1:] for d in (-0.004, 0.004))
        pad = lp(pad, 900) * env * 0.035
        put(pad, t, 0.5)
        bass = lp(saw(f(ch[0] - 12), tt), 300) * env * 0.16
        put(bass, t, 0.5)
        # arpeggio a sedicesimi, il filtro si apre lungo il brano
        apertura = 600 + 3800 * min(1, t / max(1, F))
        for s in range(16):
            m = ch[[1, 2, 3, 2][s % 4]] + 12 * (1 + (s // 8))
            ts = np.arange(int(beat / 4 * SR * 0.95)) / SR
            note = lp(saw(f(m), ts) * np.exp(-ts * 14), apertura) * 0.07
            put(note, t + s * beat / 4, 0.3 + 0.4 * ((s % 3) / 2))
        t += bar; k += 1
    # ritmo (si ferma prima del finale per il riser)
    t = beat * 4
    while t < F - 0.05:
        tt = np.arange(int(0.35 * SR)) / SR
        kick = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 8)
        put(kick, t, 0.5, 0.55)
        hh = lp(rng.normal(0, 1, int(0.05 * SR)), 9000) - lp(rng.normal(0, 1, int(0.05 * SR)), 3000)
        put(hh * np.exp(-np.arange(len(hh)) / SR * 60) * 0.05, t + beat / 2, 0.6)
        t += beat
    # riser + colpo + accordo finale lungo
    rl = 2.0
    tt = np.arange(int(rl * SR)) / SR
    riser = lp(rng.normal(0, 1, len(tt)), 400 + 6000 * (tt / rl) ** 2) * (tt / rl) ** 2 * 0.25
    put(riser, F - rl, 0.5)
    tt = np.arange(int(3 * SR)) / SR
    boom = np.sin(2 * np.pi * np.cumsum(32 + 60 * np.exp(-tt * 6)) / SR) * np.exp(-tt * 1.5) * 0.8
    put(boom, F, 0.5)
    rest = D - F
    tt = np.arange(int(rest * SR)) / SR
    env = np.minimum(1, tt / 0.05) * np.clip((rest - tt) / 2.0, 0, 1)
    acc = sum(saw(f(m) * (1 + d), tt) for m in (57, 64, 69, 72, 76) for d in (-0.003, 0.003))
    put(lp(acc, 2500) * env * 0.03, F, 0.5)
    x = np.stack([L, R], 1)
    # riverbero leggero
    Lr = int(1.6 * SR)
    ir = rng.normal(0, 1, (Lr, 2)) * np.exp(-np.arange(Lr) / SR * 3.2)[:, None]
    N = 1 << int(np.ceil(np.log2(n + Lr)))
    wet = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], N) * np.fft.rfft(ir[:, c], N), N)[:n] for c in (0, 1)], 1)
    wet /= np.abs(wet).max() / max(1e-9, np.abs(x).max())
    y = 0.8 * x + 0.3 * wet
    tt = np.arange(n) / SR
    y *= (np.minimum(1, tt / 0.5) * np.clip((D - tt) / 1.5, 0, 1))[:, None]
    y = np.tanh(y / np.abs(y).max() * 1.4) / np.tanh(1.4) * 0.92
    w = wave.open(a.uscita, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((y * 32767).astype("<i2").tobytes()); w.close()
    print("ok", a.uscita)


if __name__ == "__main__":
    main()
