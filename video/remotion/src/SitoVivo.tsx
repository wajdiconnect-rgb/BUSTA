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
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/400-italic.css';
import {PolvereDorata} from './Effetti';

/**
 * "SitoVivo": il sito del cliente che prende vita (stile landing page animata).
 * Ogni pagina ha titolo grande, testo, pulsante e un media che si muove davvero
 * (clip AI, foto 3D, clip trasparente che "esce" dalla pagina). Le pagine scorrono
 * verso l'alto come quando si naviga. Niente computer: il sito è a tutto schermo.
 */
export type Pagina = {
  etichetta: string;
  titolo: string; // usa \n per andare a capo
  testo: string;
  pulsante?: string;
  media: string; // video in public
  tipo: 'scheda' | 'esce'; // scheda = dentro un riquadro; esce = trasparente, sborda dalla pagina
  larghezzaMedia?: number; // solo 'esce': larghezza del video trasparente (default 1020)
  topMedia?: number; // solo 'esce': posizione verticale (default 720)
  durata: number; // secondi sulla pagina
};

export type SitoVivoProps = {
  oro: string;
  logo: string;
  marchio: string;
  pagine: Pagina[];
  finale: {titolo: string; slogan: string; pulsante: string; sito: string; durata: number};
  scorrimento: number; // secondi del passaggio da una pagina all'altra
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FONDO = '#141210';

const Intestazione: React.FC<{logo: string; oro: string}> = ({logo, oro}) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 170,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(20,18,16,0.95), rgba(20,18,16,0.0))',
      zIndex: 10,
    }}
  >
    <Img src={staticFile(logo)} style={{height: 92, marginTop: 10}} />
    <div style={{position: 'absolute', right: 56, top: 70, width: 52}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{height: 4, background: '#EDE6DA', marginBottom: 11, borderRadius: 2}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: 56, top: 74, display: 'flex', gap: 18}}>
      {['f', 'ig'].map((s) => (
        <div
          key={s}
          style={{width: 34, height: 34, borderRadius: 8, border: `2px solid ${oro}`, opacity: 0.7}}
        />
      ))}
    </div>
  </div>
);

const PaginaVista: React.FC<{p: Pagina; oro: string; locale: number; tot: number}> = ({p, oro, locale, tot}) => {
  const {fps} = useVideoConfig();
  const a = (d: number, n = 20) =>
    interpolate(locale, [d, d + n], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const et = a(8);
  const ti = a(14, 26);
  const te = a(26);
  const pu = spring({frame: locale - 34, fps, config: {damping: 14}});
  const media = a(4, 30);
  const t = locale / fps;
  return (
    <AbsoluteFill style={{background: FONDO}}>
      {/* testo in alto, come una landing page */}
      <div style={{position: 'absolute', left: 80, right: 80, top: 230}}>
        <div style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: 28, letterSpacing: 10, color: oro, opacity: et}}>
          {p.etichetta.toUpperCase()}
        </div>
        <div style={{height: 2, width: 120 * et, background: oro, margin: '20px 0 26px'}} />
        <div
          style={{
            fontFamily: 'Montserrat',
            fontWeight: 800,
            fontSize: 92,
            lineHeight: 1.02,
            color: '#F4EEE3',
            textTransform: 'uppercase',
            whiteSpace: 'pre-line',
            clipPath: `inset(0 ${100 - ti * 100}% 0 0)`,
          }}
        >
          {p.titolo}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 40,
            color: '#CFC6B8',
            opacity: te,
            transform: `translateY(${(1 - te) * 20}px)`,
            maxWidth: 820,
          }}
        >
          {p.testo}
        </div>
        {p.pulsante ? (
          <div
            style={{
              marginTop: 34,
              display: 'inline-block',
              background: oro,
              color: '#17120c',
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: 32,
              padding: '20px 46px',
              borderRadius: 999,
              transform: `scale(${pu})`,
              transformOrigin: 'left center',
            }}
          >
            {p.pulsante}
          </div>
        ) : null}
      </div>

      {p.tipo === 'scheda' ? (
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            top: 860,
            height: 960,
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: '0 40px 90px rgba(0,0,0,0.7)',
            opacity: media,
            transform: `translateY(${(1 - media) * 120}px) scale(${1.0 + 0.03 * Math.sin(t * 0.6)})`,
          }}
        >
          <OffthreadVideo src={staticFile(p.media)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <AbsoluteFill style={{boxShadow: `inset 0 0 0 2px rgba(201,165,92,0.35)`, borderRadius: 28}} />
        </div>
      ) : (
        <>
          {/* riquadro "vetrina" su cui il prodotto si appoggia e da cui esce */}
          <div
            style={{
              position: 'absolute',
              left: 70,
              right: 70,
              top: 1150,
              height: 680,
              borderRadius: 28,
              background: 'radial-gradient(ellipse at 50% 30%, #3a2c20 0%, #1d1611 75%)',
              boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
              opacity: media,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: (1080 - (p.larghezzaMedia ?? 1020)) / 2,
              width: p.larghezzaMedia ?? 1020,
              top: p.topMedia ?? 720,
              opacity: media,
              filter: 'drop-shadow(0 40px 40px rgba(0,0,0,0.6))',
            }}
          >
            <OffthreadVideo src={staticFile(p.media)} transparent muted style={{width: '100%'}} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

const Finale: React.FC<{f: SitoVivoProps['finale']; logo: string; oro: string; locale: number; marchio: string}> = ({
  f,
  logo,
  oro,
  locale,
}) => {
  const {fps} = useVideoConfig();
  const a = (d: number, n = 24) =>
    interpolate(locale, [d, d + n], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const logoIn = spring({frame: locale - 6, fps, config: {damping: 200, mass: 1.4}});
  const luce = interpolate(locale, [26, 60], [-40, 150], clamp);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #2a1f17 0%, ${FONDO} 70%)`}}>
      <div style={{position: 'absolute', top: 420, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            position: 'relative',
            width: 340,
            height: 338,
            opacity: logoIn,
            transform: `scale(${0.8 + 0.2 * logoIn})`,
            WebkitMaskImage: `url(${staticFile(logo)})`,
            WebkitMaskSize: '100% 100%',
          }}
        >
          <Img src={staticFile(logo)} style={{width: '100%', height: '100%'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${luce - 18}%, rgba(255,245,215,0.9) ${luce}%, transparent ${luce + 18}%)`,
              mixBlendMode: 'screen',
            }}
          />
        </div>
      </div>
      <div style={{position: 'absolute', top: 820, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontFamily: 'Montserrat', fontWeight: 600, fontSize: 32, letterSpacing: 42, paddingLeft: 42, color: oro, opacity: a(20)}}>
          SALUMI
        </div>
        <div style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 78, letterSpacing: 16, paddingLeft: 16, color: oro, opacity: a(24)}}>
          SEICOLLI
        </div>
        <div
          style={{
            marginTop: 60,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 46,
            color: '#E9E1D3',
            opacity: a(40),
            padding: '0 70px',
          }}
        >
          {f.titolo}
        </div>
        <div
          style={{
            marginTop: 60,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 600,
            fontSize: 74,
            lineHeight: 1.12,
            color: oro,
            whiteSpace: 'pre-line',
            opacity: a(70, 30),
            filter: `blur(${(1 - a(70, 30)) * 8}px)`,
          }}
        >
          {f.slogan.replace(/,\s*/, ',\n')}
        </div>
        <div
          style={{
            marginTop: 60,
            display: 'inline-block',
            background: oro,
            color: '#17120c',
            fontFamily: 'Montserrat',
            fontWeight: 600,
            fontSize: 34,
            padding: '22px 52px',
            borderRadius: 999,
            transform: `scale(${spring({frame: locale - 110, fps, config: {damping: 12}})})`,
          }}
        >
          {f.pulsante}
        </div>
        <div style={{marginTop: 30, fontFamily: 'Montserrat', fontWeight: 400, fontSize: 32, color: '#CFC6B8', opacity: a(120)}}>
          {f.sito}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Locale: React.FC<{children: (f: number) => React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <>{children(f)}</>;
};

export const SitoVivo: React.FC<SitoVivoProps> = ({oro, logo, marchio, pagine, finale, scorrimento}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const sc = Math.round(scorrimento * fps);
  // inizio di ogni pagina (in frame)
  const inizi: number[] = [];
  let acc = 0;
  for (const p of pagine) {
    inizi.push(acc);
    acc += Math.round(p.durata * fps);
  }
  const inizioFinale = acc;
  const tutte = [...pagine.map((p, i) => ({i, inizio: inizi[i], dur: Math.round(p.durata * fps)})), {i: -1, inizio: inizioFinale, dur: Math.round(finale.durata * fps)}];

  // scorrimento: la pagina k occupa y = k*1920; la "camera" scende di pagina in pagina
  let y = 0;
  tutte.forEach((b, k) => {
    if (k === 0) return;
    const s = interpolate(frame, [b.inizio - sc, b.inizio], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    y += s * 1920;
  });
  const nero = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: FONDO, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, transform: `translateY(${-y}px)`}}>
        {tutte.map((b, k) => (
          <div key={k} style={{position: 'absolute', top: k * 1920, left: 0, width: 1080, height: 1920, overflow: 'visible'}}>
            <Sequence from={Math.max(0, b.inizio - sc)} durationInFrames={b.dur + (k === 0 ? 0 : sc)} layout="none">
              <Locale>
                {(locale) =>
                  b.i >= 0 ? (
                    <PaginaVista p={pagine[b.i]} oro={oro} locale={locale + (k === 0 ? sc : 0)} tot={b.dur} />
                  ) : (
                    <Finale f={finale} logo={logo} oro={oro} locale={locale - sc} marchio={marchio} />
                  )
                }
              </Locale>
            </Sequence>
          </div>
        ))}
      </div>
      <Intestazione logo={logo} oro={oro} />
      <PolvereDorata quante={45} intensita={0.7} />
      <AbsoluteFill style={{background: '#000', opacity: nero}} />
    </AbsoluteFill>
  );
};

export const durataSitoVivo = (p: SitoVivoProps) => p.pagine.reduce((t, x) => t + x.durata, 0) + p.finale.durata;
