import React from 'react';
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '@fontsource/anton/400.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';

export type SpotProps = {
  video: string; // file nella cartella public del lavoro
  durata: number; // secondi
  titolo: string;
  sottotitolo: string;
  cta: string;
  marchio: string;
  colore: string;
};


const Parole: React.FC<{testo: string; inizio: number; colore: string}> = ({
  testo,
  inizio,
  colore,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const parole = testo.split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 26px',
        padding: '0 70px',
      }}
    >
      {parole.map((p, i) => {
        const s = spring({
          frame: frame - inizio - i * 4,
          fps,
          config: {damping: 12, stiffness: 140, mass: 0.6},
        });
        return (
          <span
            key={i}
            style={{
              fontFamily: 'Anton, Impact, sans-serif',
              fontSize: 132,
              lineHeight: 1.05,
              textTransform: 'uppercase',
              color: i === parole.length - 1 ? colore : 'white',
              display: 'inline-block',
              transform: `translateY(${(1 - s) * 90}px) scale(${0.6 + 0.4 * s})`,
              opacity: Math.min(1, s * 1.4),
              textShadow: '0 8px 30px rgba(0,0,0,0.55)',
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
};

export const Spot: React.FC<SpotProps> = ({
  video,
  titolo,
  sottotitolo,
  cta,
  marchio,
  colore,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const inizioTitolo = Math.round(0.4 * fps);
  const inizioSotto = inizioTitolo + Math.round(0.9 * fps);
  const inizioCta = Math.max(inizioSotto + fps, durationInFrames - Math.round(3.2 * fps));

  // il titolo esce prima che arrivi la CTA
  const uscitaTitolo = interpolate(
    frame,
    [inizioCta - 12, inizioCta],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const sotto = interpolate(frame, [inizioSotto, inizioSotto + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const ctaIn = spring({frame: frame - inizioCta, fps, config: {damping: 14}});
  const pulsa = 1 + 0.04 * Math.sin(((frame - inizioCta) / fps) * Math.PI * 2.2);

  const marchioIn = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
  const dissolvenzaFinale = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames - 1],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo src={staticFile(video)} muted />

      {/* sfumature per leggibilità del testo */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {marchio ? (
        <div
          style={{
            position: 'absolute',
            top: 120,
            width: '100%',
            textAlign: 'center',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            letterSpacing: 14,
            fontSize: 40,
            color: 'white',
            opacity: marchioIn * 0.92,
          }}
        >
          {marchio.toUpperCase()}
        </div>
      ) : null}

      {/* titolo: zona alta, fuori dall'interfaccia di TikTok/Reels */}
      <div style={{position: 'absolute', top: 260, width: '100%', opacity: uscitaTitolo}}>
        <Parole testo={titolo} inizio={inizioTitolo} colore={colore} />
        {sottotitolo ? (
          <div
            style={{
              marginTop: 28,
              textAlign: 'center',
              padding: '0 90px',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: 50,
              color: 'white',
              opacity: sotto,
              transform: `translateY(${(1 - sotto) * 30}px)`,
              textShadow: '0 4px 18px rgba(0,0,0,0.6)',
            }}
          >
            {sottotitolo}
          </div>
        ) : null}
      </div>

      {/* CTA: sopra la fascia bassa coperta da descrizione e pulsanti */}
      {cta ? (
        <div
          style={{
            position: 'absolute',
            bottom: 430,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            opacity: Math.min(1, ctaIn * 1.5),
            transform: `translateY(${(1 - ctaIn) * 120}px) scale(${pulsa})`,
          }}
        >
          <div
            style={{
              background: colore,
              color: '#111',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: 58,
              padding: '28px 64px',
              borderRadius: 999,
              boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {cta}
          </div>
        </div>
      ) : null}

      <AbsoluteFill style={{backgroundColor: 'black', opacity: dissolvenzaFinale}} />
    </AbsoluteFill>
  );
};
