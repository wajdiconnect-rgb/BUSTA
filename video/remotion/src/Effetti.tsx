import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';

/** Polvere dorata che fluttua lentamente (particelle luminose con profondità). */
export const PolvereDorata: React.FC<{quante?: number; colore?: string; intensita?: number}> = ({
  quante = 70,
  colore = '255,214,140',
  intensita = 1,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const p = useMemo(
    () =>
      new Array(quante).fill(0).map((_, i) => ({
        x: random(`x${i}`) * width,
        y: random(`y${i}`) * height,
        z: 0.3 + random(`z${i}`) * 0.7, // profondità: lontane = piccole e lente
        fase: random(`f${i}`) * 100,
      })),
    [quante, width, height],
  );
  const t = frame / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {p.map((q, i) => {
        const dx = noise2D('dx', i, t * 0.15) * 60 * q.z;
        const y = (q.y - t * 28 * q.z + height * 2) % (height + 40);
        const r = 2 + 5 * q.z * q.z;
        const luce = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + q.fase))) * q.z * intensita;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: q.x + dx,
              top: y,
              width: r,
              height: r,
              borderRadius: '50%',
              background: `rgba(${colore},${luce})`,
              boxShadow: `0 0 ${r * 3}px ${r}px rgba(${colore},${luce * 0.45})`,
              filter: q.z < 0.5 ? 'blur(1.5px)' : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Grandi luci sfocate (bokeh) che si muovono piano, come in un ristorante la sera. */
export const Bokeh: React.FC<{intensita?: number}> = ({intensita = 1}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const cerchi = useMemo(
    () =>
      new Array(9).fill(0).map((_, i) => ({
        x: random(`bx${i}`) * width,
        y: random(`by${i}`) * height,
        r: 90 + random(`br${i}`) * 170,
        c: random(`bc${i}`) > 0.5 ? '255,190,110' : '255,230,190',
      })),
    [width, height],
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {cerchi.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.x + noise2D('bxx', i, t * 0.05) * 120 - c.r,
            top: c.y + noise2D('byy', i, t * 0.05) * 120 - c.r,
            width: c.r * 2,
            height: c.r * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${c.c},${0.16 * intensita}) 0%, rgba(${c.c},${0.07 * intensita}) 55%, rgba(${c.c},0) 70%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Lampo di luce calda che attraversa lo schermo (light leak), utile nei cambi scena. */
export const LuceCalda: React.FC<{da: number; durata?: number}> = ({da, durata = 24}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [da, da + durata / 2, da + durata], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (k <= 0) return null;
  const x = interpolate(frame, [da, da + durata], [-30, 130]);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: k * 0.75,
        background: `radial-gradient(ellipse 60% 90% at ${x}% 30%, rgba(255,170,80,0.55) 0%, rgba(255,120,40,0.25) 40%, rgba(0,0,0,0) 70%)`,
      }}
    />
  );
};

/** Grana pellicola leggera: dà un aspetto cinematografico e nasconde le bande di colore. */
export const Grana: React.FC<{intensita?: number}> = ({intensita = 0.06}) => {
  const frame = useCurrentFrame();
  const seme = frame % 8;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: intensita, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%">
        <filter id={`g${seme}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seme} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seme})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Vignettatura: bordi più scuri per portare l'occhio al centro. */
export const Vignetta: React.FC<{forza?: number}> = ({forza = 0.55}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${forza}) 100%)`,
    }}
  />
);

export type Parola = {testo: string; inizio: number; fine: number};

/** Sottotitoli animati parola per parola, sincronizzati con la voce (tempi in secondi). */
export const Sottotitoli: React.FC<{parole: Parola[]; colore?: string; basso?: number}> = ({
  parole,
  colore = '#C9A55C',
  basso = 560,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // raggruppa in righe brevi (max 4 parole o pausa > 0.35s)
  const righe = useMemo(() => {
    const r: Parola[][] = [];
    let cur: Parola[] = [];
    parole.forEach((p, i) => {
      const prev = parole[i - 1];
      if (cur.length >= 4 || (prev && p.inizio - prev.fine > 0.35)) {
        r.push(cur);
        cur = [];
      }
      cur.push(p);
    });
    if (cur.length) r.push(cur);
    return r;
  }, [parole]);
  const riga = righe.find((r) => t >= r[0].inizio - 0.05 && t <= r[r.length - 1].fine + 0.25);
  if (!riga) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        bottom: basso,
        textAlign: 'center',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 800,
        fontSize: 58,
        lineHeight: 1.2,
        textTransform: 'uppercase',
      }}
    >
      {riga.map((p, i) => {
        const attiva = t >= p.inizio && t <= p.fine + 0.05;
        const detta = t > p.fine;
        const s = attiva ? 1.12 : 1;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '0 10px',
              color: attiva ? colore : detta ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
              transform: `scale(${s})`,
              textShadow: '0 4px 18px rgba(0,0,0,0.85)',
            }}
          >
            {p.testo}
          </span>
        );
      })}
    </div>
  );
};
