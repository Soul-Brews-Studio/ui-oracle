import type * as THREE from 'three';
import type { FC } from 'react';

export type SceneCtx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  THREE: typeof THREE;
};

export type SceneMount = (ctx: SceneCtx) => { tick?: () => void; dispose?: () => void };

export type CanvasPlugin =
  | { id: string; label: string; kind: 'three'; mount: SceneMount }
  | { id: string; label: string; kind: 'react'; renderer: FC };

export const plugins: CanvasPlugin[] = [];

export function findPlugin(id: string): CanvasPlugin | undefined {
  return plugins.find((p) => p.id === id);
}

export function listPlugins(): CanvasPlugin[] {
  return plugins;
}
