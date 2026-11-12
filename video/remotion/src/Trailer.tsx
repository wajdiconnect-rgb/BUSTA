import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/400-italic.css';
import {Grana, PolvereDorata, Vignetta} from './Effetti';

/**
 * "Trailer": spot in stile trailer cinematografico.
 * Buio + frase → BOOM + luce che rivela il prodotto → scena lenta → montaggio veloce
 * → silenzio → logo con BRAAAM → slogan in due colpi.
 * Tutti i tempi sono in secondi (props), coordinate in 1080x1920 (export 4K con --scale=2).
 */

export type TrailerProps = {
  oro: string;
  apertura: {frase: string; fine: number}; // buio con frase
  rivela: {video: string; inizio: number; fine: number; grande: string; piccolo?: string; testoDa: number};
  scena: {video: string; inizio: number; fine: number; piccolo: string; grande: string; testoDa: number};
  montaggio: {inizio: number; fine: number; foto: {img: string; nome: string}[]; frase: string};
  finale: {
    inizio: number;
    logo: string;
    riga1: string;
    riga2: string;
    slogan1: string;
    slogan1Da: number;
    slogan2: string;
    slogan2Da: number;
    sito: string;
    sitoDa: number;
  };
  colpi: number[]; // momenti dei BOOM (lampo + tremolio)
  durata: number;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Bande: React.FC = () => (
  <>
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 150, background: '#000'}} />
    <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 150, background: '#000'}} />
  </>
);

/** testo che appare sfocato e con lettere larghe, poi si stringe e si mette a fuoco */
const TestoCinema: React.FC<{
  testo: string;
  da: number; // frame relativo
  dimensione: number;
  colore?: string;
  serif?: boolean;
  spaziatura?: number;
  durataIn?: number;
}> = ({testo, da, dimensione, colore = '#F5EFE4', serif = true, spaziatura = 6, durataIn = 22}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [da, da + durataIn], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        fontFamily: serif ? '"Playfair Display", Georgia, serif' : 'Montserrat, sans-serif',
        fontWeight: serif ? 600 : 800,
        fontSize: dimensione,
        lineHeight: 1.12,
        color: colore,
        letterSpacing: spaziatura + 14 * (1 - k),
        opacity: k,
        filter: `blur(${(1 - k) * 12}px)`,
        transform: `scale(${1.06 - 0.06 * k})`,
        textAlign: 'center',
        textShadow: '0 6px 40px rgba(0,0,0,0.85)',
        padding: '0 70px',
        whiteSpace: 'pre-line',
      }}
    >
      {testo}
    </div>
  );
};

const Rivela: React.FC<{p: TrailerProps['rivela']; oro: string}> = ({p, oro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tot = Math.round((p.fine - p.inizio) * fps);
  // fessura di luce che si apre dal centro
  const apri = interpolate(frame, [0, 0.9 * fps], [50, 0], {...clamp, easing: Easing.out(Easing.exp)});
  const linea = interpolate(frame, [0, 6, 0.9 * fps], [0, 1, 0], clamp);
  const via = interpolate(frame, [tot - 10, tot], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: via}}>
      <AbsoluteFill style={{clipPath: `inset(${apri}% 0 ${apri}% 0)`}}>
        <OffthreadVideo src={staticFile(p.video)} muted style={{width: '100%', height: '100%'}} />
        <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 45%)'}} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: 4,
          transform: `translateY(-2px) scaleY(${1 + 30 * (1 - apri / 50)})`,
          opacity: linea,
          background: `linear-gradient(90deg, transparent, ${oro}, #fff, ${oro}, transparent)`,
          boxShadow: `0 0 60px 20px rgba(255,210,140,0.8)`,
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 330}}>
        {p.piccolo ? (
          <TestoCinema testo={p.piccolo} da={(p.testoDa - p.inizio) * fps - 8} dimensione={30} colore={oro} serif={false} spaziatura={14} />
        ) : null}
        <TestoCinema testo={p.grande} da={(p.testoDa - p.inizio) * fps} dimensione={150} colore={oro} />
      </div>
    </AbsoluteFill>
  );
};

const Scena: React.FC<{p: TrailerProps['scena']; oro: string}> = ({p, oro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tot = Math.round((p.fine - p.inizio) * fps);
  const entra = interpolate(frame, [0, 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const via = interpolate(frame, [tot - 8, tot], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: Math.min(entra, via)}}>
      <AbsoluteFill style={{transform: `scale(${1.12 - 0.12 * entra})`, filter: `blur(${(1 - entra) * 10}px)`}}>
        <OffthreadVideo src={staticFile(p.video)} muted style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 42%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 300}}>
        <TestoCinema testo={p.piccolo} da={(p.testoDa - p.inizio) * fps} dimensione={34} colore={oro} serif={false} spaziatura={12} />
        <div style={{height: 18}} />
        <TestoCinema testo={p.grande} da={(p.testoDa - p.inizio) * fps + 50} dimensione={110} />
      </div>
    </AbsoluteFill>
  );
};

const Montaggio: React.FC<{p: TrailerProps['montaggio']; oro: string}> = ({p, oro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tot = (p.fine - p.inizio) * fps;
  const ogni = tot / p.foto.length;
  const i = Math.min(p.foto.length - 1, Math.floor(frame / ogni));
  const loc = frame - i * ogni;
  const zoom = interpolate(loc, [0, ogni], [1.12, 1.0], {easing: Easing.out(Easing.quad)});
  const flash = interpolate(loc, [0, 2.5], [0.35, 0], clamp);
  const dir = i % 2 === 0 ? 1 : -1;
  const fr = p.foto[i];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(1.3)`, filter: 'blur(28px) brightness(0.45)'}}>
        <Img src={staticFile(fr.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <Img
          src={staticFile(fr.img)}
          style={{
            width: 1080,
            transform: `scale(${zoom * 1.08}) translateX(${dir * (loc / ogni) * 30}px)`,
            boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 330,
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 800,
          fontSize: 44,
          letterSpacing: 10,
          color: oro,
          textShadow: '0 4px 24px rgba(0,0,0,0.9)',
        }}
      >
        {fr.nome.toUpperCase()}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 260,
          textAlign: 'center',
          fontFamily: '"Playfair Display", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 56,
          color: '#F5EFE4',
          textShadow: '0 4px 24px rgba(0,0,0,0.9)',
          opacity: interpolate(frame, [0, 10], [0, 1], clamp),
        }}
      >
        {p.frase}
      </div>
      <AbsoluteFill style={{background: '#FFF4E0', opacity: flash}} />
    </AbsoluteFill>
  );
};

const Finale: React.FC<{p: TrailerProps['finale']; oro: string}> = ({p, oro}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t0 = p.inizio * fps;
  const rel = (s: number) => s * fps - t0;
  const logo = interpolate(frame, [0, 40], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const riflesso = interpolate(frame, [20, 70], [-60, 160], clamp);
  const r1 = interpolate(frame, [26, 50], [0, 1], clamp);
  const sale = interpolate(frame, [rel(p.slogan1Da) - 10, rel(p.slogan1Da) + 10], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const sito = interpolate(frame, [rel(p.sitoDa), rel(p.sitoDa) + 20], [0, 1], clamp);
  // dentro la Sequence durationInFrames è già relativo al finale
  const nero = interpolate(frame, [durationInFrames - 18, durationInFrames - 2], [0, 1], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: '#050403'}}>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(120,85,40,0.35) 0%, rgba(0,0,0,0) 60%)', opacity: logo}}
      />
      <div style={{textAlign: 'center', transform: `translateY(${-220 * sale}px)`}}>
        <div
          style={{
            position: 'relative',
            width: 300,
            height: 298,
            margin: '0 auto',
            opacity: logo,
            transform: `scale(${1.25 - 0.25 * logo})`,
            filter: `blur(${(1 - logo) * 14}px) drop-shadow(0 0 ${30 * logo}px rgba(201,165,92,0.45))`,
            WebkitMaskImage: `url(${staticFile(p.logo)})`,
            WebkitMaskSize: '100% 100%',
          }}
        >
          <Img src={staticFile(p.logo)} style={{width: '100%', height: '100%'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${riflesso - 18}%, rgba(255,245,215,0.9) ${riflesso}%, transparent ${riflesso + 18}%)`,
              mixBlendMode: 'screen',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: 40,
            paddingLeft: 40,
            color: oro,
            opacity: r1,
          }}
        >
          {p.riga1.toUpperCase()}
        </div>
        <div
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: 70,
            letterSpacing: 16,
            paddingLeft: 16,
            color: oro,
            opacity: r1,
          }}
        >
          {p.riga2.toUpperCase()}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1080}}>
        <TestoCinema testo={p.slogan1} da={rel(p.slogan1Da)} dimensione={80} />
        <div style={{height: 20}} />
        <TestoCinema testo={p.slogan2} da={rel(p.slogan2Da)} dimensione={94} colore={oro} durataIn={10} />
        <div
          style={{
            marginTop: 60,
            textAlign: 'center',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 36,
            letterSpacing: 6,
            color: '#E9DFC9',
            opacity: sito,
          }}
        >
          {p.sito}
        </div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: nero}} />
    </AbsoluteFill>
  );
};

export const Trailer: React.FC<TrailerProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const F = (s: number) => Math.round(s * fps);

  // tremolio della camera e lampo sui colpi
  let scuoti = 0;
  let lampo = 0;
  for (const c of p.colpi) {
    if (t >= c) {
      const d = t - c;
      scuoti += 22 * Math.exp(-d * 7) * Math.sin(d * 70);
      lampo = Math.max(lampo, Math.exp(-d * 9));
    }
  }

  const ap = interpolate(frame, [F(0.3), F(1.0), F(p.apertura.fine) - 8, F(p.apertura.fine)], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translate(${scuoti * 0.6}px, ${scuoti}px)`}}>
        {/* 1. buio + frase */}
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: ap}}>
          <TestoCinema testo={p.apertura.frase} da={F(0.4)} dimensione={78} durataIn={40} />
        </AbsoluteFill>
        {/* 2. BOOM: la luce rivela il prodotto */}
        <Sequence from={F(p.rivela.inizio)} durationInFrames={F(p.rivela.fine - p.rivela.inizio)} layout="none">
          <Rivela p={p.rivela} oro={p.oro} />
        </Sequence>
        {/* 3. scena lenta */}
        <Sequence from={F(p.scena.inizio)} durationInFrames={F(p.scena.fine - p.scena.inizio)} layout="none">
          <Scena p={p.scena} oro={p.oro} />
        </Sequence>
        {/* 4. montaggio veloce */}
        <Sequence from={F(p.montaggio.inizio)} durationInFrames={F(p.montaggio.fine - p.montaggio.inizio)} layout="none">
          <Montaggio p={p.montaggio} oro={p.oro} />
        </Sequence>
        {/* 5. silenzio (nero) → 6. finale */}
        <Sequence from={F(p.finale.inizio)} layout="none">
          <Finale p={p.finale} oro={p.oro} />
        </Sequence>
      </AbsoluteFill>
      <PolvereDorata quante={55} intensita={0.8} />
      <Vignetta forza={0.6} />
      <Grana intensita={0.07} />
      <AbsoluteFill style={{background: '#FFE9C4', opacity: lampo * 0.6, mixBlendMode: 'screen'}} />
      <Bande />
    </AbsoluteFill>
  );
};
