import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/400-italic.css';
import {Bokeh, Grana, PolvereDorata, Vignetta} from './Effetti';

/**
 * "Sinfonia": tutto in PNG scontornati sopra il sito che scorre in 3D.
 * Logo d'oro 3D che gira → prosciutto lucido con grissini in orbita →
 * fette che danzano a tempo → chef → logo + slogan.
 * Tempi in secondi; `battuta` = durata di un battito della musica (per sincronizzare).
 */
export type SinfoniaProps = {
  oro: string;
  sfondo: string;
  logo: string;
  battuta: number;
  durata: number;
  intro: {fine: number; riga1: string; riga2: string};
  prosciutto: {img: string; grissini: string; inizio: number; fine: number; piccolo: string; grande: string};
  fette: {img: string; inizio: number; fine: number; piccolo: string; grande: string};
  chef: {img: string; inizio: number; fine: number; piccolo: string; grande: string};
  finale: {inizio: number; riga1: string; riga2: string; motto: string; slogan: string; sloganDa: number; sito: string};
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Logo d'oro con spessore (strati sovrapposti in 3D) che ruota sull'asse verticale. */
const Logo3D: React.FC<{src: string; size: number; giro: number; luce: number}> = ({src, size, giro, luce}) => {
  const strati = 18;
  return (
    <div style={{perspective: 1600, width: size, height: size}}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          transform: `rotateY(${giro}deg)`,
        }}
      >
        {new Array(strati).fill(0).map((_, i) => (
          <Img
            key={i}
            src={staticFile(src)}
            style={{
              position: 'absolute',
              inset: 0,
              width: size,
              height: size,
              transform: `translateZ(${(i - strati / 2) * 1.6}px)`,
              filter: i === strati - 1 || i === 0 ? 'none' : `brightness(${0.45 + 0.25 * Math.sin((i / strati) * Math.PI)})`,
            }}
          />
        ))}
        {/* riflesso di luce sulla faccia anteriore */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateZ(${(strati / 2) * 1.6 + 0.5}px)`,
            WebkitMaskImage: `url(${staticFile(src)})`,
            WebkitMaskSize: '100% 100%',
            background: `linear-gradient(105deg, transparent ${luce - 16}%, rgba(255,247,220,0.95) ${luce}%, transparent ${luce + 16}%)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>
    </div>
  );
};

/** Immagine PNG con riflesso lucido che scorre (effetto "unto/lucido" del salume). */
const Lucido: React.FC<{src: string; width: number; t: number; forza?: number; style?: React.CSSProperties}> = ({
  src,
  width,
  t,
  forza = 0.5,
  style,
}) => {
  const pos = ((t * 0.32) % 1.5) * 100 - 25;
  return (
    <div style={{position: 'relative', width, ...style}}>
      <Img src={staticFile(src)} style={{width: '100%', display: 'block'}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: `url(${staticFile(src)})`,
          WebkitMaskSize: '100% 100%',
          background: `linear-gradient(115deg, transparent ${pos - 10}%, rgba(255,255,255,${forza}) ${pos}%, transparent ${pos + 10}%)`,
          mixBlendMode: 'soft-light',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: `url(${staticFile(src)})`,
          WebkitMaskSize: '100% 100%',
          background: `radial-gradient(ellipse 30% 18% at ${pos}% 35%, rgba(255,250,240,${forza * 0.55}) 0%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

const Titolo: React.FC<{piccolo: string; grande: string; da: number; via: number; oro: string; alto?: boolean}> = ({
  piccolo,
  grande,
  da,
  via,
  oro,
  alto,
}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [da, da + 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const b = interpolate(frame, [da + 8, da + 30], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const v = interpolate(frame, [via - 12, via], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, ...(alto ? {top: 170} : {bottom: 400}), textAlign: 'center', opacity: v}}>
      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: 12 + 8 * (1 - a),
          color: oro,
          opacity: a,
          textShadow: '0 2px 14px rgba(0,0,0,0.9)',
        }}
      >
        {piccolo.toUpperCase()}
      </div>
      <div style={{margin: '18px auto 20px', height: 2, width: 170 * a, background: oro}} />
      <div
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 600,
          fontSize: 84,
          lineHeight: 1.08,
          color: '#FBF6EC',
          opacity: b,
          filter: `blur(${(1 - b) * 8}px)`,
          transform: `translateY(${(1 - b) * 30}px)`,
          textShadow: '0 6px 30px rgba(0,0,0,0.85)',
          padding: '0 60px',
        }}
      >
        {grande}
      </div>
    </div>
  );
};

const Intro: React.FC<{p: SinfoniaProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fine = p.intro.fine * fps;
  // gira veloce e rallenta fino a fermarsi frontale (2 giri)
  const k = interpolate(frame, [0, fine * 0.75], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const giro = 720 * (1 - k) + 0;
  const entra = spring({frame, fps, config: {damping: 200, mass: 1.2}});
  const luce = interpolate(frame, [fine * 0.7, fine * 0.95], [-30, 140], clamp);
  const testo = interpolate(frame, [fine * 0.7, fine * 0.85], [0, 1], clamp);
  const via = interpolate(frame, [fine - 10, fine], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - via}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #241a12 0%, #070504 70%)'}} />
      <div style={{transform: `scale(${(0.6 + 0.4 * entra) * (1 + 0.5 * via)}) translateY(${-60}px)`}}>
        <Logo3D src={p.logo} size={420} giro={giro} luce={luce} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1190, textAlign: 'center', opacity: testo}}>
        <div style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: 32, letterSpacing: 40, paddingLeft: 40, color: p.oro}}>
          {p.intro.riga1.toUpperCase()}
        </div>
        <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 76, letterSpacing: 16, paddingLeft: 16, color: p.oro}}>
          {p.intro.riga2.toUpperCase()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ProsciuttoOrbita: React.FC<{p: SinfoniaProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tot = (p.prosciutto.fine - p.prosciutto.inizio) * fps;
  const t = frame / fps;
  const scende = spring({frame, fps, config: {damping: 200, mass: 2.6, stiffness: 30}});
  const esce = interpolate(frame, [tot - 18, tot], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const W = 820;
  const cx = 540;
  const cy = 1030;
  // orbita dei grissini: un giro ogni 4 battute
  const giro = (t / (p.battuta * 4)) * Math.PI * 2;
  const grissino = (fase: number, specchio: boolean) => {
    const th = giro + fase;
    const z = Math.sin(th); // >0 davanti
    const x = cx + Math.cos(th) * 470;
    const y = cy + 120 + Math.sin(th) * 140 - 40 * Math.cos(th * 2);
    const sc = 0.85 + 0.3 * z;
    const ang = (Math.atan2(Math.cos(th) * 140, -Math.sin(th) * 430) * 180) / Math.PI;
    return {
      z,
      el: (
        <div
          key={fase}
          style={{
            position: 'absolute',
            left: x - 280,
            top: y - 100,
            width: 560,
            transform: `scale(${sc}) rotate(${ang * 0.3 + (specchio ? 25 : -15)}deg) scaleX(${specchio ? -1 : 1})`,
            filter: `brightness(${0.75 + 0.3 * (z + 1) / 2}) drop-shadow(0 20px 22px rgba(0,0,0,0.55))`,
            opacity: Math.min(1, scende * 1.5) * (1 - esce),
          }}
        >
          <Lucido src={p.prosciutto.grissini} width={560} t={t + fase} forza={0.35} />
        </div>
      ),
    };
  };
  const g = [grissino(0, false), grissino(Math.PI, true)];
  const dietro = g.filter((q) => q.z <= 0).map((q) => q.el);
  const davanti = g.filter((q) => q.z > 0).map((q) => q.el);
  const respiro = 1 + 0.015 * Math.sin((t / p.battuta) * Math.PI);
  return (
    <AbsoluteFill>
      {dietro}
      <div
        style={{
          position: 'absolute',
          left: cx - W / 2,
          top: cy - 500,
          transform: `translateY(${-1300 * (1 - scende) + 1400 * esce}px) rotate(${-6 * (1 - scende) + 1.5 * Math.sin(t * 0.8)}deg) scale(${respiro})`,
          filter: 'drop-shadow(0 50px 50px rgba(0,0,0,0.65)) drop-shadow(0 10px 14px rgba(0,0,0,0.5))',
          perspective: 1600,
        }}
      >
        <div style={{transform: `rotateY(${18 * Math.sin(t * 0.6)}deg)`}}>
          <Lucido src={p.prosciutto.img} width={W} t={t} forza={0.55} />
        </div>
      </div>
      {davanti}
      <Titolo piccolo={p.prosciutto.piccolo} grande={p.prosciutto.grande} da={0.8 * fps} via={tot} oro={p.oro} alto />
    </AbsoluteFill>
  );
};

const FetteDanzanti: React.FC<{p: SinfoniaProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tot = (p.fette.fine - p.fette.inizio) * fps;
  const t = frame / fps;
  const n = 5;
  const via = interpolate(frame, [tot - 15, tot], [0, 1], clamp);
  return (
    <AbsoluteFill style={{perspective: 1400}}>
      {new Array(n).fill(0).map((_, i) => {
        const ritardo = i * 0.22;
        const e = spring({frame: frame - ritardo * fps, fps, config: {damping: 14, mass: 1.1, stiffness: 60}});
        // ogni fetta "suona" sul suo battito: piccolo salto sincronizzato
        const fase = ((t - ritardo) / p.battuta) % 1;
        const salto = Math.exp(-fase * 6) * 26;
        const ang = (i / n) * Math.PI * 2 + t * 0.55;
        const r = 260 + 90 * Math.sin(t * 0.7 + i * 1.9);
        const x = 540 + Math.cos(ang) * r * e;
        const y = 1020 + Math.sin(ang) * r * 1.1 * e - salto + 60 * Math.sin(t * 0.8 + i);
        const size = 560 - i * 40;
        const rotX = 25 * Math.sin(t * 1.3 + i);
        const rotY = 35 * Math.sin(t * 0.9 + i * 1.7);
        const rotZ = 20 * Math.sin(t * 0.6 + i) + i * 30;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${0.4 + 0.6 * e})`,
              opacity: Math.min(1, e * 1.4) * (1 - via),
              filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.55))',
            }}
          >
            <Lucido src={p.fette.img} width={size} t={t + i * 0.7} forza={0.6} />
          </div>
        );
      })}
      <Titolo piccolo={p.fette.piccolo} grande={p.fette.grande} da={0.6 * fps} via={tot} oro={p.oro} alto />
    </AbsoluteFill>
  );
};

const Chef: React.FC<{p: SinfoniaProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tot = (p.chef.fine - p.chef.inizio) * fps;
  const t = frame / fps;
  const entra = spring({frame, fps, config: {damping: 200, mass: 2, stiffness: 35}});
  const esce = interpolate(frame, [tot - 15, tot], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const W = 1280;
  return (
    <AbsoluteFill style={{perspective: 1800}}>
      <div
        style={{
          position: 'absolute',
          left: 1080 - W + 120 + 900 * (1 - entra) + 1200 * esce,
          top: 420,
          width: W,
          transform: `rotateY(${-10 * (1 - entra) + 4 * Math.sin(t * 0.7)}deg) scale(${1.02 + 0.03 * Math.sin(t * 0.5)})`,
          filter: 'drop-shadow(-30px 40px 50px rgba(0,0,0,0.6))',
          WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 100%)',
        }}
      >
        <Lucido src={p.chef.img} width={W} t={t} forza={0.25} />
      </div>
      <Titolo piccolo={p.chef.piccolo} grande={p.chef.grande} da={0.6 * fps} via={tot} oro={p.oro} alto />
    </AbsoluteFill>
  );
};

const Finale: React.FC<{p: SinfoniaProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const f = p.finale;
  const fondo = interpolate(frame, [0, 20], [0, 1], clamp);
  const k = interpolate(frame, [0, 2.2 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const giro = 540 * (1 - k);
  const luce = interpolate(frame, [2 * fps, 2.8 * fps], [-30, 140], clamp);
  const r1 = interpolate(frame, [1.6 * fps, 2.2 * fps], [0, 1], clamp);
  const motto = interpolate(frame, [2.4 * fps, 3 * fps], [0, 1], clamp);
  const sDa = (f.sloganDa - f.inizio) * fps;
  const slogan = interpolate(frame, [sDa, sDa + 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const sito = interpolate(frame, [sDa + 30, sDa + 50], [0, 1], clamp);
  const nero = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [0, 1], clamp);
  const riga = (top: number, style: React.CSSProperties, children: React.ReactNode) => (
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', ...style}}>{children}</div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #2a1f17 0%, #0d0907 75%)', opacity: fondo}} />
      <div style={{position: 'absolute', top: 330, left: 540 - 165}}>
        <Logo3D src={p.logo} size={330} giro={giro} luce={luce} />
      </div>
      {riga(700, {fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 32, letterSpacing: 42, paddingLeft: 42, color: p.oro, opacity: r1}, f.riga1.toUpperCase())}
      {riga(745, {fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 74, letterSpacing: 16, paddingLeft: 16, color: p.oro, opacity: r1}, f.riga2.toUpperCase())}
      {riga(890, {fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: 46, color: '#F3ECE0', opacity: motto, padding: '0 60px'}, f.motto)}
      {riga(
        1020,
        {
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 600,
          fontSize: 72,
          lineHeight: 1.15,
          color: p.oro,
          opacity: slogan,
          filter: `blur(${(1 - slogan) * 8}px)`,
          whiteSpace: 'pre-line',
          padding: '0 60px',
          textShadow: '0 6px 30px rgba(0,0,0,0.6)',
        },
        f.slogan.replace(/,\s*/, ',\n'),
      )}
      {riga(
        1260,
        {opacity: sito},
        <span
          style={{
            display: 'inline-block',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 38,
            color: p.oro,
            padding: '16px 42px',
            border: `2px solid ${p.oro}`,
            borderRadius: 999,
          }}
        >
          {f.sito}
        </span>,
      )}
      <AbsoluteFill style={{background: '#000', opacity: nero}} />
    </AbsoluteFill>
  );
};

export const Sinfonia: React.FC<SinfoniaProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{background: '#0d0907'}}>
      <AbsoluteFill style={{perspective: 1400, overflow: 'hidden'}}>
        <AbsoluteFill
          style={{
            transform: `scale(1.32) rotateX(${12 - 7 * Math.min(1, frame / 600)}deg) rotateY(${4 * Math.sin(frame / 140)}deg)`,
            transformOrigin: '50% 60%',
          }}
        >
          <OffthreadVideo src={staticFile(p.sfondo)} muted style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(10,7,5,0.85) 0%, rgba(10,7,5,0.5) 25%, rgba(10,7,5,0.5) 60%, rgba(10,7,5,0.9) 100%)',
        }}
      />
      <Bokeh />
      <Sequence from={0} durationInFrames={F(p.intro.fine)} layout="none">
        <Intro p={p} />
      </Sequence>
      <Sequence from={F(p.prosciutto.inizio)} durationInFrames={F(p.prosciutto.fine - p.prosciutto.inizio)} layout="none">
        <ProsciuttoOrbita p={p} />
      </Sequence>
      <Sequence from={F(p.fette.inizio)} durationInFrames={F(p.fette.fine - p.fette.inizio)} layout="none">
        <FetteDanzanti p={p} />
      </Sequence>
      <Sequence from={F(p.chef.inizio)} durationInFrames={F(p.chef.fine - p.chef.inizio)} layout="none">
        <Chef p={p} />
      </Sequence>
      <Sequence from={F(p.finale.inizio)} layout="none">
        <Finale p={p} />
      </Sequence>
      <PolvereDorata quante={60} />
      <Vignetta forza={0.5} />
      <Grana intensita={0.05} />
    </AbsoluteFill>
  );
};
