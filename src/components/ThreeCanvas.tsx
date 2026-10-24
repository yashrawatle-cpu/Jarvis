import React, { useEffect, useRef } from 'react';
import { ArcReactorScene } from '../three/ArcReactorScene';
import { HologramReaction, RecognizedGesture } from '../types';

interface ThreeCanvasProps {
  audioLevel: number;
  hologramReaction: HologramReaction;
  gestureState: RecognizedGesture;
  explodedSeparation: number;
  projectionMode?: boolean;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  audioLevel,
  hologramReaction,
  gestureState,
  explodedSeparation,
  projectionMode = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ArcReactorScene | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new ArcReactorScene(mountRef.current);
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setAudioLevel(audioLevel);
  }, [audioLevel]);

  useEffect(() => {
    sceneRef.current?.setHologramReaction(hologramReaction);
  }, [hologramReaction]);

  useEffect(() => {
    sceneRef.current?.setGestureState(gestureState);
  }, [gestureState]);

  useEffect(() => {
    sceneRef.current?.setExplodedSeparation(explodedSeparation);
  }, [explodedSeparation]);

  useEffect(() => {
    sceneRef.current?.setProjectionMode(projectionMode);
  }, [projectionMode]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0"
    />
  );
};
