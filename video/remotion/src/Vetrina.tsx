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
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Bokeh, Grana, LuceCalda, Parola, PolvereDorata, Sottotitoli, Vignetta} from './Effetti';

/**
 * "Vetrina": il sito del cliente scorre sullo sfondo, i prodotti scontornati
 * scendono lentamente in primo piano con ombra, scritte eleganti, chiusura col logo.
 * Coordinate in 1080x1920; si esporta in 4K con --scale=2.
 */

export type Scena = {
  img: string; // PNG trasparente in public
  video?: string; // in alternativa: video con trasparenza (webm VP9 alpha)
  giro3d?: boolean; // rotazione 3D lenta con riflesso di luce
  ampiezza3d?: number; // 1 = giro ampio (prosciutto), 0.2 = oscillazione leggera
  larghezza: number; // px a 1080
  x: number; // bordo sinistro finale
  y: number; // bordo alto finale
  rotazione?: number; // gradi finali
  etichetta: string; // piccola, maiuscola, oro
  titolo: string; // grande, serif
  entrata?: 'alto' | 'destra' | 'dissolvenza';
  testo?: 'alto' | 'basso';
  durata: number; // secondi
};

export type VetrinaProps = {
  sfondo: string;
  scene: Scena[];
  sovrapposizione: number; // secondi di incrocio tra scene
  finale: {
    logo: string;
    riga1: string;
    riga2: string;
    motto: string;
    sito: string;
    slogan?: string;
    durata: number;
  };
  oro: string;
  effetti?: {
    polvere?: boolean; // polvere dorata
    bokeh?: boolean; // luci sfocate
    luci?: boolean; // lampo di luce calda a ogni cambio scena
    grana?: boolean; // grana pellicola
    vignetta?: boolean;
    scia?: boolean; // scia di movimento (più lento da esportare)
    sottotitoli?: Parola[];
  };
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Prodotto: React.FC<{s: Scena; oro: string}> = ({s, oro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tot = Math.round(s.durata * fps);

  // discesa lenta e morbida, poi deriva leggerissima, poi esce verso il basso
  const ingresso = spring({frame, fps, config: {damping: 200, mass: 3.2, stiffness: 28}});
  const uscita = interpolate(frame, [tot - 0.9 * fps, tot], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const deriva = interpolate(frame, [0, tot], [0, 1], clamp);

  const da =
    s.entrata === 'destra'
      ? {dx: 900, dy: -120}
      : s.entrata === 'dissolvenza'
        ? {dx: 0, dy: -90}
        : {dx: 0, dy: -1500};
  const esceADestra = s.entrata === 'destra';
  const tx = s.x + da.dx * (1 - ingresso) + (esceADestra ? 1300 * uscita : 0);
  const ty = s.y + da.dy * (1 - ingresso) + 40 * deriva + (esceADestra ? 0 : 1400 * uscita);
  const rot = (s.rotazione ?? 0) + (s.entrata === 'destra' ? 4 : -7) * (1 - ingresso) + 1.5 * deriva;
  const scala = 0.94 + 0.06 * ingresso + 0.05 * deriva;
  // chi entra di lato arriva già pieno (niente effetto fantasma)
  const opacita = (esceADestra ? 1 : Math.min(1, ingresso * 2.2)) * (1 - uscita * 0.6);
  // rotazione 3D: gira lentamente mostrando il profilo, poi torna frontale
  const amp = s.ampiezza3d ?? 1;
  const giroY =
    amp *
    interpolate(frame, [0, tot * 0.45, tot], [-38, 22, -6], {
      ...clamp,
      easing: Easing.inOut(Easing.sin),
    });
  const giroX = amp < 1 ? 4 * Math.sin((frame / fps) * 0.9) : 0;
  const riflesso = interpolate(frame, [0.8 * fps, 2.6 * fps], [-20, 130], clamp);

  // scritte
  const tEt = Math.round(0.6 * fps);
  const tTi = Math.round(0.9 * fps);
  const et = interpolate(frame, [tEt, tEt + 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const ti = interpolate(frame, [tTi, tTi + 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const viaTesto = interpolate(frame, [tot - 0.8 * fps, tot - 0.3 * fps], [1, 0], clamp);
  const linea = interpolate(frame, [tEt, tEt + 26], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: s.larghezza,
          transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scala})`,
          transformOrigin: '50% 50%',
          opacity: opacita,
          perspective: 1800,
          filter: 'drop-shadow(0 50px 45px rgba(0,0,0,0.6)) drop-shadow(0 10px 12px rgba(0,0,0,0.45))',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: s.giro3d ? `rotateY(${giroY}deg) rotateX(${giroX}deg)` : undefined,
            transformStyle: 'preserve-3d',
          }}
        >
          {s.video ? (
            <OffthreadVideo
              src={staticFile(s.video)}
              transparent
              muted
              style={{
                width: '100%',
                display: 'block',
                WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 14%)',
              }}
            />
          ) : (
            <Img src={staticFile(s.img)} style={{width: '100%', display: 'block'}} />
          )}
          {s.giro3d && !s.video ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                WebkitMaskImage: `url(${staticFile(s.img)})`,
                WebkitMaskSize: '100% 100%',
                background: `linear-gradient(100deg, transparent ${riflesso - 14}%, rgba(255,236,190,0.55) ${riflesso}%, transparent ${riflesso + 14}%)`,
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          ...(s.testo === 'alto' ? {top: 150} : {bottom: 440}),
          textAlign: 'center',
          opacity: viaTesto,
        }}
      >
        <div
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: 12 + 6 * (1 - et),
            color: oro,
            opacity: et,
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          {s.etichetta.toUpperCase()}
        </div>
        <div
          style={{
            margin: '22px auto 26px',
            height: 2,
            width: 160 * linea,
            background: oro,
            opacity: 0.9,
          }}
        />
        <div style={{overflow: 'hidden', padding: '0 60px'}}>
          <div
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              fontSize: 82,
              lineHeight: 1.08,
              color: '#FBF6EC',
              transform: `translateY(${(1 - ti) * 110}%)`,
              textShadow: '0 6px 28px rgba(0,0,0,0.75)',
            }}
          >
            {s.titolo}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Finale: React.FC<{f: VetrinaProps['finale']; oro: string}> = ({f, oro}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const fondo = interpolate(frame, [0, 18], [0, 1], clamp);
  const logo = spring({frame: frame - 8, fps, config: {damping: 200, mass: 1.6}});
  const r1 = interpolate(frame, [22, 40], [0, 1], clamp);
  const r2 = interpolate(frame, [30, 50], [0, 1], clamp);
  const motto = interpolate(frame, [48, 70], [0, 1], clamp);
  const sito = interpolate(frame, [64, 84], [0, 1], clamp);
  const slogan = interpolate(frame, [190, 215], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  // riflesso di luce che attraversa il logo
  const riflesso = interpolate(frame, [30, 62], [-60, 160], clamp);
  const nero = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], clamp);

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #2a1f17 0%, #140f0b 70%)',
          opacity: fondo,
        }}
      />
      <div style={{position: 'relative', textAlign: 'center', marginTop: -120}}>
        <div
          style={{
            position: 'relative',
            width: 340,
            height: 338,
            margin: '0 auto',
            opacity: logo,
            transform: `scale(${0.85 + 0.15 * logo}) translateY(${(1 - logo) * 40}px)`,
            WebkitMaskImage: `url(${staticFile(f.logo)})`,
            WebkitMaskSize: '100% 100%',
          }}
        >
          <Img src={staticFile(f.logo)} style={{width: '100%', height: '100%'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${riflesso - 18}%, rgba(255,245,215,0.85) ${riflesso}%, transparent ${riflesso + 18}%)`,
              mixBlendMode: 'screen',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 46,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: 44,
            paddingLeft: 44,
            color: oro,
            opacity: r1,
          }}
        >
          {f.riga1.toUpperCase()}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: 16 + 10 * (1 - r2),
            paddingLeft: 16,
            color: oro,
            opacity: r2,
          }}
        >
          {f.riga2.toUpperCase()}
        </div>
        <div
          style={{
            marginTop: 70,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 50,
            color: '#F3ECE0',
            opacity: motto,
            transform: `translateY(${(1 - motto) * 20}px)`,
            padding: '0 60px',
          }}
        >
          {f.motto}
        </div>
        <div
          style={{
            marginTop: 50,
            display: 'inline-block',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 40,
            letterSpacing: 2,
            color: oro,
            padding: '18px 44px',
            border: `2px solid ${oro}`,
            borderRadius: 999,
            opacity: sito,
          }}
        >
          {f.sito}
        </div>
        {f.slogan ? (
          <div
            style={{
              marginTop: 70,
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              fontSize: 64,
              lineHeight: 1.15,
              color: oro,
              padding: '0 70px',
              opacity: slogan,
              transform: `translateY(${(1 - slogan) * 30}px) scale(${0.96 + 0.04 * slogan})`,
              textShadow: '0 6px 30px rgba(0,0,0,0.6)',
              whiteSpace: 'pre-line',
            }}
          >
            {f.slogan.replace(/,\s*/, ',\n')}
          </div>
        ) : null}
      </div>
      <AbsoluteFill style={{background: 'black', opacity: nero}} />
    </AbsoluteFill>
  );
};

export const Vetrina: React.FC<VetrinaProps> = ({sfondo, scene, sovrapposizione, finale, oro, effetti = {}}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  let inizio = 0;
  const blocchi = scene.map((s) => {
    const da = inizio;
    inizio += Math.round((s.durata - sovrapposizione) * fps);
    return {s, da};
  });
  const inizioFinale = inizio;
  // luce calda che si muove lentamente sullo sfondo
  const lx = 30 + 40 * Math.sin(frame / 90);

  return (
    <AbsoluteFill style={{backgroundColor: '#140f0b'}}>
      <AbsoluteFill style={{perspective: 1400, overflow: 'hidden'}}>
        <AbsoluteFill
          style={{
            transform: `scale(1.32) rotateX(${12 - 7 * Math.min(1, frame / 600)}deg) rotateY(${4 * Math.sin(frame / 140)}deg) translateZ(0px)`,
            transformOrigin: '50% 60%',
          }}
        >
          <OffthreadVideo src={staticFile(sfondo)} muted style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${lx}% 35%, rgba(255,200,120,0.10) 0%, rgba(0,0,0,0) 45%),
             linear-gradient(180deg, rgba(10,7,5,0.82) 0%, rgba(10,7,5,0.45) 25%, rgba(10,7,5,0.45) 55%, rgba(10,7,5,0.9) 100%)`,
        }}
      />
      {effetti.bokeh ? <Bokeh /> : null}
      {blocchi.map(({s, da}, i) => (
        <Sequence key={i} from={da} durationInFrames={Math.round(s.durata * fps)} layout="none">
          {effetti.scia ? (
            <CameraMotionBlur samples={5} shutterAngle={160}>
              <Prodotto s={s} oro={oro} />
            </CameraMotionBlur>
          ) : (
            <Prodotto s={s} oro={oro} />
          )}
        </Sequence>
      ))}
      {effetti.luci
        ? [...blocchi.slice(1).map((b) => b.da), inizioFinale].map((da, i) => (
            <LuceCalda key={i} da={da - 6} durata={28} />
          ))
        : null}
      <Sequence from={inizioFinale} durationInFrames={Math.round(finale.durata * fps)} layout="none">
        <Finale f={finale} oro={oro} />
      </Sequence>
      {effetti.polvere ? <PolvereDorata /> : null}
      {effetti.sottotitoli ? <Sottotitoli parole={effetti.sottotitoli} colore={oro} /> : null}
      {effetti.vignetta ? <Vignetta /> : null}
      {effetti.grana ? <Grana /> : null}
    </AbsoluteFill>
  );
};

export const durataVetrina = (p: VetrinaProps) =>
  p.scene.reduce((t, s) => t + s.durata - p.sovrapposizione, 0) + p.finale.durata;
