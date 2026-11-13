import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Tondo3D} from './Tondo3D';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';

/**
 * ProdottoSingolo — un prodotto grande sopra il sito luminoso che scende piano:
 * entra, gira a 360° (davanti e dietro, con spessore), si smonta in pezzi e si rimonta,
 * poi nome e logo. Tutto in CSS 3D (niente WebGL): veloce da esportare in 4K.
 */
export type ProdottoSingoloProps = {
  sfondo: string;
  fronte: string;
  retro: string;
  aspetto: number; // larghezza/altezza dell'immagine frontale
  larghezza: number; // px nel video (1080 di larghezza)
  nome: string;
  logo: string;
  oro: string;
  durata: number;
  /** video da mostrare DENTRO lo schermo del prodotto (es. la frutta) */
  schermo?: {video: string; maschera: string; box: {x: number; y: number; w: number; h: number}; pezzi: string};
  griglia?: number; // pezzi per lato nello smontaggio (default 6)
  /** smontaggio REALE: i moduli dello schermo escono in avanti dal cabinet e rientrano */
  moduli?: {cols: number; rows: number; vuoto: string};
  /** prodotto ROTONDO vero (cilindro di moduli), che gira e si smonta tutto intorno */
  tondo?: {panorama: string; retro: string; colonne: number; righe: number; raggio: number; altezza: number};
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// tempi (secondi)
const T_GIRO = [1.5, 6.3];
const T_SMONTA = 6.6;
const T_FINALE_D = 3.4; // gli ultimi secondi: nome e logo

export const ProdottoSingolo: React.FC<ProdottoSingoloProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const t = frame / fps;
  const W = p.tondo ? p.tondo.raggio * 2 : p.larghezza;
  const H = p.tondo ? p.tondo.altezza + p.tondo.raggio * 0.6 : W / p.aspetto;
  const tFinale = p.durata - T_FINALE_D;

  // entrata dall'alto con molla
  const entra = p.moduli || p.tondo
    ? ease(THREE_clamp((t - 0.2) / 2.4))
    : spring({frame: frame - 0.3 * fps, fps, config: {damping: 16, mass: 1.4, stiffness: 70}});
  // giro completo a 360°
  const giro = 360 * ease(THREE_clamp((t - T_GIRO[0]) / (T_GIRO[1] - T_GIRO[0])));
  // dondolio dopo lo smontaggio
  const dondolo = t > T_SMONTA + 2.4 ? Math.sin((t - T_SMONTA - 2.4) * 1.3) * 22 : 0;
  const rotY = p.moduli ? Math.sin(t * 0.55) * 26 * THREE_clamp((t - 1.5) / 2) : giro + dondolo;
  const galleggia = Math.sin(t * 1.4) * 14;
  // smontaggio: 0..1
  const s = t - (p.moduli || p.tondo ? 5.2 : T_SMONTA); // con i moduli si parte prima, per farli vedere piano piano
  const espl = s < 0 ? 0 : s < 0.55 ? ease(s / 0.55) : s < 1.3 ? 1 : s < 2.2 ? 1 - ease((s - 1.3) / 0.9) : 0;
  const inPezzi = !p.moduli && s > 0 && s < 2.2;
  const inModuli = !!p.moduli && s > 0 && s < 4.3;
  const lampo = Math.exp(-Math.abs(s - (p.moduli || p.tondo ? 4.05 : 2.2)) * 8) * 0.55;
  // finale: il prodotto sale e rimpicciolisce un po', compaiono nome e logo
  const fin = ease(THREE_clamp((t - tFinale) / 1.0));
  const scala = (1 + 0.06 * Math.sin(t * 0.6)) * (1 - 0.22 * fin);
  const sali = -260 * fin;
  const nomeIn = interpolate(t, [tFinale + 0.4, tFinale + 1.1], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const logoIn = interpolate(t, [tFinale + 0.9, tFinale + 1.6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  // riflesso di luce che attraversa il fronte
  const riflesso = ((t * 0.45) % 1.6) * 100 - 30;
  const chiudi = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [0, 1], clamp);
  const apri = interpolate(frame, [0, 10], [1, 0], clamp);

  const strati = 14; // spessore
  const cx = 540 - W / 2;
  const cy = 860 - H / 2 + galleggia + sali + (1 - entra) * -1500;

  const moduli: React.ReactNode[] = [];
  if (inModuli && p.moduli && p.schermo) {
    const {cols: C, rows: R} = p.moduli;
    const b = p.schermo.box;
    const bx = b.x * W, by = b.y * H, bw = b.w * W, bh = b.h * H;
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        const i = r * C + c;
        const d = (c + r) * 0.13; // onda diagonale, lenta
        const fuori = ease(THREE_clamp((s - d) / 0.9)) * (1 - ease(THREE_clamp((s - 2.4 - d) / 0.9)));
        const mw = bw / C, mh = bh / R;
        const mx = bx + c * mw, my = by + r * mh;
        const dx = mx + mw / 2 - (bx + bw / 2), dy = my + mh / 2 - (by + bh / 2);
        moduli.push(
          <div
            key={i}
            style={{
              position: 'absolute',
              left: mx,
              top: my,
              width: mw,
              height: mh,
              transform: `translate3d(${dx * 0.18 * fuori}px, ${dy * 0.18 * fuori}px, ${260 * fuori}px) rotateX(${-dy * 0.02 * fuori}deg) rotateY(${dx * 0.02 * fuori}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${staticFile(p.schermo.pezzi)})`,
                backgroundSize: `${W}px ${H}px`,
                backgroundPosition: `${-mx}px ${-my}px`,
                boxShadow: `0 0 0 ${2 * fuori}px rgba(20,20,24,0.9), 0 ${30 * fuori}px ${50 * fuori}px rgba(0,0,0,${0.45 * fuori})`,
              }}
            />
          </div>,
        );
      }
  }
  const pezzi: React.ReactNode[] = [];
  if (inPezzi) {
    const C = p.griglia ?? 6, R = Math.round((p.griglia ?? 6) * 1.25);
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        const i = r * C + c;
        const pw = W / C, ph = H / R;
        const px = c * pw, py = r * ph;
        const dx = (px + pw / 2 - W / 2), dy = (py + ph / 2 - H / 2);
        const len = Math.hypot(dx, dy) || 1;
        const d = (90 + rnd(i, 1) * 170) * espl;
        pezzi.push(
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: pw + 1,
              height: ph + 1,
              backgroundImage: `url(${staticFile(p.schermo ? p.schermo.pezzi : p.fronte)})`,
              backgroundSize: `${W}px ${H}px`,
              backgroundPosition: `${-px}px ${-py}px`,
              transform: `translate3d(${(dx / len) * d + (rnd(i, 2) - 0.5) * 120 * espl}px, ${(dy / len) * d + (rnd(i, 3) - 0.5) * 120 * espl}px, ${rnd(i, 4) * 260 * espl}px) rotateX(${(rnd(i, 5) - 0.5) * 220 * espl}deg) rotateY(${(rnd(i, 6) - 0.5) * 220 * espl}deg) rotateZ(${(rnd(i, 7) - 0.5) * 120 * espl}deg)`,
              filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.35))',
            }}
          />,
        );
      }
  }

  return (
    <AbsoluteFill style={{background: '#efe6d6', overflow: 'hidden'}}>
      {/* il sito che scende piano piano, luminoso */}
      <AbsoluteFill style={{perspective: 1600}}>
        <AbsoluteFill style={{transform: `scale(1.12) rotateX(${5 * Math.sin(t * 0.3)}deg)`, transformOrigin: '50% 50%'}}>
          <OffthreadVideo src={staticFile(p.sfondo)} muted style={{width: '100%', height: '100%'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      {/* leggero velo chiaro dietro al prodotto, per farlo risaltare (non scuro) */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 45% at 50% 45%, rgba(255,250,240,0.22) 0%, rgba(255,250,240,0) 70%)'}} />

      {/* ombra morbida sotto il prodotto */}
      <div
        style={{
          position: 'absolute',
          left: 540 - W * 0.45,
          top: 860 + H / 2 + 60 + sali,
          width: W * 0.9,
          height: 70,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(40,30,20,0.35) 0%, rgba(40,30,20,0) 70%)',
          transform: `scale(${(0.8 + 0.2 * entra) * (1 - galleggia / 200)})`,
          opacity: entra,
        }}
      />

      {p.tondo ? <Tondo3D q={p.tondo} t={t} s={s} cy={860 + galleggia + sali + (1 - entra) * -1500} scala={scala} width={width} height={height} /> : null}
      {/* il prodotto in 3D */}
      {p.tondo ? null : (
      <div style={{position: 'absolute', left: cx, top: cy, width: W, height: H, perspective: 2200}}>
        <div style={{position: 'relative', width: W, height: H, transformStyle: 'preserve-3d', transform: `scale(${scala}) rotateY(${rotY}deg)`}}>
          {inPezzi ? (
            <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>{pezzi}</div>
          ) : (
            <>
              {/* spessore: strati scuri tra davanti e dietro */}
              {new Array(strati).fill(0).map((_, i) => (
                <Img
                  key={i}
                  src={staticFile(p.fronte)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: W,
                    height: H,
                    transform: `translateZ(${-i * 3}px)`,
                    filter: 'brightness(0.32)',
                  }}
                />
              ))}
              {/* davanti */}
              <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'translateZ(1px)', transformStyle: 'preserve-3d'}}>
                <Img src={staticFile(inModuli && p.moduli ? p.moduli.vuoto : p.fronte)} style={{width: W, height: H, display: 'block'}} />
                {inModuli ? <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>{moduli}</div> : null}
                {p.schermo && !inModuli ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      WebkitMaskImage: `url(${staticFile(p.schermo.maschera)})`,
                      WebkitMaskSize: '100% 100%',
                    }}
                  >
                    <OffthreadVideo
                      src={staticFile(p.schermo.video)}
                      muted
                      style={{
                        position: 'absolute',
                        left: p.schermo.box.x * W,
                        top: p.schermo.box.y * H,
                        width: p.schermo.box.w * W,
                        height: p.schermo.box.h * H,
                        objectFit: 'cover',
                      }}
                    />
                    {/* riflesso del vetro dello schermo */}
                    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%)'}} />
                  </div>
                ) : null}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    WebkitMaskImage: `url(${staticFile(p.fronte)})`,
                    WebkitMaskSize: '100% 100%',
                    background: `linear-gradient(110deg, transparent ${riflesso - 12}%, rgba(255,255,255,0.45) ${riflesso}%, transparent ${riflesso + 12}%)`,
                    mixBlendMode: 'screen',
                  }}
                />
              </div>
              {/* dietro */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: `rotateY(180deg) translateZ(${strati * 3}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Img src={staticFile(p.retro)} style={{maxWidth: W, maxHeight: H, objectFit: 'contain'}} />
              </div>
            </>
          )}
        </div>
      </div>

      )}
      {/* nome e logo nel finale */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1330, textAlign: 'center', opacity: nomeIn, transform: `translateY(${(1 - nomeIn) * 30}px)`}}>
        <div style={{height: 3, width: 160 * nomeIn, background: p.oro, margin: '0 auto 26px'}} />
        <div style={{fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 92, letterSpacing: 4, color: '#171310'}}>{p.nome.toUpperCase()}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1530, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: logoIn}}>
        <Img src={staticFile(p.logo)} style={{width: 560}} />
        <div style={{marginTop: 22, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 34, letterSpacing: 8, color: '#171310'}}>LEDINFINITY.EU</div>
      </div>

      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(255,240,200,0.95) 0%, rgba(255,240,200,0) 55%)', opacity: lampo, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#fff', opacity: Math.max(apri * 0.0, 0)}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(apri, chiudi)}} />
    </AbsoluteFill>
  );
};

function THREE_clamp(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** cilindro di moduli LED: fuori la frutta, dentro il retro dei cabinet; si smonta tutto intorno */
const Tondo: React.FC<{q: NonNullable<ProdottoSingoloProps['tondo']>; t: number; s: number; cy: number; scala: number}> = ({q, t, s, cy, scala}) => {
  const N = q.colonne;
  const R = q.raggio;
  const w = 2 * R * Math.tan(Math.PI / N) + 1.5;
  const h = q.altezza / q.righe;
  const giro = t * 24; // gira piano su se stesso, 360° vero
  const scorri = t * 40; // il contenuto dello schermo scorre intorno
  const pano = N * (w - 1.5);
  const els: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    for (let r = 0; r < q.righe; r++) {
      const d = (i / N) * 1.3 + r * 0.18; // onda che gira intorno
      const fuori = s > 0 ? ease(THREE_clamp((s - d) / 0.9)) * (1 - ease(THREE_clamp((s - 2.4 - d) / 0.9))) : 0;
      const dy = (r - (q.righe - 1) / 2) * 70 * fuori;
      els.push(
        <div
          key={i + '_' + r}
          style={{
            position: 'absolute',
            left: -w / 2,
            top: -q.altezza / 2 + r * h,
            width: w,
            height: h,
            transformStyle: 'preserve-3d',
            transform: `rotateY(${(i * 360) / N}deg) translateY(${dy}px) translateZ(${R + 230 * fuori}px) rotateX(${(r - (q.righe - 1) / 2) * -10 * fuori}deg)`,
          }}
        >
          {/* spessore del modulo */}
          {[2, 4, 6].map((z) => (
            <div key={z} style={{position: 'absolute', inset: 0, background: '#1d1e22', transform: `translateZ(${-z}px)`}} />
          ))}
          {/* fuori: lo schermo */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              backgroundImage: `url(${staticFile(q.panorama)})`,
              backgroundSize: `${pano}px ${q.altezza}px`,
              backgroundPosition: `${-((i * (w - 1.5) + scorri) % pano)}px ${-r * h}px`,
              boxShadow: `inset 0 0 0 ${1 + 2 * fuori}px rgba(15,15,18,0.85)`,
            }}
          />
          {/* dentro: il retro del cabinet */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'translateZ(-8px) rotateY(180deg)',
              backgroundImage: `url(${staticFile(q.retro)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.8)',
              boxShadow: 'inset 0 0 0 2px #111',
            }}
          />
        </div>,
      );
    }
  }
  // anelli di struttura sopra e sotto (restano fermi mentre i moduli escono)
  for (let i = 0; i < N; i++) {
    for (const y of [-q.altezza / 2 - 10, q.altezza / 2]) {
      els.push(
        <div
          key={'a' + i + '_' + y}
          style={{
            position: 'absolute',
            left: -w / 2,
            top: y,
            width: w,
            height: 10,
            background: 'linear-gradient(#5a5c62, #2a2b30)',
            transform: `rotateY(${(i * 360) / N}deg) translateZ(${R - 12}px)`,
          }}
        />,
      );
    }
  }
  return (
    <div style={{position: 'absolute', left: 540, top: cy, width: 0, height: 0, perspective: 2400, perspectiveOrigin: '0 -200px'}}>
      <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `scale(${scala}) rotateX(-16deg) rotateY(${giro}deg)`}}>{els}</div>
    </div>
  );
};
