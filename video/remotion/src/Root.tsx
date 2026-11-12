import React from 'react';
import {Composition} from 'remotion';
import {Spot, SpotProps} from './Spot';
import {Vetrina, VetrinaProps, durataVetrina} from './Vetrina';
import {Trailer, TrailerProps} from './Trailer';

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

export const RemotionRoot: React.FC = () => (
  <>
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
