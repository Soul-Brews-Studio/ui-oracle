import type * as THREE from 'three';
import type { FC } from 'react';
import { mount as cubeMount } from '../../plugins/three/cube';
import { mount as waveMount } from '../../plugins/three/wave';
import { mount as torusMount } from '../../plugins/three/torus';
import { mount as galaxyMount } from '../../plugins/three/galaxy';
import { mount as solarMount } from '../../plugins/three/solar';
import { mount as graph3dMount } from '../../plugins/three/graph3d';
import { mount as map3dMount } from '../../plugins/three/map3d';
import { MapPlugin } from '../../plugins/react/MapPlugin';
import { PlanetsPlugin } from '../../plugins/react/PlanetsPlugin';

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

export const plugins: CanvasPlugin[] = [
  { id: 'map', label: 'Map', kind: 'react', renderer: MapPlugin },
  { id: 'planets', label: 'Planets', kind: 'react', renderer: PlanetsPlugin },
  { id: 'wave', label: 'Wave', kind: 'three', mount: waveMount },
  { id: 'cube', label: 'Cube', kind: 'three', mount: cubeMount },
  { id: 'torus', label: 'Torus', kind: 'three', mount: torusMount },
  { id: 'galaxy', label: 'Galaxy', kind: 'three', mount: galaxyMount },
  { id: 'solar', label: 'Solar', kind: 'three', mount: solarMount },
  { id: 'graph3d', label: 'Graph 3D', kind: 'three', mount: graph3dMount },
  { id: 'map3d', label: 'Map 3D', kind: 'three', mount: map3dMount },
];

export const DEFAULT_PLUGIN_ID = 'map';

export function findPlugin(id: string): CanvasPlugin | undefined {
  return plugins.find((p) => p.id === id);
}

export function listPlugins(): CanvasPlugin[] {
  return plugins;
}
