import React from 'react';
import {Composition} from 'remotion';
import {Spot, SpotProps} from './Spot';

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

export const RemotionRoot: React.FC = () => (
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
);
