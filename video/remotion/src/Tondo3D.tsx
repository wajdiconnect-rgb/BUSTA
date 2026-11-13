import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {useImmagini} from './Parata3D';

/**
 * Tondo3D — schermo LED rotondo VERO in 3D (WebGL): moduli curvi con spessore,
 * fuori lo schermo acceso (panorama senza giunte che scorre), dentro il retro di ogni modulo,
 * struttura metallica che resta al suo posto mentre i moduli escono tutto intorno e rientrano.
 */
export type TondoProps = {
  panorama: string;
  retro: string;
  colonne: number;
  righe: number;
  raggio: number; // px nel video (1080 di larghezza)
  altezza: number; // px
};

const PX = 1 / 440; // px del video -> unità 3D (camera a ~7.6, fov 32)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const Camera: React.FC = () => {
  const {camera} = useThree();
  camera.position.set(0, 1.55, 7.4);
  camera.lookAt(0, 0.05, 0);
  return null;
};

const Scena: React.FC<{q: TondoProps; t: number; s: number; y: number; scala: number; imgs: HTMLImageElement[]}> = ({q, t, s, y, scala, imgs}) => {
  const N = q.colonne;
  const Rr = q.righe;
  const R = q.raggio * PX;
  const H = q.altezza * PX;
  const T = 0.07; // spessore modulo
  const dTheta = (Math.PI * 2) / N;
  const gap = 0.003;
  const h = H / Rr;

  const {pano, back} = useMemo(() => {
    const a = new THREE.Texture(imgs[0]);
    a.colorSpace = THREE.SRGBColorSpace;
    a.wrapS = THREE.RepeatWrapping;
    a.anisotropy = 8;
    a.needsUpdate = true;
    const b = new THREE.Texture(imgs[1]);
    b.colorSpace = THREE.SRGBColorSpace;
    b.needsUpdate = true;
    return {pano: a, back: b};
  }, [imgs]);
  // il contenuto dello schermo scorre piano intorno al cilindro
  pano.offset.x = -t * 0.018;

  const mat = useMemo(() => {
    const schermo = new THREE.MeshStandardMaterial({
      map: pano,
      emissiveMap: pano,
      emissive: new THREE.Color(1, 1, 1),
      emissiveIntensity: 0.62,
      roughness: 0.28,
      metalness: 0.0,
    });
    const retro = new THREE.MeshStandardMaterial({map: back, roughness: 0.55, metalness: 0.6, side: THREE.BackSide});
    const bordo = new THREE.MeshStandardMaterial({color: '#2b2d33', roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide});
    const acciaio = new THREE.MeshStandardMaterial({color: '#9a9ea8', roughness: 0.25, metalness: 0.95});
    const fondo = new THREE.MeshStandardMaterial({color: '#121316', roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide, transparent: true});
    return {schermo, retro, bordo, acciaio, fondo};
  }, [pano, back]);

  // geometrie dei moduli (una per colonna/riga: UV del panorama già al posto giusto)
  const geos = useMemo(() => {
    const out: {fronte: THREE.BufferGeometry; dentro: THREE.BufferGeometry; anello: THREE.BufferGeometry; lato: THREE.BufferGeometry}[][] = [];
    const len = dTheta - gap;
    for (let i = 0; i < N; i++) {
      out.push([]);
      for (let r = 0; r < Rr; r++) {
        const fronte = new THREE.CylinderGeometry(R, R, h - gap, 10, 1, true, -len / 2, len);
        const uv = fronte.getAttribute('uv') as THREE.BufferAttribute;
        for (let k = 0; k < uv.count; k++) {
          uv.setXY(k, (i + uv.getX(k)) / N, (Rr - 1 - r + uv.getY(k)) / Rr);
        }
        const dentro = new THREE.CylinderGeometry(R - T, R - T, h - gap, 10, 1, true, -len / 2, len);
        const anello = new THREE.RingGeometry(R - T, R, 10, 1, -len / 2 - Math.PI / 2, len);
        anello.rotateX(-Math.PI / 2);
        const lato = new THREE.PlaneGeometry(T, h - gap);
        out[i].push({fronte, dentro, anello, lato});
      }
    }
    return out;
  }, [N, Rr, R, h, dTheta]);

  const moduli: React.ReactNode[] = [];
  let somma = 0;
  for (let i = 0; i < N; i++) {
    for (let r = 0; r < Rr; r++) {
      const d = (i / N) * 1.25 + r * 0.16; // onda che gira intorno
      const fuori = s > 0 ? ease(clamp01((s - d) / 0.9)) * (1 - ease(clamp01((s - 2.5 - d) / 0.9))) : 0;
      somma += fuori;
      const yc = H / 2 - h / 2 - r * h;
      const g = geos[i][r];
      const len = dTheta - gap;
      const out = 0.62 * fuori;
      const spread = (r - (Rr - 1) / 2) * 0.12 * fuori;
      moduli.push(
        <group key={i + '_' + r} rotation={[0, i * dTheta, 0]}>
          <group position={[0, yc + spread, out]} rotation={[(r - (Rr - 1) / 2) * -0.22 * fuori, 0, 0]}>
            <mesh geometry={g.fronte} material={mat.schermo} />
            <mesh geometry={g.dentro} material={mat.retro} />
            <mesh geometry={g.anello} material={mat.bordo} position={[0, (h - gap) / 2, 0]} />
            <mesh geometry={g.anello} material={mat.bordo} position={[0, -(h - gap) / 2, 0]} />
            {[-1, 1].map((sg) => (
              <mesh
                key={sg}
                geometry={g.lato}
                material={mat.bordo}
                position={[Math.sin((sg * len) / 2) * (R - T / 2), 0, Math.cos((sg * len) / 2) * (R - T / 2)]}
                rotation={[0, (sg * len) / 2 + Math.PI / 2, 0]}
              />
            ))}
          </group>
        </group>,
      );
    }
  }

  // fondo scuro dietro ai moduli (niente luce tra le fessure); sparisce quando i moduli escono
  const pieno = 1 - Math.min(1, (somma / (N * Rr)) * 4);
  mat.fondo.opacity = pieno;
  // struttura: anelli sopra/sotto e montanti, restano fermi
  const montanti: React.ReactNode[] = [];
  for (let k = 0; k < N; k += 3) {
    const a = k * dTheta + dTheta / 2;
    montanti.push(
      <mesh key={k} position={[Math.sin(a) * (R - T - 0.03), 0, Math.cos(a) * (R - T - 0.03)]} material={mat.acciaio}>
        <boxGeometry args={[0.03, H + 0.06, 0.03]} />
      </mesh>,
    );
  }

  return (
    <>
      <Camera />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#fff6e8', '#5a4a3a', 0.6]} />
      <directionalLight position={[3.5, 4, 6]} intensity={2.2} />
      <directionalLight position={[-5, 2, -2]} intensity={1.4} color="#ffd9a0" />
      <pointLight position={[0, 0.2, 0]} intensity={1.2} distance={3} color="#ffe2b0" />
      <group position={[0, y, 0]} scale={[scala, scala, scala]} rotation={[0, t * 0.42, 0]}>
        {moduli}
        {montanti}
        {pieno > 0.01 ? (
          <mesh material={mat.fondo}>
            <cylinderGeometry args={[R - T * 0.5, R - T * 0.5, H - 0.004, 96, 1, true]} />
          </mesh>
        ) : null}
        {[H / 2 + 0.03, -H / 2 - 0.03].map((yy) => (
          <mesh key={yy} position={[0, yy, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat.acciaio}>
            <torusGeometry args={[R - T / 2, 0.022, 12, 96]} />
          </mesh>
        ))}
      </group>
    </>
  );
};

export const Tondo3D: React.FC<{q: TondoProps; t: number; s: number; cy: number; scala: number; width: number; height: number}> = ({q, t, s, cy, scala, width, height}) => {
  const imgs = useImmagini([q.panorama, q.retro]);
  if (!imgs) return null;
  // cy: centro del prodotto in px del video -> y in unità 3D (0 = poco sopra il centro)
  const y = -(cy - 900) * PX;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 32, near: 0.1, far: 50, position: [0, 1.55, 7.4]}} gl={{antialias: true, alpha: true}}>
        <Scena q={q} t={t} s={s} y={y} scala={scala} imgs={imgs} />
      </ThreeCanvas>
    </div>
  );
};
