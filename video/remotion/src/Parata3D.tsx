import React, {useMemo, useState} from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Parata3D — i prodotti veri (PNG scontornati) sfilano in 3D uno dietro l'altro davanti al sito:
 * arrivano dal fondo, al centro si SMONTANO in tanti pezzi che volano e si RIMONTANO, poi escono.
 * Alla fine i pezzi formano il logo. Tempi in secondi; 1080x1920 (4K con --scale=2).
 */
export type Parata3DProps = {
  sfondo: string; // video del sito che scorre
  prodotti: {img: string; altezza: number}[]; // altezza in unità 3D (≈ metri)
  logo: string;
  passo: number; // secondi tra un prodotto e il successivo
  durata: number;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sm = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

function useImmagini(srcs: string[]) {
  const [handle] = useState(() => delayRender('immagini prodotti'));
  const [imgs, setImgs] = useState<HTMLImageElement[] | null>(null);
  React.useEffect(() => {
    Promise.all(
      srcs.map(
        (s) =>
          new Promise<HTMLImageElement>((res) => {
            const im = new Image();
            im.onload = () => res(im);
            im.onerror = () => res(im);
            im.src = staticFile(s);
          }),
      ),
    ).then((a) => {
      setImgs(a);
      continueRender(handle);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return imgs;
}

// tempi di un prodotto k: arrivo dal fondo, spettacolo al centro, uscita
const ARRIVO = 2.6;
const CENTRO = 2.9;
const USCITA = 0.9;

type Pezzo = {geo: THREE.PlaneGeometry; cx: number; cy: number; i: number};

const usePezzi = (img: HTMLImageElement, altezza: number, cols: number, rows: number) =>
  useMemo(() => {
    const W = altezza * (img.width / img.height);
    const H = altezza;
    const out: Pezzo[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const g = new THREE.PlaneGeometry(W / cols, H / rows);
        const uv = g.attributes.uv as THREE.BufferAttribute;
        const u0 = c / cols, u1 = (c + 1) / cols, v0 = r / rows, v1 = (r + 1) / rows;
        uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
        out.push({geo: g, cx: -W / 2 + (c + 0.5) * (W / cols), cy: -H / 2 + (r + 0.5) * (H / rows), i: r * cols + c});
      }
    return {pezzi: out, W, H};
  }, [img, altezza, cols, rows]);

/** un oggetto fatto di pezzi che può smontarsi (k = 0 montato, 1 esploso) */
const Smontabile: React.FC<{
  img: HTMLImageElement;
  altezza: number;
  cols: number;
  rows: number;
  esplosione: number; // 0..1
  t: number;
  spessore?: boolean;
  seme: number;
}> = ({img, altezza, cols, rows, esplosione, t, spessore = true, seme}) => {
  const tex = useMemo(() => {
    const x = new THREE.Texture(img);
    x.colorSpace = THREE.SRGBColorSpace;
    x.needsUpdate = true;
    x.anisotropy = 8;
    return x;
  }, [img]);
  const {pezzi} = usePezzi(img, altezza, cols, rows);
  return (
    <>
      {pezzi.map((p) => {
        const e = esplosione;
        const dir = new THREE.Vector3(p.cx, p.cy, 0).normalize();
        const dist = (0.5 + rnd(p.i + seme, 1) * 0.9) * e;
        const x = p.cx + dir.x * dist + (rnd(p.i + seme, 2) - 0.5) * 0.4 * e;
        const y = p.cy + dir.y * dist + (rnd(p.i + seme, 3) - 0.5) * 0.4 * e + Math.sin(t * 2 + p.i) * 0.03 * e;
        const z = (0.3 + rnd(p.i + seme, 4) * 1.4) * e;
        const rx = (rnd(p.i + seme, 5) - 0.5) * 2.4 * e;
        const ry = (rnd(p.i + seme, 6) - 0.5) * 2.4 * e;
        const rz = (rnd(p.i + seme, 7) - 0.5) * 1.6 * e;
        return (
          <group key={p.i} position={[x, y, z]} rotation={[rx, ry, rz]}>
            <mesh geometry={p.geo}>
              <meshBasicMaterial map={tex} transparent alphaTest={0.08} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {/* spessore: copia scura leggermente dietro, dà volume quando ruota */}
            {spessore ? (
              <mesh geometry={p.geo} position={[0, 0, -0.025]}>
                <meshBasicMaterial map={tex} transparent alphaTest={0.08} color={'#202020'} side={THREE.DoubleSide} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </>
  );
};

const Prodotto: React.FC<{k: number; img: HTMLImageElement; altezza: number; t: number; passo: number}> = ({k, img, altezza, t, passo}) => {
  const t0 = 0.6 + k * passo; // inizio arrivo
  const tc = t0 + ARRIVO; // arriva al centro
  const tu = tc + CENTRO; // inizia ad uscire
  if (t < t0 - 0.1 || t > tu + USCITA + 0.1) return null;
  const fondo = new THREE.Vector3(1.2, 0, -14);
  const centro = new THREE.Vector3(0, 0, 0);
  const fuori = new THREE.Vector3(-5.5, 0, 1.2);
  let pos: THREE.Vector3;
  if (t < tc) pos = fondo.clone().lerp(centro, ease(THREE.MathUtils.clamp((t - t0) / ARRIVO, 0, 1)));
  else if (t < tu) pos = centro.clone();
  else pos = centro.clone().lerp(fuori, Math.pow(THREE.MathUtils.clamp((t - tu) / USCITA, 0, 1), 2));
  // camminata: piccolo dondolio mentre si avvicina
  const cammina = t < tc ? 1 - sm(tc - 0.6, tc, t) : 0;
  const dond = Math.sin(t * 7 + k) * 0.06 * cammina;
  // spettacolo al centro: si smonta, fluttua, si rimonta
  const s = t - tc;
  const esplosione = s < 0 ? 0 : s < 0.55 ? ease(s / 0.55) : s < 1.35 ? 1 : s < 2.25 ? 1 - ease((s - 1.35) / 0.9) : 0;
  const giro = -0.6 + 0.9 * sm(tc - 1.2, tu, t) + (t > tu ? (t - tu) * 0.8 : 0);
  return (
    <group position={[pos.x, pos.y + altezza / 2 + 0.02, pos.z]} rotation={[0, giro, dond]}>
      <Smontabile img={img} altezza={altezza} cols={6} rows={7} esplosione={esplosione} t={t} seme={k * 100} />
    </group>
  );
};

const Telecamera: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  camera.position.set(0.5 * Math.sin(t * 0.25), 1.15 + 0.1 * Math.sin(t * 0.3), 5.6);
  camera.lookAt(0, 0.95, -1);
  return null;
};

const Scena: React.FC<{p: Parata3DProps; t: number; imgs: HTMLImageElement[]}> = ({p, t, imgs}) => {
  const logoImg = imgs[imgs.length - 1];
  const tLogo = 0.6 + (p.prodotti.length - 1) * p.passo + ARRIVO + CENTRO + USCITA - 0.3;
  const eLogo = t < tLogo ? 1 : t < tLogo + 1.2 ? 1 - ease((t - tLogo) / 1.2) : 0;
  const prodotti = p.prodotti.map((pr, k) => (
    <Prodotto key={k} k={k} img={imgs[k]} altezza={pr.altezza} t={t} passo={p.passo} />
  ));
  return (
    <>
      <Telecamera t={t} />
      <fog attach="fog" args={['#05040a', 7, 22]} />
      {prodotti}
      {/* riflesso sul pavimento */}
      <group scale={[1, -1, 1]}>{prodotti}</group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color={'#06060a'} transparent opacity={0.72} />
      </mesh>
      {t > tLogo - 0.2 ? (
        <group position={[0, 1.55, 0.3]} scale={[1 + 0.03 * Math.sin(t), 1 + 0.03 * Math.sin(t), 1]}>
          <Smontabile img={logoImg} altezza={0.4} cols={10} rows={3} esplosione={eLogo} t={t} spessore={false} seme={999} />
        </group>
      ) : null}
    </>
  );
};

export const Parata3D: React.FC<Parata3DProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const imgs = useImmagini([...p.prodotti.map((x) => x.img), p.logo]);
  const apri = interpolate(frame, [0, 18], [1, 0], clamp);
  const chiudi = interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [0, 1], clamp);
  const tLogo = 0.6 + (p.prodotti.length - 1) * p.passo + ARRIVO + CENTRO + USCITA - 0.3;
  const bagliore = interpolate(t, [tLogo + 0.9, tLogo + 1.6, tLogo + 3], [0, 1, 0.55], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: '#05040a'}}>
      <AbsoluteFill style={{perspective: 1400, overflow: 'hidden'}}>
        <AbsoluteFill
          style={{
            transform: `scale(1.3) rotateX(${10 - 6 * Math.min(1, frame / 600)}deg) rotateY(${4 * Math.sin(frame / 140)}deg)`,
            transformOrigin: '50% 60%',
          }}
        >
          <OffthreadVideo src={staticFile(p.sfondo)} muted style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(5,4,10,0.45) 0%, rgba(5,4,10,0.30) 35%, rgba(5,4,10,0.55) 60%, rgba(5,4,10,0.92) 100%)',
        }}
      />
      {/* sul finale lo sfondo si scurisce, il logo risalta */}
      <AbsoluteFill style={{background: '#05040a', opacity: interpolate(t, [tLogo - 0.5, tLogo + 0.8], [0, 0.82], clamp)}} />
      {/* bagliore dorato dietro al logo */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 60% 22% at 50% 44%, rgba(212,166,74,0.45) 0%, rgba(212,166,74,0) 70%)',
          opacity: bagliore,
        }}
      />
      {imgs ? (
        <ThreeCanvas width={width} height={height} camera={{fov: 40, near: 0.1, far: 60, position: [0, 1.2, 5.6]}} gl={{antialias: true, alpha: true}}>
          <Scena p={p} t={t} imgs={imgs} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(apri, chiudi)}} />
    </AbsoluteFill>
  );
};
