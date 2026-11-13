import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Smontabile, ease, useImmagini} from './Parata3D';
import {PolvereDorata} from './Effetti';

/**
 * SitoTocco — "tocca e scopri": il sito scorre fino al carosello prodotti, un dito tocca il
 * prodotto, il prodotto esce dalla pagina in 3D, si smonta, si rimonta e si accende,
 * torna nella scheda e il carosello passa al prodotto successivo. Finale con il logo.
 * Misure del sito in pixel CSS (larghezza 432); il video è 1080 di larghezza (×2.5).
 */
export type SchedaTocco = {
  card: string; // screenshot della scheda
  prodotto: string; // PNG del prodotto (alta risoluzione)
  img: {x: number; y: number; w: number; h: number}; // posizione dell'immagine nella scheda (CSS px)
};
export type SitoToccoProps = {
  alto: {src: string; h: number}[]; // pezzi della pagina sopra il carosello (altezza in CSS px)
  sfondoBanda: string; // colore dietro le schede
  bandaY: number; // y del carosello nella pagina (CSS px)
  cardW: number;
  cardH: number;
  passoCard: number; // distanza tra le schede (CSS px)
  schede: SchedaTocco[];
  logo: string;
  durata: number;
};

const K = 2.5; // CSS px -> px del video
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const T_SCROLL = 3.0;
const CICLO = 4.1;
const U = (2 * 5 * Math.tan((20 * Math.PI) / 180)) / 1920; // px del video -> unità 3D (camera a z=5, fov 40)

const fasi = (s: number) => {
  // s = secondi dall'inizio del ciclo del prodotto
  const tocco = interpolate(s, [0, 0.35], [0, 1], clamp);
  const fuori = ease(THREE.MathUtils.clamp((s - 0.35) / 0.65, 0, 1)); // esce verso il centro
  const espl = s < 1.0 ? 0 : s < 1.45 ? ease((s - 1.0) / 0.45) : s < 1.8 ? 1 : s < 2.5 ? 1 - ease((s - 1.8) / 0.7) : 0;
  const luce = s < 1.8 ? 0.35 : s < 2.6 ? 0.35 + 0.65 * ease((s - 1.8) / 0.8) : 1;
  const rientro = ease(THREE.MathUtils.clamp((s - 2.9) / 0.6, 0, 1));
  const scorri = ease(THREE.MathUtils.clamp((s - 3.5) / 0.6, 0, 1));
  return {tocco, fuori: fuori * (1 - rientro), espl, luce, scorri, rientro};
};

const Telecamera: React.FC = () => {
  const {camera} = useThree();
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  return null;
};

const Prodotto3D: React.FC<{
  img: HTMLImageElement;
  rect: {cx: number; cy: number; h: number}; // nel video (px)
  f: ReturnType<typeof fasi>;
  t: number;
  k: number;
}> = ({img, rect, f, t, k}) => {
  if (f.fuori <= 0.001) return null;
  const da = new THREE.Vector3((rect.cx - 540) * U, (960 - rect.cy) * U, 0);
  const a = new THREE.Vector3(0, 0.15, 1.3);
  const pos = da.clone().lerp(a, f.fuori);
  const altezzaBase = rect.h * U;
  const scala = 1 + (1.15 / altezzaBase - 1) * f.fuori; // al centro alto ~1.15 unità
  const giro = Math.sin(t * 0.9 + k) * 0.5 * f.fuori;
  return (
    <group position={pos} scale={[scala, scala, scala]} rotation={[0, giro, 0]}>
      <Smontabile img={img} altezza={altezzaBase} cols={6} rows={7} esplosione={f.espl} t={t} seme={k * 31} luce={f.luce} />
    </group>
  );
};

export const SitoTocco: React.FC<SitoToccoProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const n = p.schede.length;
  const imgs = useImmagini([...p.schede.map((s) => s.prodotto), p.logo]);

  // indice del prodotto e fasi
  const tc = t - T_SCROLL;
  const k = THREE.MathUtils.clamp(Math.floor(tc / CICLO), 0, n - 1);
  const f = tc >= 0 && tc < n * CICLO ? fasi(tc - k * CICLO) : fasi(-1);
  const tFine = T_SCROLL + n * CICLO - 0.6;

  // scorrimento verticale della pagina fino al carosello
  const altoTot = p.alto.reduce((a, b) => a + b.h, 0);
  const bandaTop = p.bandaY * K;
  const yTarget = bandaTop + 40 - 140; // la scheda parte poco sotto il bordo alto
  const scrollY = interpolate(t, [0.3, T_SCROLL], [0, yTarget], {...clamp, easing: Easing.inOut(Easing.cubic)}) +
    interpolate(t, [tFine, tFine + 1.5], [0, 600], {...clamp, easing: Easing.inOut(Easing.cubic)});

  // posizione orizzontale del carosello: scheda k centrata, scorre alla k+1
  const offsetCard = k + (k < n - 1 ? f.scorri : 0);
  const cardW = p.cardW * K;
  const cardLeft0 = (1080 - cardW) / 2;
  const cardTopScreen = bandaTop + 40 - scrollY;

  const s = p.schede[k];
  const rect = {
    cx: cardLeft0 + (s.img.x + s.img.w / 2) * K,
    cy: cardTopScreen + (s.img.y + s.img.h / 2) * K,
    h: s.img.h * K,
  };

  // logo finale
  const eLogo = t < tFine + 0.6 ? 1 : t < tFine + 1.8 ? 1 - ease((t - tFine - 0.6) / 1.2) : 0;
  const scuro = interpolate(t, [tFine, tFine + 1.0], [0, 0.85], clamp);
  const lampo = tc >= 0 ? Math.exp(-Math.abs(tc - k * CICLO - 2.55) * 6) * 0.45 : 0;
  const apri = interpolate(frame, [0, 15], [1, 0], clamp);
  const chiudi = interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: '#efe6d6', overflow: 'hidden'}}>
      {/* pagina: parte alta + banda del carosello */}
      <div style={{position: 'absolute', left: 0, top: -scrollY, width: 1080}}>
        {p.alto.map((a, i) => (
          <Img key={i} src={staticFile(a.src)} style={{display: 'block', width: 1080, height: a.h * K}} />
        ))}
        <div style={{position: 'relative', width: 1080, height: (p.cardH + 120) * K, background: p.sfondoBanda}}>
          {p.schede.map((sc, j) => {
            const x = cardLeft0 + (j - offsetCard) * p.passoCard * K;
            if (x < -cardW - 50 || x > 1130) return null;
            const attiva = j === k;
            const nascondi = attiva ? Math.min(1, f.fuori * 3) : 0;
            return (
              <div key={j} style={{position: 'absolute', left: x, top: (bandaTop - altoTot * K + 40) > 0 ? 40 : 40, width: cardW}}>
                <Img src={staticFile(sc.card)} style={{width: cardW, display: 'block', borderRadius: 18}} />
                {/* mentre il prodotto è fuori, il suo posto nella scheda resta vuoto */}
                <div
                  style={{
                    position: 'absolute',
                    left: (sc.img.x - 10) * K,
                    top: (sc.img.y - 10) * K,
                    width: (sc.img.w + 20) * K,
                    height: (sc.img.h + 20) * K,
                    background: 'radial-gradient(ellipse at 50% 50%, #ece2d2 55%, rgba(236,226,210,0) 72%)',
                    opacity: nascondi,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* velo scuro quando il prodotto è fuori: tutta l'attenzione su di lui */}
      <AbsoluteFill style={{background: 'rgba(8,6,4,0.62)', opacity: f.fuori}} />
      <AbsoluteFill style={{background: '#05040a', opacity: scuro}} />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 55% 30% at 50% 47%, rgba(212,166,74,0.35) 0%, rgba(212,166,74,0) 70%)',
          opacity: Math.max(f.fuori * f.luce, interpolate(t, [tFine + 1.2, tFine + 2], [0, 1], clamp)),
        }}
      />

      {imgs ? (
        <ThreeCanvas width={width} height={height} camera={{fov: 40, near: 0.1, far: 50, position: [0, 0, 5]}} gl={{antialias: true, alpha: true}}>
          <Telecamera />
          {tc >= 0 && t < tFine ? <Prodotto3D img={imgs[k]} rect={rect} f={f} t={t} k={k} /> : null}
          {t > tFine + 0.4 ? (
            <group position={[0, 0.1, 0.5]}>
              <Smontabile img={imgs[n]} altezza={0.32} cols={10} rows={3} esplosione={eLogo} t={t} spessore={false} seme={999} />
            </group>
          ) : null}
        </ThreeCanvas>
      ) : null}

      {/* il dito che tocca */}
      {tc >= 0 && t < tFine && f.tocco > 0 && f.tocco < 1 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: rect.cx - 55,
              top: rect.cy - 55,
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.55)',
              border: '4px solid rgba(255,255,255,0.9)',
              transform: `scale(${1.2 - 0.4 * f.tocco})`,
              opacity: 1 - Math.max(0, f.tocco - 0.7) / 0.3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: rect.cx - 160,
              top: rect.cy - 160,
              width: 320,
              height: 320,
              borderRadius: '50%',
              border: '5px solid rgba(212,166,74,0.9)',
              transform: `scale(${0.3 + f.tocco})`,
              opacity: 1 - f.tocco,
            }}
          />
        </>
      ) : null}

      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 47%, rgba(255,230,180,0.9) 0%, rgba(255,230,180,0) 55%)', opacity: lampo, mixBlendMode: 'screen'}} />
      <PolvereDorata quante={35} intensita={0.6} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(apri, chiudi)}} />
    </AbsoluteFill>
  );
};

export const durataSitoTocco = (n: number) => T_SCROLL + n * CICLO + 4.2;
