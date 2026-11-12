import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Smontabile, ease, useImmagini} from './Parata3D';
import {PolvereDorata} from './Effetti';

/**
 * Discesa3D — un prodotto scende piano piano mentre il sito scorre dietro, pagina dopo pagina.
 * A ogni fermata si smonta in pezzi e si rimonta; alla fine esce e i pezzi formano il logo.
 */
export type Discesa3DProps = {
  sfondo: string;
  prodotto: string;
  altezza: number;
  logo: string;
  fermate: number[]; // altezze (y) delle fermate, dall'alto in basso
  durata: number;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const DISCESA = 2.0; // secondi per scendere da una fermata alla successiva
const SPETTACOLO = 2.4; // secondi di smontaggio/rimontaggio a ogni fermata

const tempi = (n: number) => {
  // [arrivo alla fermata i]
  const a: number[] = [];
  let t = 0.4 + 2.6; // prima discesa dall'alto, più lunga
  for (let i = 0; i < n; i++) {
    a.push(t);
    t += SPETTACOLO + DISCESA;
  }
  return {arrivi: a, uscita: a[n - 1] + SPETTACOLO};
};

const Telecamera: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  camera.position.set(0.25 * Math.sin(t * 0.3), 1.0, 5.6);
  camera.lookAt(0, 1.0, 0);
  return null;
};

const Scena: React.FC<{p: Discesa3DProps; t: number; imgs: HTMLImageElement[]}> = ({p, t, imgs}) => {
  const {arrivi, uscita} = tempi(p.fermate.length);
  // posizione verticale: parte da sopra lo schermo, scende tra le fermate, poi esce in basso
  const ys = [3.9, ...p.fermate, -2.6];
  const partenze = [0.4, ...arrivi.map((a) => a + SPETTACOLO)];
  const arriviTutti = [...arrivi, uscita + 1.2];
  let y = ys[0];
  let espl = 0;
  for (let i = 0; i < ys.length - 1; i++) {
    const s = partenze[i];
    const e = arriviTutti[i];
    if (t >= s) y = ys[i] + (ys[i + 1] - ys[i]) * ease(THREE.MathUtils.clamp((t - s) / (e - s), 0, 1));
  }
  arrivi.forEach((a) => {
    const s = t - a;
    if (s >= 0 && s < SPETTACOLO) {
      espl = s < 0.55 ? ease(s / 0.55) : s < 1.3 ? 1 : s < 2.2 ? 1 - ease((s - 1.3) / 0.9) : 0;
    }
  });
  // gira lentamente su se stesso; durante la discesa oscilla come se fluttuasse
  const giro = Math.sin(t * 0.55) * 0.55;
  const oscilla = Math.sin(t * 1.3) * 0.05;
  const tLogo = uscita + 1.0;
  const eLogo = t < tLogo ? 1 : t < tLogo + 1.2 ? 1 - ease((t - tLogo) / 1.2) : 0;
  return (
    <>
      <Telecamera t={t} />
      {t < uscita + 1.4 ? (
        <group position={[0, y, 0]} rotation={[0, giro, oscilla]}>
          <Smontabile img={imgs[0]} altezza={p.altezza} cols={6} rows={8} esplosione={espl} t={t} seme={7} />
        </group>
      ) : null}
      {t > tLogo - 0.2 ? (
        <group position={[0, 1.1, 0.3]}>
          <Smontabile img={imgs[1]} altezza={0.4} cols={10} rows={3} esplosione={eLogo} t={t} spessore={false} seme={999} />
        </group>
      ) : null}
    </>
  );
};

export const Discesa3D: React.FC<Discesa3DProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const imgs = useImmagini([p.prodotto, p.logo]);
  const {arrivi, uscita} = tempi(p.fermate.length);
  const tLogo = uscita + 1.0;
  // lampo di luce a ogni rimontaggio
  const lampo = Math.max(0, ...arrivi.map((a) => Math.exp(-Math.abs(t - (a + 2.2)) * 7))) * 0.35;
  const apri = interpolate(frame, [0, 18], [1, 0], clamp);
  const chiudi = interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [0, 1], clamp);
  const bagliore = interpolate(t, [tLogo + 0.9, tLogo + 1.6, tLogo + 3], [0, 1, 0.55], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: '#05040a'}}>
      <AbsoluteFill style={{perspective: 1400, overflow: 'hidden'}}>
        <AbsoluteFill
          style={{
            transform: `scale(1.25) rotateX(${8 - 4 * Math.min(1, frame / 600)}deg) rotateY(${3 * Math.sin(frame / 160)}deg)`,
            transformOrigin: '50% 55%',
          }}
        >
          <OffthreadVideo src={staticFile(p.sfondo)} muted style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(5,4,10,0.42)'}} />
      <AbsoluteFill style={{background: '#05040a', opacity: interpolate(t, [tLogo - 0.6, tLogo + 0.8], [0, 0.82], clamp)}} />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 60% 22% at 50% 50%, rgba(212,166,74,0.45) 0%, rgba(212,166,74,0) 70%)',
          opacity: bagliore,
        }}
      />
      {imgs ? (
        <ThreeCanvas width={width} height={height} camera={{fov: 40, near: 0.1, far: 60, position: [0, 1, 5.6]}} gl={{antialias: true, alpha: true}}>
          <Scena p={p} t={t} imgs={imgs} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(255,226,170,0.9) 0%, rgba(255,226,170,0) 60%)', opacity: lampo, mixBlendMode: 'screen'}} />
      <PolvereDorata quante={45} intensita={0.7} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(apri, chiudi)}} />
    </AbsoluteFill>
  );
};
