import React from 'react';
import {Composition} from 'remotion';
import {Spot, SpotProps} from './Spot';
import {Vetrina, VetrinaProps, durataVetrina} from './Vetrina';
import {Trailer, TrailerProps} from './Trailer';
import {Sinfonia, SinfoniaProps} from './Sinfonia';
import {SitoVivo, SitoVivoProps, durataSitoVivo} from './SitoVivo';
import {Infinity3D, Infinity3DProps} from './Infinity3D';
import {Parata3D, Parata3DProps} from './Parata3D';
import {Discesa3D, Discesa3DProps} from './Discesa3D';
import {SitoTocco, SitoToccoProps, durataSitoTocco} from './SitoTocco';

const FPS = 30;

export const defaultProps: SpotProps = {
  video: 'base.mp4',
  durata: 12,
  titolo: 'Freschezza naturale',
  sottotitolo: 'Il gusto vero, ogni giorno',
  cta: 'Scopri di più',
  marchio: 'BUSTA',
  colore: '#FFD23F',
};

const vetrinaDefault: VetrinaProps = {
  sfondo: 'sito.mp4',
  sovrapposizione: 0.6,
  oro: '#C9A55C',
  scene: [],
  finale: {logo: 'logo.png', riga1: 'Marchio', riga2: 'Nome', motto: '', sito: '', durata: 5},
};

const trailerDefault: TrailerProps = {
  oro: '#C9A55C',
  apertura: {frase: 'Frase di apertura', fine: 3},
  rivela: {video: 'a.mp4', inizio: 3, fine: 8, grande: 'Titolo', testoDa: 4},
  scena: {video: 'b.mp4', inizio: 7.6, fine: 12.4, piccolo: 'piccolo', grande: 'Grande', testoDa: 8},
  montaggio: {inizio: 12.4, fine: 15.6, foto: [], frase: ''},
  finale: {inizio: 16.4, logo: 'logo.png', riga1: 'Marchio', riga2: 'Nome', slogan1: '', slogan1Da: 18.5, slogan2: '', slogan2Da: 20.2, sito: '', sitoDa: 21.5},
  colpi: [3.2],
  durata: 25,
};

const sinfoniaDefault: SinfoniaProps = {
  oro: '#C9A55C', sfondo: 'sito.mp4', logo: 'logo.png', battuta: 0.833, durata: 27,
  intro: {fine: 4, riga1: 'Salumi', riga2: 'Seicolli'},
  prosciutto: {img: 'prosciutto.png', grissini: 'grissini.png', inizio: 3.8, fine: 11.5, piccolo: '', grande: ''},
  fette: {img: 'fette.png', inizio: 11, fine: 17, piccolo: '', grande: ''},
  chef: {img: 'chef.png', inizio: 16.4, fine: 21.6, piccolo: '', grande: ''},
  finale: {inizio: 21, riga1: 'Salumi', riga2: 'Seicolli', motto: '', slogan: '', sloganDa: 24, sito: ''},
};

const sitoDefault: SitoVivoProps = {
  oro: '#C9A55C', logo: 'logo.png', marchio: 'Marchio', scorrimento: 0.7, pagine: [],
  finale: {titolo: '', slogan: '', pulsante: '', sito: '', durata: 5},
};

const infinityDefault: Infinity3DProps = {
  contenuto: 'contenuto.png', logoSchermo: 'logo_schermo.png', sito: 'ledinfinity.eu', oro: '#D4A64A', durata: 22,
};

const parataDefault: Parata3DProps = {sfondo: 'sito.mp4', prodotti: [], logo: 'logo.png', passo: 3.5, durata: 25};

const discesaDefault: Discesa3DProps = {sfondo: 'sito.mp4', prodotto: 'p.png', altezza: 1.5, logo: 'logo.png', fermate: [2.0, 1.0, 0.1], durata: 22};

const toccoDefault: SitoToccoProps = {alto: [], sfondoBanda: '#efe6d6', bandaY: 3070, cardW: 337, cardH: 1042, passoCard: 357, schede: [], logo: 'logo.png', durata: 28};

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="SitoTocco"
    component={SitoTocco}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={840}
    defaultProps={toccoDefault}
    calculateMetadata={({props}) => ({durationInFrames: Math.round((props.durata || durataSitoTocco(props.schede.length)) * FPS)})}
  />
  <Composition
    id="Discesa3D"
    component={Discesa3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={660}
    defaultProps={discesaDefault}
    calculateMetadata={({props}) => ({durationInFrames: Math.round(props.durata * FPS)})}
  />
  <Composition
    id="Parata3D"
    component={Parata3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={750}
    defaultProps={parataDefault}
    calculateMetadata={({props}) => ({durationInFrames: Math.round(props.durata * FPS)})}
  />
  <Composition
    id="Infinity3D"
    component={Infinity3D}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={660}
    defaultProps={infinityDefault}
    calculateMetadata={({props}) => ({durationInFrames: Math.round(props.durata * FPS)})}
  />
  <Composition
    id="SitoVivo"
    component={SitoVivo}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={600}
    defaultProps={sitoDefault}
    calculateMetadata={({props}) => ({durationInFrames: Math.round(durataSitoVivo(props) * FPS)})}
  />
  <Composition
    id="Sinfonia"
    component={Sinfonia}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={810}
    defaultProps={sinfoniaDefault}
    calculateMetadata={({props}) => ({durationInFrames: Math.round(props.durata * FPS)})}
  />
  <Composition
    id="Trailer"
    component={Trailer}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={750}
    defaultProps={trailerDefault}
    calculateMetadata={({props}) => ({durationInFrames: Math.round(props.durata * FPS)})}
  />
  <Composition
    id="Vetrina"
    component={Vetrina}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={150}
    defaultProps={vetrinaDefault}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.max(1, Math.round(durataVetrina(props) * FPS)),
    })}
  />
  <Composition
    id="Spot"
    component={Spot}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={defaultProps.durata * FPS}
    defaultProps={defaultProps}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.max(1, Math.round(props.durata * FPS)),
    })}
  />
  </>
);
