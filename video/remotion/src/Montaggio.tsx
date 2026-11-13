import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';

/**
 * Montaggio — Reel con riprese VERE: i pezzi uno dopo l'altro (leggero zoom, stacchi puliti),
 * sottotitoli parola per parola (si legge anche senza audio), finale con logo.
 */
export type MontaggioProps = {
  pezzi: {src: string; durata: number}[];
  frasi: {inizio: number; fine: number; parole: {testo: string; inizio: number}[]}[];
  logo: string;
  finale: number; // secondo in cui parte il finale con il logo
  durata: number;
  invito?: string; // es. "Preventivo gratuito · link in bio"
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Pezzo: React.FC<{src: string; durata: number; fps: number}> = ({src, durata, fps}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, durata * fps], [1.0, 1.07], clamp);
  const entra = interpolate(f, [0, 5], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: entra}}>
      <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`}} />
    </AbsoluteFill>
  );
};

export const Montaggio: React.FC<MontaggioProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  let da = 0;
  const seq = p.pezzi.map((c, i) => {
    const from = Math.round(da * fps);
    da += c.durata;
    // l'ultimo pezzo resta fino alla fine (dietro al logo)
    const len = i === p.pezzi.length - 1 ? durationInFrames - from : Math.round(c.durata * fps) + 3;
    return (
      <Sequence key={i} from={from} durationInFrames={len}>
        <Pezzo src={c.src} durata={len / fps} fps={fps} />
      </Sequence>
    );
  });

  const frase = p.frasi.find((x) => t >= x.inizio - 0.1 && t <= x.fine + 0.35 && x.inizio < p.finale);
  const fin = interpolate(t, [p.finale, p.finale + 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const logoIn = interpolate(t, [p.finale + 0.3, p.finale + 1.1], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const chiudi = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {seq}
      {/* leggera vignettatura per leggere meglio */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)'}} />

      {/* sottotitoli parola per parola */}
      {frase ? (
        <div style={{position: 'absolute', left: 70, right: 70, top: 1390, textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 66, lineHeight: 1.18, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.85)'}}>
          {frase.parole.map((w, i) => {
            const on = t >= w.inizio - 0.05;
            const a = interpolate(t, [w.inizio - 0.05, w.inizio + 0.12], [0, 1], clamp);
            return (
              <span key={i} style={{display: 'inline-block', marginRight: 18, opacity: on ? 1 : 0, transform: `translateY(${(1 - a) * 18}px)`, color: i === frase.parole.length - 1 ? '#F2C14E' : '#fff'}}>
                {w.testo}
              </span>
            );
          })}
        </div>
      ) : null}

      {/* finale */}
      <AbsoluteFill style={{opacity: fin, background: 'radial-gradient(ellipse 80% 55% at 50% 45%, #f7f3ee 0%, #e9e3da 60%, #d6cfc4 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: logoIn, transform: `scale(${0.9 + 0.1 * logoIn})`}}>
        <Img src={staticFile(p.logo)} style={{width: 720}} />
        <div style={{marginTop: 40, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 40, letterSpacing: 10, color: '#171310'}}>LEDINFINITY.EU</div>
        {p.invito ? (
          <div style={{marginTop: 60, padding: '22px 46px', borderRadius: 60, background: '#F2C14E', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 40, color: '#171310'}}>{p.invito}</div>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: chiudi}} />
    </AbsoluteFill>
  );
};
