import React, {useMemo, useState} from 'react';
import {AbsoluteFill, OffthreadVideo, continueRender, delayRender, interpolate, Easing, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import '@fontsource/montserrat/600.css';

/**
 * Infinity3D — pannelli LED in 3D vero (three.js):
 * arrivano in fila lungo una corsia, volano al loro posto e montano un maxischermo,
 * il muro si smonta (esplode) e si rimonta curvo, poi si accende il logo.
 * Tempi in secondi; composizione verticale 1080x1920 (export 4K con --scale=2).
 */
export type Infinity3DProps = {
  contenuto: string; // immagine di riserva (se non c'è il video)
  /** video vero sul maxischermo, come sequenza di fotogrammi: cartella in public con 0001.jpg, 0002.jpg… */
  fotogrammi?: {cartella: string; quanti: number; fps: number; aspetto: number; da: number};
  logoSchermo: string; // immagine con il logo per il finale
  sito: string;
  oro: string;
  durata: number;
  sfondo?: string; // video del sito che scorre dietro la scena 3D
};

const COLS = 4;
const ROWS = 6;
const S = 0.5; // lato del pannello (cabinet 500x500)
const N = COLS * ROWS;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// tempi (secondi)
const T_ARRIVO = 1.0;
const PASSO = 0.18;
const CORSA = 2.2;
const VOLO = 0.9;
const T_ESPLODE = 11.0;
const T_RIMONTA = 13.2;
const T_LOGO = 15.2;

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const slotPiatto = (i: number) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {p: new THREE.Vector3((c - (COLS - 1) / 2) * S, 0.25 + S / 2 + r * S, 0), rotY: 0};
};
const slotCurvo = (i: number) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const R = 1.9;
  const th = (c - (COLS - 1) / 2) * (S / R) * 1.02;
  return {p: new THREE.Vector3(R * Math.sin(th), 0.25 + S / 2 + r * S, R * (1 - Math.cos(th))), rotY: -th};
};

/** carica l'immagine PRIMA di creare le texture (così ogni pannello ha la sua copia già pronta) */
function useImmagine(src: string): HTMLImageElement | null {
  const [handle] = useState(() => delayRender('immagine ' + src));
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  React.useEffect(() => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      setImg(im);
      continueRender(handle);
    };
    im.onerror = () => continueRender(handle);
    im.src = staticFile(src);
  }, [src, handle]);
  return img;
}

/** carica il fotogramma del video giusto per l'istante t (ciclo continuo) prima di disegnare */
function useFotogramma(f: Infinity3DProps['fotogrammi'], t: number): HTMLImageElement | null {
  const idx = f ? (Math.floor(Math.max(0, t - f.da) * f.fps) % f.quanti) + 1 : 0;
  const [pronti, setPronti] = useState<Record<number, HTMLImageElement>>({});
  // il blocco del render parte SUBITO (durante il render, non dopo): Remotion aspetta il fotogramma giusto
  useMemo(() => {
    if (!f || pronti[idx]) return;
    const h = delayRender('fotogramma ' + idx);
    const im = new Image();
    im.onload = () => {
      setPronti((p) => ({...p, [idx]: im}));
      continueRender(h);
    };
    im.onerror = () => continueRender(h);
    im.src = staticFile(`${f.cartella}/${String(idx).padStart(4, '0')}.jpg`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, idx]);
  return f ? pronti[idx] ?? null : null;
}

const pezzo = (img: HTMLImageElement, c: number, r: number) => {
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / COLS, 1 / ROWS);
  t.offset.set(c / COLS, r / ROWS);
  t.needsUpdate = true;
  return t;
};

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** piano dello schermo con le coordinate UV del suo pezzo (così tutti i pannelli condividono una texture) */
const usePianoPezzo = (c: number, r: number, aspettoSorgente: number) =>
  useMemo(() => {
    const g = new THREE.PlaneGeometry(S * 0.96, S * 0.96);
    const aspettoMuro = COLS / ROWS;
    // ritaglio "cover" della sorgente sul muro
    let u0 = 0, uw = 1, v0 = 0, vh = 1;
    if (aspettoSorgente > aspettoMuro) {
      uw = aspettoMuro / aspettoSorgente;
      u0 = (1 - uw) / 2;
    } else {
      vh = aspettoSorgente / aspettoMuro;
      v0 = (1 - vh) / 2;
    }
    const a0 = u0 + (c / COLS) * uw, a1 = u0 + ((c + 1) / COLS) * uw;
    const b0 = v0 + (r / ROWS) * vh, b1 = v0 + ((r + 1) / ROWS) * vh;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    uv.setXY(0, a0, b1); uv.setXY(1, a1, b1); uv.setXY(2, a0, b0); uv.setXY(3, a1, b0);
    uv.needsUpdate = true;
    return g;
  }, [c, r, aspettoSorgente]);

const Pannello: React.FC<{i: number; t: number; contenuto: THREE.Texture; logo: THREE.Texture; aspetto: number; aspettoLogo: number}> = ({
  i,
  t,
  contenuto,
  logo,
  aspetto,
  aspettoLogo,
}) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const pianoC = usePianoPezzo(c, r, aspetto);
  const pianoL = usePianoPezzo(c, r, aspettoLogo);

  const metallo = useMemo(
    () => new THREE.MeshStandardMaterial({color: '#5a5e66', metalness: 0.7, roughness: 0.38}),
    [],
  );

  // 1) arrivo lungo la corsia, uno dietro l'altro
  const t0 = T_ARRIVO + i * PASSO;
  const u = THREE.MathUtils.clamp((t - t0) / CORSA, 0, 1);
  const corsiaDa = new THREE.Vector3(0, S / 2, -16);
  const corsiaA = new THREE.Vector3(0, S / 2, 1.4);
  let pos = corsiaDa.clone().lerp(corsiaA, 1 - Math.pow(1 - u, 2));
  let rot = new THREE.Euler(0, 0, 0);
  // passo "camminato": piccolo dondolio
  rot.z = Math.sin((t - t0) * 9) * 0.08 * (1 - u);
  pos.y += Math.abs(Math.sin((t - t0) * 9)) * 0.06 * (1 - u);

  // 2) volo al posto nel muro piatto
  const tv = t0 + CORSA;
  const v = THREE.MathUtils.clamp((t - tv) / VOLO, 0, 1);
  const piatto = slotPiatto(i);
  if (t >= tv) {
    const e = ease(v);
    const arco = new THREE.Vector3(0, 0, 0).lerpVectors(corsiaA, piatto.p, e);
    arco.y += Math.sin(Math.PI * e) * 0.9;
    arco.z += Math.sin(Math.PI * e) * 0.8;
    pos = arco;
    rot = new THREE.Euler(0, (1 - e) * Math.PI * 2, (1 - e) * 0.3);
  }

  // 3) esplosione: i pannelli si staccano e fluttuano
  const curvo = slotCurvo(i);
  if (t >= T_ESPLODE) {
    const ex = THREE.MathUtils.clamp((t - T_ESPLODE) / 0.7, 0, 1);
    const dir = piatto.p.clone().sub(new THREE.Vector3(0, 1.75, 0));
    const fuori = piatto.p
      .clone()
      .add(dir.multiplyScalar(1.1))
      .add(new THREE.Vector3((rnd(i, 1) - 0.5) * 0.8, (rnd(i, 2) - 0.5) * 0.8, 0.6 + rnd(i, 3) * 2.2));
    const deriva = (t - T_ESPLODE) * 0.15;
    const pe = piatto.p.clone().lerp(fuori, 1 - Math.pow(1 - ex, 3));
    pe.y += Math.sin((t + i) * 1.3) * 0.05 + deriva * 0.1;
    pos = pe;
    rot = new THREE.Euler(
      (rnd(i, 4) - 0.5) * 1.6 * ex + deriva * (rnd(i, 7) - 0.5),
      (rnd(i, 5) - 0.5) * 2.2 * ex + deriva,
      (rnd(i, 6) - 0.5) * 1.2 * ex,
    );
    // 4) rimontaggio in muro curvo
    if (t >= T_RIMONTA) {
      const k = THREE.MathUtils.clamp((t - T_RIMONTA - (i % COLS) * 0.08 - Math.floor(i / COLS) * 0.05) / 1.1, 0, 1);
      const e = ease(k);
      pos = pe.clone().lerp(curvo.p, e);
      rot = new THREE.Euler(rot.x * (1 - e), rot.y * (1 - e) + curvo.rotY * e, rot.z * (1 - e));
    }
  }

  // accensione dello schermo quando arriva al suo posto
  const acceso = THREE.MathUtils.clamp((t - (tv + VOLO - 0.05)) / 0.25, 0, 1);
  const lampo = Math.max(0, 1 - Math.abs(t - (tv + VOLO)) / 0.18);
  const logoMix = THREE.MathUtils.clamp((t - T_LOGO - (r * 0.06 + c * 0.04)) / 0.6, 0, 1);
  const luce = 0.08 + 0.92 * acceso + 0.6 * lampo;

  return (
    <group position={pos} rotation={rot}>
      <mesh material={metallo}>
        <boxGeometry args={[S * 0.985, S * 0.985, 0.09]} />
      </mesh>
      {/* schermo: contenuto */}
      <mesh position={[0, 0, 0.0455]} geometry={pianoC}>
        <meshBasicMaterial map={contenuto} color={new THREE.Color(luce, luce, luce)} toneMapped={false} />
      </mesh>
      {/* schermo: logo (dissolvenza sopra il contenuto) */}
      <mesh position={[0, 0, 0.0462]} geometry={pianoL}>
        <meshBasicMaterial map={logo} transparent opacity={logoMix} toneMapped={false} />
      </mesh>
      {/* retro: maniglie e dettagli del cabinet */}
      <mesh position={[0, 0.12, -0.05]} material={metallo}>
        <boxGeometry args={[0.18, 0.03, 0.02]} />
      </mesh>
      <mesh position={[0, -0.12, -0.05]} material={metallo}>
        <boxGeometry args={[0.18, 0.03, 0.02]} />
      </mesh>
    </group>
  );
};

const Telecamera: React.FC<{t: number}> = ({t}) => {
  const {camera} = useThree();
  // inizio: basso, guarda la corsia; poi si alza e indietreggia per vedere il muro; finale: lenta orbita
  const k1 = THREE.MathUtils.smoothstep(t, 1.5, 7.5);
  const orb = THREE.MathUtils.smoothstep(t, 9, 22);
  const pos = new THREE.Vector3(
    0.6 * (1 - k1) + Math.sin(orb * 1.4) * 0.9 * orb,
    0.55 + 1.15 * k1,
    6.0 + 0.9 * k1 - 0.5 * orb,
  );
  const target = new THREE.Vector3(0, 0.6 + 1.15 * k1, -4 * (1 - k1));
  // esplosione: piccolo scossone
  if (t > T_ESPLODE && t < T_ESPLODE + 0.6) {
    const d = t - T_ESPLODE;
    pos.x += Math.sin(d * 60) * 0.04 * (1 - d / 0.6);
    pos.y += Math.cos(d * 55) * 0.03 * (1 - d / 0.6);
  }
  camera.position.copy(pos);
  camera.lookAt(target);
  return null;
};

const Fasci: React.FC<{t: number; oro: string}> = ({t, oro}) => (
  <>
    {[-1.6, -0.55, 0.55, 1.6].map((x, k) => (
      <mesh key={k} position={[x, 4.2, -1.2]} rotation={[0, 0, Math.sin(t * 0.6 + k) * 0.25 + (x < 0 ? -0.2 : 0.2)]}>
        <coneGeometry args={[0.55, 7, 32, 1, true]} />
        <meshBasicMaterial color={oro} transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    ))}
  </>
);

const Scintille: React.FC<{t: number; oro: string}> = ({t, oro}) => {
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const n = 500;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const h = (rnd(i, 9) * 6 + t * (0.15 + rnd(i, 10) * 0.25)) % 6;
    pos[i * 3] = (rnd(i, 11) - 0.5) * 7 + Math.sin(t * 0.5 + i) * 0.1;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = (rnd(i, 12) - 0.5) * 6;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return (
    <points geometry={geo}>
      <pointsMaterial color={oro} size={0.025} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

const Scena: React.FC<{p: Infinity3DProps; t: number; contenuto: HTMLImageElement; logo: HTMLImageElement; frameVideo: HTMLImageElement | null}> = ({p, t, contenuto: imgC, logo: imgL, frameVideo}) => {
  const vtex = useMemo(() => {
    const x = new THREE.Texture();
    x.colorSpace = THREE.SRGBColorSpace;
    return x;
  }, []);
  if (frameVideo && vtex.image !== frameVideo) {
    vtex.image = frameVideo;
    vtex.needsUpdate = true;
  }
  const [texImg, texLogo] = useMemo(() => {
    const a = new THREE.Texture(imgC);
    const b = new THREE.Texture(imgL);
    for (const x of [a, b]) {
      x.colorSpace = THREE.SRGBColorSpace;
      x.needsUpdate = true;
    }
    return [a, b];
  }, [imgC, imgL]);
  const contenuto = p.fotogrammi ? vtex : texImg;
  const logo = texLogo;
  const aspetto = p.fotogrammi ? p.fotogrammi.aspetto : imgC.width / imgC.height;
  const aspettoLogo = imgL.width / imgL.height;
  const pannelli = new Array(N).fill(0).map((_, i) => <Pannello key={i} i={i} t={t} contenuto={contenuto} logo={logo} aspetto={aspetto} aspettoLogo={aspettoLogo} />);
  return (
    <>
      <Telecamera t={t} />
      {p.sfondo ? null : <color attach="background" args={['#040306']} />}
      <fog attach="fog" args={['#040306', 5, 20]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#ffe9c4', '#101018', 0.8]} />
      <directionalLight position={[3, 6, 5]} intensity={2.4} color={'#ffe2b0'} />
      <directionalLight position={[-4, 3, -4]} intensity={1.4} color={'#9fb6ff'} />
      <pointLight position={[-3, 2, 2]} intensity={6} color={'#3a6bff'} distance={10} />
      <pointLight position={[3, 2, 2]} intensity={6} color={'#ff9a3a'} distance={10} />
      {pannelli}
      {/* riflesso sul pavimento bagnato: copia capovolta sotto un pavimento semitrasparente */}
      <group scale={[1, -1, 1]}>{new Array(N).fill(0).map((_, i) => <Pannello key={i} i={i} t={t} contenuto={contenuto} logo={logo} aspetto={aspetto} aspettoLogo={aspettoLogo} />)}</group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={'#07070a'} metalness={0.6} roughness={0.35} transparent opacity={p.sfondo ? 0.55 : 0.82} />
      </mesh>
      {/* corsia luminosa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -7]}>
        <planeGeometry args={[0.9, 18]} />
        <meshBasicMaterial color={p.oro} transparent opacity={0.12 * (1 - THREE.MathUtils.smoothstep(t, 8, 10))} blending={THREE.AdditiveBlending} />
      </mesh>
      <Fasci t={t} oro={p.oro} />
      <Scintille t={t} oro={p.oro} />
    </>
  );
};

export const Infinity3D: React.FC<Infinity3DProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const apri = interpolate(frame, [0, 20], [1, 0], clamp);
  const chiudi = interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [0, 1], clamp);
  const contenuto = useImmagine(p.contenuto);
  const logo = useImmagine(p.logoSchermo);
  const frameVideo = useFotogramma(p.fotogrammi, t);
  const sito = interpolate(t, [T_LOGO + 1.6, T_LOGO + 2.4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: '#040306'}}>
      {p.sfondo ? (
        <>
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
                'linear-gradient(180deg, rgba(4,3,6,0.55) 0%, rgba(4,3,6,0.35) 35%, rgba(4,3,6,0.55) 62%, rgba(4,3,6,0.92) 100%)',
            }}
          />
        </>
      ) : null}
      {contenuto && logo ? (
        <ThreeCanvas width={width} height={height} camera={{fov: 42, near: 0.1, far: 60, position: [0, 1, 6]}} gl={{antialias: true, alpha: true}}>
          <Scena p={p} t={t} contenuto={contenuto} logo={logo} frameVideo={frameVideo} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)'}}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 260,
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: 40,
          letterSpacing: 10,
          color: p.oro,
          opacity: sito,
        }}
      >
        {p.sito.toUpperCase()}
      </div>
      <AbsoluteFill style={{background: '#000', opacity: Math.max(apri, chiudi)}} />
    </AbsoluteFill>
  );
};
