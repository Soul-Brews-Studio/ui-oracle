import { useState, useRef, useEffect } from 'react';
import { useNavTo } from '@ui-oracle/shared-ui';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { getMap, getMap3d, getStats, getOracles, search } from '../api/oracle';
import type { MapDocument, Stats, OracleProject } from '../api/oracle';

const TYPE_COLORS: Record<string, string> = {
  principle: '#60a5fa',
  learning: '#a78bfa',
  retro: '#fbbf24',
  unknown: '#666666',
};

const TYPE_COLORS_NUM: Record<string, number> = {
  principle: 0x60a5fa,
  learning: 0xa78bfa,
  retro: 0xfbbf24,
  unknown: 0x666666,
};

// Globe colors — unique tint per engine
const GLOBE_COLORS: Record<string, number> = {
  'bge-m3': 0x6a5acd,   // slate indigo (original)
  'nomic': 0x2dd4bf,     // teal
  'qwen3': 0xfb923c,     // orange
};

// Positions for globes (first is center/origin, rest spread out)
const GLOBE_POSITIONS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),        // center (default)
  new THREE.Vector3(-22, 14, 0),     // top left
  new THREE.Vector3(22, 14, 0),      // top right
  new THREE.Vector3(0, -18, 0),      // bottom center
];

// Damped spring tween
function cdsTween(state: { x: number; v: number }, target: number, speed: number, dt: number) {
  const n1 = state.v - (state.x - target) * (speed * speed * dt);
  const n2 = 1 + speed * dt;
  const nv = n1 / (n2 * n2);
  return { x: state.x + nv * dt, v: nv };
}

function xxhash(seed: number, data: number): number {
  let h = ((seed + 374761393) >>> 0);
  h = ((h + (data * 3266489917 >>> 0)) >>> 0);
  h = ((((h << 17) | (h >>> 15)) * 668265263) >>> 0);
  h ^= h >>> 15;
  h = ((h * 2246822519) >>> 0);
  h ^= h >>> 13;
  h = ((h * 3266489917) >>> 0);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function ageScale(createdAt: string | null): number {
  if (!createdAt) return 0.7;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 7) return 1.3;
  if (ageDays < 30) return 1.0;
  return 0.7;
}

/** How the document cloud is drawn: sphere instances, or a GPU point cloud. */
type RenderMode = 'spheres' | 'points';

interface GlobeData {
  key: string;
  model: string;
  count: number;
  documents: MapDocument[];
  center: THREE.Vector3;
}

export function Map() {
  const navigate = useNavTo();
  const containerRef = useRef<HTMLDivElement>(null);
  const [globes, setGlobes] = useState<GlobeData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oracleProjects, setOracleProjects] = useState<OracleProject[]>([]);
  const [totalOracles, setTotalOracles] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIds, setMatchIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(['principle', 'learning', 'retro']));
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // --- Render mode: sphere instances vs point cloud -------------------------
  // Spheres are InstancedMesh over a 10×10 SphereGeometry — ~80 triangles per
  // doc, so 35k docs is ~2.8M triangles every frame even though it is a single
  // draw call. The point cloud draws 1 vertex per doc instead (~80× less GPU
  // work) and reproduces the same look with a soft round mask in the fragment
  // shader. Above the threshold we pick points automatically; the user can pin
  // either mode and that choice wins and persists.
  const AUTO_POINTS_THRESHOLD = 20000;
  const [modeOverride, setModeOverride] = useState<RenderMode | null>(() => {
    const v = localStorage.getItem('map:renderMode');
    return v === 'points' || v === 'spheres' ? v : null;
  });
  const totalDocs = globes.reduce((sum, g) => sum + g.documents.length, 0);
  const autoMode: RenderMode = totalDocs > AUTO_POINTS_THRESHOLD ? 'points' : 'spheres';
  const renderMode: RenderMode = modeOverride ?? autoMode;
  const toggleRenderMode = () => {
    const next: RenderMode = renderMode === 'points' ? 'spheres' : 'points';
    // Pinning back to whatever auto would have chosen clears the override, so
    // the map resumes following the doc count as the corpus grows.
    if (next === autoMode) {
      localStorage.removeItem('map:renderMode');
      setModeOverride(null);
    } else {
      localStorage.setItem('map:renderMode', next);
      setModeOverride(next);
    }
  };

  const visibleTypesRef = useRef<Set<string>>(new Set(['principle', 'learning', 'retro']));
  const selectedProjectRef = useRef<string | null>(null);
  const matchIdsRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);
  // Rebuilds the STATIC instance matrices + emissive/alpha attributes whenever
  // search / filter / visibility / hover state changes (NOT per frame).
  const rebuildRef = useRef<(() => void) | null>(null);
  // Flat list of every node's static base position + doc, for the "center on
  // visible" button (raycast/hover no longer use per-doc THREE.Mesh objects).
  const nodesRef = useRef<{ basePos: THREE.Vector3; doc: MapDocument }[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mouseNDC = useRef(new THREE.Vector2(10, 10));
  const labelsRef = useRef<HTMLDivElement>(null);

  // Camera orbit state
  const camAngleX = useRef({ x: 0, v: 0 });
  const camAngleY = useRef({ x: 0.3, v: 0 });
  const camDist = useRef({ x: 28, v: 0 });
  const targetAngleX = useRef(0);
  const targetAngleY = useRef(0.3);
  const targetDist = useRef(28);
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));
  const targetCenter = useRef(new THREE.Vector3(0, 0, 0));
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => { matchIdsRef.current = matchIds; }, [matchIds]);
  useEffect(() => { visibleTypesRef.current = visibleTypes; }, [visibleTypes]);
  useEffect(() => { selectedProjectRef.current = selectedProject; }, [selectedProject]);

  // Any state that changes a dot's static appearance (match-scale, hidden
  // scale-0, fade, hover glow) rebuilds the instance buffers once — the animate
  // loop no longer recomputes them every frame.
  // Rebuild static instance matrices/attributes only on coarse state changes.
  // NOT on hoveredDoc — the dot under the cursor is already highlighted by the
  // GPU magnify glow, so hover must not trigger an O(n) rebuild (that was the
  // per-frame cost we just removed).
  useEffect(() => { rebuildRef.current?.(); }, [matchIds, visibleTypes, selectedProject]);

  const [loadingModel, setLoadingModel] = useState<string | null>(null);

  // Load data — bge-m3 as initial globe
  useEffect(() => {
    Promise.all([
      getMap3d('bge-m3').catch(() => getMap().then(d => ({ ...d, pca_info: undefined }))).catch(() => ({ documents: [], total: 0 })),
      getStats().catch(() => null),
      getOracles().catch(() => ({ projects: [], total_projects: 0, identities: [], total_identities: 0 })),
    ]).then(([mapData, statsData, oraclesData]) => {
      setStats(statsData);
      setOracleProjects(oraclesData.projects);
      setTotalOracles(oraclesData.total_projects);
      setGlobes([{
        key: 'bge-m3',
        model: 'BAAI/bge-m3',
        count: mapData.documents.length,
        documents: mapData.documents,
        center: new THREE.Vector3(0, 0, 0),
      }]);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  // Add a new globe for a specific engine
  async function addGlobe(key: string, model: string) {
    if (globes.some(g => g.key === key) || loadingModel) return;
    setLoadingModel(key);
    try {
      const data = await getMap3d(key);
      if (data.documents.length === 0) return;
      // Position: use next available slot in triangle
      const idx = globes.length;
      const center = GLOBE_POSITIONS[idx % GLOBE_POSITIONS.length].clone();
      setGlobes(prev => [...prev, {
        key,
        model,
        count: data.documents.length,
        documents: data.documents,
        center,
      }]);
      // Zoom out to see all globes
      targetDist.current = 55;
    } catch (e: any) {
      console.error('Failed to load globe:', e);
    } finally {
      setLoadingModel(null);
    }
  }

  // Three.js scene setup — multi-globe
  useEffect(() => {
    const container = containerRef.current;
    if (!container || globes.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020208);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 2000);
    camera.position.z = 28;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.8,   // strength
      0.4,   // radius
      0.2,   // threshold
    );
    composer.addPass(bloomPass);

    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(5, 5, 5);
    scene.add(directional);

    // Star field
    const starCount = 4000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let si = 0; si < starCount; si++) {
      starPositions[si * 3] = (Math.random() - 0.5) * 800;
      starPositions[si * 3 + 1] = (Math.random() - 0.5) * 800;
      starPositions[si * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Shared base geometry (cloned per globe so each can carry its own
    // per-instance attribute arrays).
    const nodeGeometry = new THREE.SphereGeometry(0.05, 10, 10);
    const globeMeshes: THREE.LineSegments[] = [];
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reusable scratch object for composing per-instance matrices.
    const instDummy = new THREE.Object3D();

    // Shader uniform bundles (one per globe material). The animate loop writes
    // uTime / uMouse / uEmissiveScale / uAspect into these every frame — the
    // ONLY per-frame work that touches the instance clouds.
    interface DocUniforms {
      uTime: { value: number };
      uMouse: { value: THREE.Vector2 };
      uAspect: { value: number };
      uEmissiveScale: { value: number };
    }
    const docUniforms: DocUniforms[] = [];

    // MeshStandardMaterial exposes no per-instance emissive / opacity / colour,
    // and no way to jitter/magnify instances on the GPU. We inject instanced
    // attributes AND uniforms into the shader so all per-frame per-instance work
    // (floating jitter + dock-magnify) runs on the vertex shader instead of a
    // CPU O(n) loop. The animate loop only pokes the uniforms (a handful of
    // scalars) each frame — never the per-instance buffers.
    //
    // Instanced attributes:
    //   aInstColor      (vec3)  -> diffuse tint + emissive glow colour
    //   aEmissive       (float) -> unscaled emissive base (faded 0.1 / hover 1.2)
    //   aEmissiveScaled (float) -> emissive base multiplied by uEmissiveScale (zoom)
    //   aAlpha          (float) -> per-instance opacity (search fade)
    //   aSeed           (float) -> per-instance jitter seed
    //
    // Uniforms (updated per-frame, ~free):
    //   uTime, uMouse (NDC), uAspect, uEmissiveScale, uJitterAmp
    //   uMagnifyRadius (0.5), uMagnifyStrength (0.6)
    const aspect0 = width / height;
    function makeInstancedDocMaterial(): THREE.MeshStandardMaterial {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 1.0,
      });
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uMouse = { value: new THREE.Vector2(10, 10) };
        shader.uniforms.uAspect = { value: aspect0 };
        shader.uniforms.uEmissiveScale = { value: 1.0 };
        shader.uniforms.uJitterAmp = { value: prefersReduced ? 0 : 1 };
        shader.uniforms.uMagnifyRadius = { value: 0.5 };
        shader.uniforms.uMagnifyStrength = { value: 0.6 };
        docUniforms.push(shader.uniforms as unknown as DocUniforms);

        shader.vertexShader =
          'uniform float uTime;\nuniform vec2 uMouse;\nuniform float uAspect;\n' +
          'uniform float uJitterAmp;\nuniform float uMagnifyRadius;\nuniform float uMagnifyStrength;\n' +
          'attribute vec3 aInstColor;\nattribute float aEmissive;\nattribute float aEmissiveScaled;\nattribute float aAlpha;\nattribute float aSeed;\n' +
          'varying vec3 vInstColor;\nvarying float vEmissive;\nvarying float vEmissiveScaled;\nvarying float vAlpha;\nvarying float vMagnify;\n' +
          shader.vertexShader
            .replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\n' +
              '\tvInstColor = aInstColor;\n\tvEmissive = aEmissive;\n\tvEmissiveScaled = aEmissiveScaled;\n\tvAlpha = aAlpha;\n' +
              // Dock-magnify: project the instance CENTRE to NDC and measure the
              // aspect-corrected screen distance to the cursor, then grow the
              // local vertex outward in place (before instanceMatrix is applied
              // in <project_vertex>).
              '\tvec4 centerClip = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n' +
              '\tvec2 centerNdc = centerClip.xy / centerClip.w;\n' +
              '\tfloat dxm = (centerNdc.x - uMouse.x) * uAspect;\n' +
              '\tfloat dym = (centerNdc.y - uMouse.y);\n' +
              '\tfloat sdist = sqrt(dxm * dxm + dym * dym);\n' +
              '\tfloat magnify = sdist < uMagnifyRadius ? 1.0 + uMagnifyStrength * pow(1.0 - sdist / uMagnifyRadius, 2.0) : 1.0;\n' +
              '\tvMagnify = magnify;\n' +
              '\ttransformed *= magnify;\n' +
              // Per-instance floating jitter (cheap hash + sin, ±0.12 x/y, ±0.06 z).
              '\tfloat s1 = fract(sin(aSeed * 12.9898) * 43758.5453);\n' +
              '\tfloat s2 = fract(sin(aSeed * 78.2330) * 43758.5453);\n' +
              '\tfloat s3 = fract(sin(aSeed * 37.7190) * 43758.5453);\n' +
              '\tvec3 jitterOffset = uJitterAmp * vec3(\n' +
              '\t\tsin(uTime * 0.9 + s1 * 6.2831) * 0.12,\n' +
              '\t\tsin(uTime * 1.1 + s2 * 6.2831) * 0.12,\n' +
              '\t\tsin(uTime * 0.7 + s3 * 6.2831) * 0.06);',
            )
            .replace(
              '#include <project_vertex>',
              'vec4 mvPosition = vec4( transformed, 1.0 );\n' +
              '#ifdef USE_INSTANCING\n\tmvPosition = instanceMatrix * mvPosition;\n#endif\n' +
              '\tmvPosition.xyz += jitterOffset;\n' +
              '\tmvPosition = modelViewMatrix * mvPosition;\n' +
              '\tgl_Position = projectionMatrix * mvPosition;',
            );
        shader.fragmentShader =
          'uniform float uEmissiveScale;\n' +
          'varying vec3 vInstColor;\nvarying float vEmissive;\nvarying float vEmissiveScaled;\nvarying float vAlpha;\nvarying float vMagnify;\n' +
          shader.fragmentShader
            .replace(
              '#include <color_fragment>',
              '#include <color_fragment>\n\tdiffuseColor.rgb *= vInstColor;\n\tdiffuseColor.a *= vAlpha;',
            )
            .replace(
              '#include <emissivemap_fragment>',
              '#include <emissivemap_fragment>\n' +
              '\ttotalEmissiveRadiance += vInstColor * (vEmissive + vEmissiveScaled * uEmissiveScale + (vMagnify - 1.0) * 0.6);',
            );
      };
      return material;
    }

    // Point-cloud counterpart of makeInstancedDocMaterial. Same inputs (colour,
    // emissive, alpha, seed) and the same jitter + dock-magnify maths, but one
    // vertex per doc instead of a sphere, so the GPU rasterises ~80× less. The
    // round dot is a mask in the fragment shader; brightness feeds the existing
    // bloom pass exactly like the spheres' emissive did.
    //
    // Extra per-point attribute: aScale (baseScale × matched 1.4 × hidden 0) —
    // the point-cloud stand-in for the instance matrix's scale.
    const pointsMaterials: THREE.ShaderMaterial[] = [];
    function makeDocPointsMaterial(): THREE.ShaderMaterial {
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: true,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(10, 10) },
          uAspect: { value: aspect0 },
          uEmissiveScale: { value: 1.0 },
          uJitterAmp: { value: prefersReduced ? 0 : 1 },
          uMagnifyRadius: { value: 0.5 },
          uMagnifyStrength: { value: 0.6 },
          uViewportHeight: { value: height },
        },
        vertexShader: `
uniform float uTime;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uEmissiveScale;
uniform float uJitterAmp;
uniform float uMagnifyRadius;
uniform float uMagnifyStrength;
uniform float uViewportHeight;

attribute vec3 aInstColor;
attribute float aEmissive;
attribute float aEmissiveScaled;
attribute float aAlpha;
attribute float aSeed;
attribute float aScale;

varying vec3 vDotColor;
varying float vDotAlpha;
varying float vBright;

void main() {
  // Per-point floating jitter — same hash + amplitudes as the sphere shader.
  float s1 = fract(sin(aSeed * 12.9898) * 43758.5453);
  float s2 = fract(sin(aSeed * 78.2330) * 43758.5453);
  float s3 = fract(sin(aSeed * 37.7190) * 43758.5453);
  vec3 pos = position + uJitterAmp * vec3(
    sin(uTime * 0.9 + s1 * 6.2831) * 0.12,
    sin(uTime * 1.1 + s2 * 6.2831) * 0.12,
    sin(uTime * 0.7 + s3 * 6.2831) * 0.06);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vec4 clip = projectionMatrix * mvPosition;

  // Dock-magnify: aspect-corrected screen distance from the cursor.
  vec2 ndc = clip.xy / clip.w;
  float dxm = (ndc.x - uMouse.x) * uAspect;
  float dym = ndc.y - uMouse.y;
  float sdist = sqrt(dxm * dxm + dym * dym);
  float magnify = sdist < uMagnifyRadius
    ? 1.0 + uMagnifyStrength * pow(1.0 - sdist / uMagnifyRadius, 2.0)
    : 1.0;

  vDotColor = aInstColor;
  vDotAlpha = aAlpha;
  vBright = aEmissive + aEmissiveScaled * uEmissiveScale + (magnify - 1.0) * 0.6;

  gl_Position = clip;
  // Match the sphere's world radius (0.05) under perspective: project the
  // diameter to pixels. aScale == 0 (hidden) yields size 0 → never rasterised.
  float worldSize = 0.05 * 2.0 * aScale * magnify;
  float px = worldSize * uViewportHeight * 0.5 * projectionMatrix[1][1] / max(0.0001, -mvPosition.z);
  gl_PointSize = clamp(px, 0.0, 64.0);
}`,
        fragmentShader: `
varying vec3 vDotColor;
varying float vDotAlpha;
varying float vBright;

void main() {
  // Round, soft-edged dot.
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float edge = smoothstep(0.5, 0.34, d);
  vec3 col = vDotColor * (0.35 + vBright);
  gl_FragColor = vec4(col, vDotAlpha * edge);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
      });
      docUniforms.push(material.uniforms as unknown as DocUniforms);
      pointsMaterials.push(material);
      return material;
    }

    // One object per globe (globes are few: 1..4) — an InstancedMesh in
    // 'spheres' mode, a Points cloud in 'points' mode. Exactly one of
    // mesh/points is set; everything else in the record is shared, so
    // rebuildInstances() and updateHoverAndLabels() are mode-agnostic apart
    // from how a doc's scale is written (instance matrix vs aScale attribute).
    interface GlobeInstanced {
      mesh: THREE.InstancedMesh | null;
      points: THREE.Points | null;
      /** Whichever of mesh/points is live — for raycasting and disposal. */
      object: THREE.Object3D;
      /** Only in 'points' mode: per-point size (baseScale × matched × hidden). */
      scaleArr: Float32Array | null;
      scaleAttr: THREE.BufferAttribute | null;
      docs: MapDocument[];
      basePositions: THREE.Vector3[];
      baseScales: Float32Array;
      emissiveArr: Float32Array;
      emissiveScaledArr: Float32Array;
      alphaArr: Float32Array;
      emissiveAttr: THREE.BufferAttribute;
      emissiveScaledAttr: THREE.BufferAttribute;
      alphaAttr: THREE.BufferAttribute;
      center: THREE.Vector3;
    }
    const globeInstanced: GlobeInstanced[] = [];
    const nodes: { basePos: THREE.Vector3; doc: MapDocument }[] = [];
    // Monotonic counter across every globe so each instance gets a unique seed.
    let globalSeed = 0;

    // Create globes and their document clouds
    globes.forEach((globe) => {
      const globeColor = GLOBE_COLORS[globe.key] || 0x6a5acd;
      const globeRadius = 8;
      const globeGeometry = new THREE.SphereGeometry(globeRadius, 32, 24);
      const globeWireframe = new THREE.WireframeGeometry(globeGeometry);
      const globeMaterial = new THREE.LineBasicMaterial({
        color: globeColor,
        opacity: 0.08,
        transparent: true,
      });
      const globeMesh = new THREE.LineSegments(globeWireframe, globeMaterial);
      globeMesh.position.copy(globe.center);
      scene.add(globeMesh);
      globeMeshes.push(globeMesh);

      // Connection lines between globes (subtle)
      if (globes.length > 1) {
        globes.forEach((other) => {
          if (other.key <= globe.key) return; // avoid duplicates
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            globe.center, other.center,
          ]);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x333355,
            opacity: 0.15,
            transparent: true,
          });
          scene.add(new THREE.Line(lineGeo, lineMat));
        });
      }

      // Nodes for this globe — one InstancedMesh (spheres) or one Points cloud.
      const docs = globe.documents;
      const count = docs.length;
      const cap = Math.max(1, count);
      const usePoints = renderMode === 'points';
      const geometry = usePoints ? new THREE.BufferGeometry() : nodeGeometry.clone();
      let mesh: THREE.InstancedMesh | null = null;
      if (!usePoints) {
        const material = makeInstancedDocMaterial();
        mesh = new THREE.InstancedMesh(geometry, material, cap);
        mesh.count = count;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;
      }

      const colorArr = new Float32Array(cap * 3);
      const emissiveArr = new Float32Array(cap);
      const emissiveScaledArr = new Float32Array(cap);
      const alphaArr = new Float32Array(cap);
      const seedArr = new Float32Array(cap);
      const baseScales = new Float32Array(cap);
      const basePositions: THREE.Vector3[] = [];
      // Points mode carries position + size as plain attributes (no matrices).
      const posArr = usePoints ? new Float32Array(cap * 3) : null;
      const scaleArr = usePoints ? new Float32Array(cap) : null;
      const col = new THREE.Color();

      for (let i = 0; i < count; i++) {
        const doc = docs[i];
        const colorNum = TYPE_COLORS_NUM[doc.type] || TYPE_COLORS_NUM.unknown;
        baseScales[i] = ageScale(doc.created_at);
        col.setHex(colorNum);
        colorArr[i * 3] = col.r;
        colorArr[i * 3 + 1] = col.g;
        colorArr[i * 3 + 2] = col.b;
        emissiveArr[i] = 0.0;
        emissiveScaledArr[i] = 0.5;
        alphaArr[i] = 1.0;
        // Per-instance jitter seed — a large well-spread number so the GLSL
        // sin-hash gives each dot a distinct floating phase.
        seedArr[i] = (globalSeed++) * 0.6180339887 + 1.0;
        const z = doc.z != null ? doc.z : (xxhash(7, i) - 0.5) * 2;
        const basePos = new THREE.Vector3(
          globe.center.x + doc.x * 8,
          globe.center.y + doc.y * 8,
          globe.center.z + z * 8,
        );
        basePositions.push(basePos);
        nodes.push({ basePos, doc });
        if (posArr && scaleArr) {
          posArr[i * 3] = basePos.x;
          posArr[i * 3 + 1] = basePos.y;
          posArr[i * 3 + 2] = basePos.z;
          scaleArr[i] = baseScales[i];
        } else if (mesh) {
          instDummy.position.copy(basePos);
          instDummy.scale.setScalar(baseScales[i]);
          instDummy.rotation.set(0, 0, 0);
          instDummy.updateMatrix();
          mesh.setMatrixAt(i, instDummy.matrix);
        }
      }

      // Points mode uses plain BufferAttributes (one value per vertex); sphere
      // mode uses InstancedBufferAttributes (one value per instance).
      const mk1 = (arr: Float32Array): THREE.BufferAttribute => {
        const a = usePoints
          ? new THREE.BufferAttribute(arr, 1)
          : new THREE.InstancedBufferAttribute(arr, 1);
        a.setUsage(THREE.DynamicDrawUsage);
        return a;
      };
      const emissiveAttr = mk1(emissiveArr);
      const emissiveScaledAttr = mk1(emissiveScaledArr);
      const alphaAttr = mk1(alphaArr);
      geometry.setAttribute(
        'aInstColor',
        usePoints
          ? new THREE.BufferAttribute(colorArr, 3)
          : new THREE.InstancedBufferAttribute(colorArr, 3),
      );
      geometry.setAttribute('aEmissive', emissiveAttr);
      geometry.setAttribute('aEmissiveScaled', emissiveScaledAttr);
      geometry.setAttribute('aAlpha', alphaAttr);
      geometry.setAttribute(
        'aSeed',
        usePoints
          ? new THREE.BufferAttribute(seedArr, 1)
          : new THREE.InstancedBufferAttribute(seedArr, 1),
      );

      let points: THREE.Points | null = null;
      let scaleAttr: THREE.BufferAttribute | null = null;
      if (usePoints && posArr && scaleArr) {
        geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        scaleAttr = mk1(scaleArr);
        geometry.setAttribute('aScale', scaleAttr);
        geometry.setDrawRange(0, count);
        points = new THREE.Points(geometry, makeDocPointsMaterial());
        points.frustumCulled = false;
        scene.add(points);
      } else if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
      }

      globeInstanced.push({
        mesh, points, object: (points ?? mesh)!, scaleArr, scaleAttr,
        docs, basePositions, baseScales, emissiveArr, emissiveScaledArr, alphaArr,
        emissiveAttr, emissiveScaledAttr, alphaAttr, center: globe.center,
      });
    });
    nodesRef.current = nodes;

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(10, 10);

    function onMouseDown(e: MouseEvent) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      container!.style.cursor = 'grabbing';
    }

    function onMouseUp(e: MouseEvent) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const wasDrag = Math.abs(dx) > 3 || Math.abs(dy) > 3;

      if (!wasDrag) {
        const rect = container!.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        // Points hit-testing needs a world-space radius; spheres have real
        // geometry. In points mode a Points intersection reports `index`, an
        // InstancedMesh reports `instanceId` — both index into rec.docs.
        raycaster.params.Points.threshold = 0.15;
        const intersects = raycaster.intersectObjects(
          globeInstanced.map(r => r.object),
        );
        if (intersects.length > 0) {
          const hit = intersects[0];
          const rec = globeInstanced.find(r => r.object === hit.object);
          const idx = hit.instanceId ?? hit.index;
          if (rec && idx != null) {
            const doc = rec.docs[idx];
            if (doc) navigate(`/doc/${encodeURIComponent(doc.id)}`);
          }
        }
      }
      isDragging.current = false;
      container!.style.cursor = 'grab';
    }

    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouseNDC.current.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseNDC.current.y = -((e.clientY - rect.top) / height) * 2 + 1;

      if (isDragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        targetAngleX.current = camAngleX.current.x + dx * 0.005;
        targetAngleY.current = Math.max(-1.2, Math.min(1.2, camAngleY.current.x - dy * 0.005));
      }
      // NOTE: hover detection (which dot is under the cursor) is derived in the
      // animation loop from the node projections it already computes each frame.
      // Raycasting all ~2,900 meshes on every mousemove (100+/s on a fast mouse)
      // was the cause of the hover-while-turning lag.
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1.08 : 0.92;
      targetDist.current = Math.max(3, Math.min(500, targetDist.current * delta));
    }

    function onMouseLeave() {
      isDragging.current = false;
      showTooltip(null);
      mouseNDC.current.set(10, 10);
    }

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mouseleave', onMouseLeave);

    function onResize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      // Point sizes are computed in pixels from the viewport height.
      for (const m of pointsMaterials) m.uniforms.uViewportHeight.value = h;
    }
    window.addEventListener('resize', onResize);

    // Proximity label pool
    const LABEL_POOL_SIZE = 8;
    const labelPool: HTMLDivElement[] = [];
    const labelsContainer = labelsRef.current;
    if (labelsContainer) {
      for (let i = 0; i < LABEL_POOL_SIZE; i++) {
        const el = document.createElement('div');
        el.className = 'proximity-label';
        el.style.display = 'none';
        labelsContainer.appendChild(el);
        labelPool.push(el);
      }
    }

    // Globe label overlays (HTML)
    const globeLabelEls: HTMLDivElement[] = [];
    if (labelsContainer) {
      globes.forEach((globe) => {
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;font-size:11px;font-family:monospace;color:rgba(255,255,255,0.5);pointer-events:none;text-transform:uppercase;letter-spacing:2px;white-space:nowrap;';
        el.textContent = `${globe.key} · ${globe.documents.length.toLocaleString()}`;
        labelsContainer.appendChild(el);
        globeLabelEls.push(el);
      });
    }

    // FPS counter
    let fpsFrames = 0;
    let fpsLastTime = performance.now();
    const fpsEl = document.createElement('div');
    fpsEl.className = 'proximity-label';
    fpsEl.style.cssText = 'position:absolute;top:8px;right:8px;font-size:11px;font-mono;color:#888;z-index:10;';
    container.appendChild(fpsEl);

    // Hover tooltip as a direct-DOM element (NOT React state): updating it on
    // every hover change avoids re-rendering the whole Map component ~15×/sec
    // while the cursor sweeps the dense dot cloud — that React churn was the
    // remaining hover stutter.
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[10px] px-5 py-3 z-20 pointer-events-none backdrop-blur-xl border border-white/[0.08] text-center';
    tooltipEl.style.background = 'rgba(10, 10, 20, 0.75)';
    tooltipEl.style.display = 'none';
    const ttType = document.createElement('div');
    ttType.className = 'text-[11px] font-semibold uppercase tracking-wide mb-1';
    const ttTitle = document.createElement('div');
    ttTitle.className = 'text-sm text-text-primary font-medium';
    const ttConcepts = document.createElement('div');
    ttConcepts.className = 'text-[11px] text-text-muted mt-1';
    tooltipEl.append(ttType, ttTitle, ttConcepts);
    container.appendChild(tooltipEl);
    function showTooltip(doc: MapDocument | null) {
      if (doc) {
        ttType.textContent = doc.type;
        ttType.style.color = TYPE_COLORS[doc.type] || TYPE_COLORS.unknown;
        ttTitle.textContent = extractTitle(doc.source_file);
        if (doc.concepts.length > 0) {
          ttConcepts.textContent = doc.concepts.slice(0, 4).join(', ');
          ttConcepts.style.display = '';
        } else {
          ttConcepts.style.display = 'none';
        }
        tooltipEl.style.display = '';
      } else {
        tooltipEl.style.display = 'none';
      }
    }

    // Animation loop
    let time = 0;
    const dt = 1 / 60;
    const tempVec = new THREE.Vector3();
    const aspectRatio = width / height;
    // Hover is derived in-loop (no per-mousemove raycast). Only push to React
    // when the dot under the cursor actually changes.
    let lastHoverId: string | null = null;
    const HOVER_DIST = 0.025; // screen-space radius treated as "cursor on this dot"
    let hoverFrame = 0; // throttle counter for the CPU hover/label pass

    // Rebuild the STATIC per-instance state (matrices + emissive/alpha) from the
    // current search / filter / visibility / hover refs. Runs ONCE on setup and
    // again whenever those change (via rebuildRef + a React effect) — never per
    // frame. Jitter + dock-magnify are handled entirely on the GPU, so matrices
    // carry only position, base scale, match-scale (1.4x) and hidden scale-0.
    function rebuildInstances() {
      const matches = matchIdsRef.current;
      const hasSearch = matches.size > 0;
      const visTypes = visibleTypesRef.current;
      const projFilter = selectedProjectRef.current;
      for (let gi = 0; gi < globeInstanced.length; gi++) {
        const rec = globeInstanced[gi];
        const { mesh, scaleArr, docs, basePositions, baseScales, emissiveArr, emissiveScaledArr, alphaArr } = rec;
        const count = docs.length;
        // Write a doc's size: point-cloud size attribute, or instance matrix.
        const setScale = (i: number, scale: number) => {
          if (scaleArr) {
            scaleArr[i] = scale;
          } else if (mesh) {
            instDummy.position.copy(basePositions[i]);
            instDummy.scale.setScalar(scale);
            instDummy.rotation.set(0, 0, 0);
            instDummy.updateMatrix();
            mesh.setMatrixAt(i, instDummy.matrix);
          }
        };
        for (let i = 0; i < count; i++) {
          const doc = docs[i];
          const isHidden = !visTypes.has(doc.type);
          if (isHidden) {
            setScale(i, 0);
            emissiveArr[i] = 0;
            emissiveScaledArr[i] = 0;
            alphaArr[i] = 0;
            continue;
          }
          const isMatched = hasSearch && (matches.has(doc.id) || (doc.chunk_ids?.some(cid => matches.has(cid)) ?? false));
          const isProjectFiltered = projFilter != null && doc.project !== projFilter && doc.project != null;
          const isFaded = (hasSearch && !isMatched) || isProjectFiltered;

          let scale = baseScales[i];
          if (isMatched) scale *= 1.4;
          setScale(i, scale);

          // Emissive is split so the shader can apply the per-frame zoom factor
          // (uEmissiveScale) without any CPU work:
          //   final = aEmissive + aEmissiveScaled * uEmissiveScale + magnify boost
          let unscaled = 0, scaled = 0;
          if (isFaded) unscaled = 0.1;      // faded: fixed 0.1 (unscaled)
          else scaled = 0.5;                // normal: 0.5 * zoom
          if (isMatched) { unscaled = 0; scaled = 1.0; } // matched: 1.0 * zoom
          // Hover glow is handled by the GPU magnify boost (the dot under the
          // cursor grows + brightens), so no per-instance hover override here —
          // that would force a full rebuild on every hover change.
          emissiveArr[i] = unscaled;
          emissiveScaledArr[i] = scaled;
          alphaArr[i] = isFaded ? 0.05 : 1.0;
        }
        if (mesh) mesh.instanceMatrix.needsUpdate = true;
        if (rec.scaleAttr) rec.scaleAttr.needsUpdate = true;
        rec.emissiveAttr.needsUpdate = true;
        rec.emissiveScaledAttr.needsUpdate = true;
        rec.alphaAttr.needsUpdate = true;
      }
    }
    rebuildRef.current = rebuildInstances;
    rebuildInstances();

    // Throttled + back-face-culled CPU pass: derive hover + the proximity-label
    // list. Only front-facing, visible, non-faded dots are projected (roughly
    // half the cloud), and this runs at most every 4th frame — the projection
    // O(n) loop no longer runs every frame. Uses STATIC base positions (the
    // ±0.12 GPU jitter is below the hover threshold, so this is equivalent).
    const camPos = new THREE.Vector3();
    function updateHoverAndLabels() {
      const matches = matchIdsRef.current;
      const hasSearch = matches.size > 0;
      const visTypes = visibleTypesRef.current;
      const projFilter = selectedProjectRef.current;
      const mx = mouseNDC.current.x;
      const my = mouseNDC.current.y;
      camPos.copy(camera.position);

      const MAX_LABELS = labelPool.length;
      const nearby: { screenDist: number; ndcX: number; ndcY: number; doc: MapDocument; color: string }[] = [];
      for (let gi = 0; gi < globeInstanced.length; gi++) {
        const rec = globeInstanced[gi];
        const { docs, basePositions, center } = rec;
        const count = docs.length;
        for (let i = 0; i < count; i++) {
          const doc = docs[i];
          if (!visTypes.has(doc.type)) continue;
          const basePos = basePositions[i];
          // Back-face cull: skip dots on the far side of their globe (outward
          // normal from globe centre pointing away from the camera).
          const nx = basePos.x - center.x, ny = basePos.y - center.y, nz = basePos.z - center.z;
          const vx = camPos.x - basePos.x, vy = camPos.y - basePos.y, vz = camPos.z - basePos.z;
          if (nx * vx + ny * vy + nz * vz <= 0) continue;

          const isMatched = hasSearch && (matches.has(doc.id) || (doc.chunk_ids?.some(cid => matches.has(cid)) ?? false));
          const isProjectFiltered = projFilter != null && doc.project !== projFilter && doc.project != null;
          const isFaded = (hasSearch && !isMatched) || isProjectFiltered;
          if (isFaded) continue;

          tempVec.copy(basePos).project(camera);
          if (tempVec.z >= 1) continue;
          const screenDist = Math.sqrt(
            Math.pow((tempVec.x - mx) * aspectRatio, 2) +
            Math.pow(tempVec.y - my, 2)
          );
          // Bounded insert: keep only the MAX_LABELS nearest, sorted. Over the
          // dense centre thousands of dots fall within 0.5 — pushing + sorting
          // all of them was the hover stutter. Insertion into a ≤8 array keeps
          // it O(n·8) with no large allocation and no sort of thousands.
          if (screenDist < 0.5 &&
              (nearby.length < MAX_LABELS || screenDist < nearby[nearby.length - 1].screenDist)) {
            let lo = 0, hi = nearby.length;
            while (lo < hi) {
              const mid = (lo + hi) >> 1;
              if (nearby[mid].screenDist < screenDist) lo = mid + 1; else hi = mid;
            }
            nearby.splice(lo, 0, {
              screenDist,
              ndcX: tempVec.x,
              ndcY: tempVec.y,
              doc,
              color: TYPE_COLORS[doc.type] || TYPE_COLORS.unknown,
            });
            if (nearby.length > MAX_LABELS) nearby.pop();
          }
        }
      }
      // nearby is already sorted by the bounded insertion above.
      for (let li = 0; li < labelPool.length; li++) {
        const el = labelPool[li];
        if (li < nearby.length) {
          const n = nearby[li];
          const px = (n.ndcX + 1) * 0.5 * width;
          const py = (1 - (n.ndcY + 1) * 0.5) * height;
          const opacity = Math.max(0.3, 1 - n.screenDist / 0.5);
          el.textContent = extractTitle(n.doc.source_file);
          el.style.left = `${px + 10}px`;
          el.style.top = `${py - 8}px`;
          el.style.opacity = String(opacity);
          el.style.color = n.color;
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      }

      // Derive hover from the nearest projected node. Update the DOM tooltip +
      // cursor only on change — no React state, so no component re-render.
      if (!isDragging.current) {
        const top = nearby.length > 0 ? nearby[0] : null;
        const hoverDoc = top && top.screenDist < HOVER_DIST ? top.doc : null;
        const hoverId = hoverDoc ? hoverDoc.id : null;
        if (hoverId !== lastHoverId) {
          lastHoverId = hoverId;
          showTooltip(hoverDoc);
          container!.style.cursor = hoverDoc ? 'pointer' : 'grab';
        }
      }
    }

    function animate() {
      time += 0.016;

      fpsFrames++;
      const now = performance.now();
      if (now - fpsLastTime >= 1000) {
        fpsEl.textContent = `${fpsFrames} fps`;
        fpsFrames = 0;
        fpsLastTime = now;
      }

      if (!isDragging.current && !prefersReduced) {
        targetAngleX.current += 0.0003;
      }

      camAngleX.current = cdsTween(camAngleX.current, targetAngleX.current, 3, dt);
      camAngleY.current = cdsTween(camAngleY.current, targetAngleY.current, 3, dt);
      camDist.current = cdsTween(camDist.current, targetDist.current, 4, dt);

      const dist = camDist.current.x;

      // Scale bloom + emissive by distance (prevents glow wash at zoom-out)
      const bloomScale = Math.max(0.05, Math.min(1.0, 15 / dist));
      bloomPass.strength = 0.6 * bloomScale;
      bloomPass.radius = 0.4 * bloomScale;

      camera.position.x = Math.sin(camAngleX.current.x) * Math.cos(camAngleY.current.x) * dist;
      camera.position.y = Math.sin(camAngleY.current.x) * dist;
      camera.position.z = Math.cos(camAngleX.current.x) * Math.cos(camAngleY.current.x) * dist;

      camTarget.current.lerp(targetCenter.current, 0.05);
      const ct = camTarget.current;
      camera.position.x += ct.x;
      camera.position.y += ct.y;
      camera.position.z += ct.z;
      camera.lookAt(ct.x, ct.y, ct.z);

      // Rotate each globe
      globeMeshes.forEach((gm, gi) => {
        gm.rotation.y = time * 0.02 + gi * 0.7;
        gm.rotation.x = time * 0.005 + gi * 0.3;
      });

      // Update globe labels position
      globes.forEach((globe, gi) => {
        if (gi < globeLabelEls.length) {
          tempVec.copy(globe.center);
          tempVec.y -= 10.5; // below globe
          tempVec.project(camera);
          if (tempVec.z < 1) {
            const px = (tempVec.x + 1) * 0.5 * width;
            const py = (1 - (tempVec.y + 1) * 0.5) * height;
            globeLabelEls[gi].style.left = `${px}px`;
            globeLabelEls[gi].style.top = `${py}px`;
            globeLabelEls[gi].style.transform = 'translate(-50%, 0)';
            globeLabelEls[gi].style.display = '';
          } else {
            globeLabelEls[gi].style.display = 'none';
          }
        }
      });

      // Per-frame instance work is now ~free: only push a handful of scalar
      // uniforms into each globe material. Jitter + dock-magnify (and their
      // emissive boost) run entirely on the GPU; the instance matrices +
      // emissive/alpha buffers are static (rebuilt only on state change).
      const emissiveScale = Math.max(0.2, Math.min(1.0, 20 / dist));
      const aspectNow = camera.aspect;
      for (let u = 0; u < docUniforms.length; u++) {
        const un = docUniforms[u];
        un.uTime.value = time;
        un.uMouse.value.set(mouseNDC.current.x, mouseNDC.current.y);
        un.uEmissiveScale.value = emissiveScale;
        un.uAspect.value = aspectNow;
      }

      // Hover + proximity labels: CPU work, throttled to every 4th frame
      // (~15/sec) and back-face culled inside updateHoverAndLabels().
      hoverFrame++;
      if (hoverFrame % 4 === 0) {
        updateHoverAndLabels();
      }

      composer.render();
      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      fpsEl.remove();
      labelPool.forEach(el => el.remove());
      globeLabelEls.forEach(el => el.remove());
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);

      globeInstanced.forEach((rec) => {
        const obj = rec.object;
        scene.remove(obj);
        (obj as THREE.Mesh | THREE.Points).geometry?.dispose();
        const mat = (obj as THREE.Mesh | THREE.Points).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat?.dispose();
        rec.mesh?.dispose();
      });
      nodeGeometry.dispose();
      // Dispose globe geometries
      scene.traverse((obj) => {
        if ((obj as any).geometry) (obj as any).geometry.dispose();
        if ((obj as any).material) (obj as any).material.dispose();
      });
      composer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
    // renderMode is a dependency: switching sphere <-> point cloud swaps the
    // scene objects and their materials, so the whole scene is rebuilt. That is
    // fine — mode changes are user-initiated and rare.
  }, [globes, navigate, renderMode]);

  // Search
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setMatchIds(new Set());
      return;
    }
    setSearching(true);
    try {
      const data = await search(searchQuery, 'all', 50, 'hybrid');
      setMatchIds(new Set(data.results.map(r => r.id)));
    } finally {
      setSearching(false);
    }
  }

  // Fly to a specific globe
  function flyToGlobe(index: number) {
    if (index < globes.length) {
      const center = globes[index].center;
      targetCenter.current.set(center.x, center.y, center.z);
      targetDist.current = 18;
    }
  }

  // (totalDocs is computed above — it also drives the render-mode auto-switch.)

  // Type counts across all globes
  const typeCounts = globes.reduce((acc, g) => {
    g.documents.forEach(d => { acc[d.type] = (acc[d.type] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-3">
        <div className="text-lg text-text-primary">Loading knowledge map...</div>
        <div className="text-[13px] text-text-muted">Fetching embeddings from all engines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-3">
        <div className="text-base text-[#ef4444]">Failed to load map: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <form onSubmit={handleSearch} className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search to highlight region..."
            className="w-[300px] px-4 py-2.5 rounded-[10px] text-sm text-text-primary border border-white/[0.08] outline-none backdrop-blur-xl transition-colors duration-200 focus:border-accent placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden [&::-webkit-clear-button]:hidden [&::-ms-clear]:hidden"
            style={{ background: 'rgba(10, 10, 20, 0.7)', WebkitAppearance: 'none' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setMatchIds(new Set()); }}
              className="px-3.5 py-2 rounded-[10px] text-xs text-text-secondary cursor-pointer border border-white/[0.08] backdrop-blur-xl transition-all duration-200 hover:border-accent hover:text-accent"
              style={{ background: 'rgba(10, 10, 20, 0.7)' }}
            >
              Clear
            </button>
          )}
          {searching && <span className="w-2 h-2 rounded-full bg-accent animate-search-pulse" />}
        </form>

        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" style={{ background: '#05050a' }} />
        <div ref={labelsRef} className="absolute inset-0 pointer-events-none z-[5] overflow-hidden" />

        {totalDocs === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[5] gap-3" style={{ background: 'rgba(5, 5, 10, 0.9)' }}>
            <div className="text-[22px] font-bold text-text-primary">No Embeddings Yet</div>
            <div className="text-sm text-text-muted text-center leading-relaxed">
              The 3D map requires vector embeddings from LanceDB.<br />
              Run a vector index to populate the map.
            </div>
          </div>
        )}

        {/* Hover tooltip is rendered via direct DOM (see showTooltip in the
            three.js effect) to avoid a React re-render on every hover change. */}

        <div
          className="absolute bottom-4 left-4 flex gap-1 rounded-[10px] px-2 py-1.5 text-[11px] text-text-secondary backdrop-blur-xl border border-white/[0.08]"
          style={{ background: 'rgba(10, 10, 20, 0.7)' }}
        >
          {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'unknown').map(([type, color]) => {
            const active = visibleTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => setVisibleTypes(prev => {
                  const next = new Set(prev);
                  if (next.has(type)) next.delete(type);
                  else next.add(type);
                  return next;
                })}
                className={`flex items-center gap-[5px] px-2 py-1 rounded-md cursor-pointer border-none transition-all duration-150 ${active ? 'opacity-100' : 'opacity-30'}`}
                style={{ background: active ? `${color}15` : 'transparent' }}
              >
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
                {type}
              </button>
            );
          })}
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <button
            onClick={() => { targetDist.current = Math.max(3, targetDist.current * 0.75); }}
            className="w-9 h-9 rounded-[10px] text-text-primary text-lg font-medium cursor-pointer flex items-center justify-center backdrop-blur-xl border border-white/[0.08] transition-all duration-200 hover:border-accent hover:text-accent"
            style={{ background: 'rgba(10, 10, 20, 0.7)' }}
          >+</button>
          <button
            onClick={() => { targetDist.current = Math.min(500, targetDist.current * 1.35); }}
            className="w-9 h-9 rounded-[10px] text-text-primary text-lg font-medium cursor-pointer flex items-center justify-center backdrop-blur-xl border border-white/[0.08] transition-all duration-200 hover:border-accent hover:text-accent"
            style={{ background: 'rgba(10, 10, 20, 0.7)' }}
          >-</button>
          <button
            onClick={() => {
              targetAngleX.current = 0;
              targetAngleY.current = 0.3;
              targetDist.current = globes.length > 1 ? 55 : 28;
              targetCenter.current.set(0, 0, 0);
            }}
            className="w-9 h-9 rounded-[10px] text-text-primary text-lg font-medium cursor-pointer flex items-center justify-center backdrop-blur-xl border border-white/[0.08] transition-all duration-200 hover:border-accent hover:text-accent"
            style={{ background: 'rgba(10, 10, 20, 0.7)' }}
            title="Reset view (all globes)"
          >R</button>
          <button
            onClick={() => {
              const nodes = nodesRef.current;
              const visTypes = visibleTypesRef.current;
              let cx = 0, cy = 0, cz = 0, count = 0;
              nodes.forEach(n => {
                if (visTypes.has(n.doc.type)) { cx += n.basePos.x; cy += n.basePos.y; cz += n.basePos.z; count++; }
              });
              if (count > 0) {
                targetCenter.current.set(cx / count, cy / count, cz / count);
                targetDist.current = 6;
              }
            }}
            className="w-9 h-9 rounded-[10px] text-text-primary text-lg font-medium cursor-pointer flex items-center justify-center backdrop-blur-xl border border-white/[0.08] transition-all duration-200 hover:border-accent hover:text-accent"
            style={{ background: 'rgba(10, 10, 20, 0.7)' }}
            title="Center on visible dots"
          >C</button>
          <button
            onClick={toggleRenderMode}
            className="w-9 h-9 rounded-[10px] text-text-primary text-sm font-medium cursor-pointer flex items-center justify-center backdrop-blur-xl border border-white/[0.08] transition-all duration-200 hover:border-accent hover:text-accent"
            style={{
              background: 'rgba(10, 10, 20, 0.7)',
              ...(modeOverride ? { borderColor: 'rgba(96, 165, 250, 0.5)' } : {}),
            }}
            title={
              `Render: ${renderMode === 'points' ? 'point cloud' : 'spheres'}` +
              ` — ${modeOverride ? 'pinned' : `auto (${totalDocs.toLocaleString()} docs)`}.` +
              ` Click to switch to ${renderMode === 'points' ? 'spheres' : 'point cloud'}.` +
              ` Point cloud draws 1 vertex per doc instead of a sphere — much faster on large maps.`
            }
          >{renderMode === 'points' ? '·' : '●'}</button>
        </div>
      </div>

      <div className="w-[260px] bg-bg-card border-l border-border p-6 flex flex-col overflow-hidden">
        <h2 className="text-xl font-bold text-text-primary mb-1">Knowledge Map</h2>
        <span className="text-[11px] font-mono text-text-muted mb-4 block">{globes.length} globe{globes.length !== 1 ? 's' : ''} active</span>
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
          {stats?.total && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-bold text-text-primary tabular-nums">{stats.total.toLocaleString()}</span>
              <span className="text-xs text-text-muted">Total Indexed</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-bold text-text-primary tabular-nums">{totalDocs.toLocaleString()}</span>
            <span className="text-xs text-text-muted">Documents Mapped</span>
          </div>
          {Object.entries(typeCounts).map(([type, count]) => {
            const globalChunks = stats?.by_type?.[type];
            const globalFiles = (stats as any)?.by_type_files?.[type];
            return (
              <div key={type} className="flex flex-col gap-0.5">
                <span className="text-xl font-bold tabular-nums" style={{ color: TYPE_COLORS[type] }}>{count.toLocaleString()}</span>
                <span className="text-xs text-text-muted capitalize">
                  {type}s{globalFiles ? ` (${globalFiles.toLocaleString()} files)` : globalChunks && globalChunks !== count ? ` (${globalChunks.toLocaleString()} chunks)` : ''}
                </span>
              </div>
            );
          })}
          {stats?.vectors && stats.vectors.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Embedding Engines</span>
                <span className="text-[9px] font-mono text-text-muted">LanceDB</span>
              </div>
              {stats.vectors.map(v => {
                const loaded = globes.find(g => g.key === v.key);
                const gi = loaded ? globes.indexOf(loaded) : -1;
                const globeColor = `#${(GLOBE_COLORS[v.key] || 0x6a5acd).toString(16).padStart(6, '0')}`;
                const isLoading = loadingModel === v.key;
                return (
                  <button
                    key={v.key}
                    onClick={() => loaded ? flyToGlobe(gi) : v.enabled && addGlobe(v.key, v.model)}
                    disabled={!v.enabled || isLoading}
                    className={`flex flex-col gap-0.5 p-2 rounded-lg border text-left transition-all duration-150 ${
                      loaded
                        ? 'border-accent/40 bg-accent/5 hover:border-accent cursor-pointer'
                        : v.enabled
                          ? 'border-border bg-white/[0.02] hover:border-border-hover cursor-pointer'
                          : 'border-border-subtle opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: loaded ? globeColor : 'rgba(255,255,255,0.2)' }} />
                        <span className="text-sm font-semibold text-text-primary">{v.key}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                        loaded ? 'bg-accent/20 text-accent' : isLoading ? 'bg-warning/20 text-warning' : v.enabled ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {loaded ? 'Fly to' : isLoading ? 'Loading...' : v.enabled ? `+ Add` : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between ml-[18px]">
                      <span className="text-xs text-text-muted font-mono">{v.model}</span>
                      <span className="text-[9px] text-text-muted tabular-nums">{v.count.toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
          {totalOracles > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Oracle Universe</span>
                {selectedProject && (
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-[9px] font-mono text-accent cursor-pointer hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-bold text-accent tabular-nums">{totalOracles}</span>
                <span className="text-xs text-text-muted">
                  {selectedProject ? `Filtering: ${selectedProject.split('/').pop()}` : 'Repos Indexed'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
                {oracleProjects.map(p => {
                  const name = p.project.split('/').pop() || p.project;
                  const org = p.project.split('/').slice(-2, -1)[0] || '';
                  const age = Date.now() - p.last_indexed;
                  const ageLabel = age < 3600_000 ? '<1h' : age < 86400_000 ? `${Math.floor(age / 3600_000)}h` : `${Math.floor(age / 86400_000)}d`;
                  const isSelected = selectedProject === p.project;
                  return (
                    <button
                      key={p.project}
                      onClick={() => setSelectedProject(isSelected ? null : p.project)}
                      className={`flex items-center justify-between py-1 px-1.5 gap-2 rounded-md cursor-pointer text-left transition-all duration-150 border-none ${
                        isSelected ? 'bg-accent/15' : 'bg-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs truncate ${isSelected ? 'text-accent font-semibold' : 'text-text-primary'}`} title={p.project}>{name}</span>
                        <span className="text-[9px] text-text-muted truncate">{org}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] tabular-nums ${isSelected ? 'text-accent' : 'text-text-muted'}`}>{p.docs}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${age < 86400_000 ? 'bg-success' : age < 604800_000 ? 'bg-warning' : 'bg-text-muted'}`} title={ageLabel + ' ago'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {matchIds.size > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-bold tabular-nums" style={{ color: '#4ade80' }}>{matchIds.size}</span>
                <span className="text-xs text-text-muted capitalize">Search Matches</span>
              </div>
            </>
          )}
        </div>
        <div className="text-[11px] text-text-muted mt-6 leading-relaxed">
          Drag to orbit. Scroll to zoom. Click globe in sidebar to fly.
        </div>
      </div>
    </div>
  );
}

function extractTitle(sourceFile: string): string {
  const parts = sourceFile.split('/');
  const filename = parts[parts.length - 1] || sourceFile;
  return filename.replace(/\.md$/, '').replace(/_/g, ' ');
}
