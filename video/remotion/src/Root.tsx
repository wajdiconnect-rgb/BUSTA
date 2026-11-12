import React from 'react';
import {Composition} from 'remotion';
import {Spot, SpotProps} from './Spot';
import {Vetrina, VetrinaProps, durataVetrina} from './Vetrina';

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

export const RemotionRoot: React.FC = () => (
  <>
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
