import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Full-bleed Three.js host for an ESM visual plugin from `public/plugins/`.
 *
 * This is the same mount contract the Canvas page uses — a module whose default
 * export has `{ name, mount({scene, camera, renderer, THREE}) }` returning an
 * optional `{ tick, dispose }`. Extracted so the Memory view switcher can host
 * the data-backed plugins (map3d, graph3d) inline instead of sending the user
 * to a separate top-level page.
 */
type PluginInstance = { tick?: () => void; dispose?: () => void };
type PluginModule = {
  default: {
    name: string;
    mount: (ctx: {
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      THREE: typeof THREE;
    }) => PluginInstance;
  };
};

interface Props {
  /** Plugin basename under /plugins, e.g. "map3d" or "graph3d". */
  plugin: string;
}

export function PluginScene({ plugin }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    setLoading(true);
    setError(null);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050a);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    camera.position.z = 3;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const light = new THREE.PointLight(0xffffff, 50, 100);
    light.position.set(3, 3, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404060, 1));

    const setSize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(wrap);

    let instance: PluginInstance = {};
    let raf = 0;
    let disposed = false;

    (async () => {
      try {
        const mod: PluginModule = await import(/* @vite-ignore */ `/plugins/${plugin}.mjs`);
        if (disposed) return;
        instance = mod.default.mount({ scene, camera, renderer, THREE });
      } catch (err) {
        console.error('plugin load failed:', err);
        if (!disposed) setError(err instanceof Error ? err.message : String(err));
      }
      if (!disposed) setLoading(false);
      const tick = () => {
        if (disposed) return;
        instance.tick?.();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      instance.dispose?.();
      renderer.dispose();
    };
  }, [plugin]);

  return (
    <div ref={wrapRef} className="w-full h-full relative" style={{ background: '#05050a' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm pointer-events-none">
          Loading {plugin}…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <div className="text-text-primary font-medium">Could not load “{plugin}”</div>
          <div className="text-text-muted text-xs font-mono max-w-lg break-words">{error}</div>
        </div>
      )}
    </div>
  );
}
