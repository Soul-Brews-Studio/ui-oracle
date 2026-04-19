import type { SceneMount } from '../../lib/plugins/registry';
import { apiUrl } from '../../api/host';

type GraphNode = { id: string; type: string; concepts?: string[] };

const FALLBACK_NODES: GraphNode[] = [
  { id: 'p1', type: 'principle', concepts: ['nothing-deleted'] },
  { id: 'p2', type: 'principle', concepts: ['patterns-over-intentions'] },
  { id: 'p3', type: 'principle', concepts: ['external-brain'] },
  { id: 'p4', type: 'principle', concepts: ['curiosity'] },
  { id: 'p5', type: 'principle', concepts: ['form-formless'] },
  { id: 'p6', type: 'principle', concepts: ['oracle-rule-6'] },
  { id: 'l1', type: 'learning', concepts: ['federation'] },
  { id: 'l2', type: 'learning', concepts: ['federation', 'maw'] },
  { id: 'l3', type: 'learning', concepts: ['three-js'] },
  { id: 'l4', type: 'learning', concepts: ['three-js', 'plugins'] },
  { id: 'l5', type: 'learning', concepts: ['plugins'] },
  { id: 'l6', type: 'learning', concepts: ['astro'] },
  { id: 'l7', type: 'learning', concepts: ['astro', 'bun'] },
  { id: 'l8', type: 'learning', concepts: ['bun'] },
  { id: 'l9', type: 'learning', concepts: ['wireguard'] },
  { id: 'l10', type: 'learning', concepts: ['ssh', 'wireguard'] },
  { id: 'r1', type: 'retro', concepts: ['federation'] },
  { id: 'r2', type: 'retro', concepts: ['plugins'] },
  { id: 'r3', type: 'retro', concepts: ['oracle'] },
];

const TYPE_COLOR: Record<string, number> = {
  principle: 0x7c3aed,
  learning: 0x22d3ee,
  retro: 0xf472b6,
};
const DEFAULT_COLOR = 0x64748b;
const RADIUS = 5;

async function fetchGraph(): Promise<GraphNode[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 2000);
  try {
    const res = await fetch(apiUrl('/api/graph'), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.nodes?.length) throw new Error('empty');
    return data.nodes;
  } finally {
    clearTimeout(t);
  }
}

function anchorFor(index: number, total: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  return [
    RADIUS * Math.sin(phi) * Math.cos(theta),
    RADIUS * Math.sin(phi) * Math.sin(theta),
    RADIUS * Math.cos(phi),
  ];
}

export const mount: SceneMount = ({ scene, camera, THREE }) => {
  camera.position.z = 12;

  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const build = (nodes: GraphNode[]) => {
    const concepts: string[] = [];
    const conceptIdx = new Map<string, number>();
    for (const n of nodes) {
      const c = n.concepts?.[0] ?? '_';
      if (!conceptIdx.has(c)) {
        conceptIdx.set(c, concepts.length);
        concepts.push(c);
      }
    }
    const positions = new Float32Array(nodes.length * 3);
    const colors = new Float32Array(nodes.length * 3);
    const tmpColor = new THREE.Color();
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const ci = conceptIdx.get(n.concepts?.[0] ?? '_')!;
      const [ax, ay, az] = anchorFor(ci, concepts.length);
      positions[i * 3 + 0] = ax + (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 1] = ay + (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 2] = az + (Math.random() - 0.5) * 0.6;
      tmpColor.setHex(TYPE_COLOR[n.type] ?? DEFAULT_COLOR);
      colors[i * 3 + 0] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  };

  build(FALLBACK_NODES);
  fetchGraph()
    .then((nodes) => build(nodes))
    .catch(() => {});

  return {
    tick() {
      points.rotation.y += 0.0015;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
};
