import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import { PageShell, PageHeader, PillRow, pillClass } from '@ui-oracle/shared-ui';

const PLUGINS = ['cube', 'galaxy', 'torus', 'graph3d', 'solar', 'wave', 'map3d'] as const;
type PluginName = typeof PLUGINS[number];

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

export function Canvas() {
  const [params, setParams] = useSearchParams();
  const pluginName = (params.get('plugin') ?? 'cube') as PluginName;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [label, setLabel] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
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

    setLabel('');
    setLoadError(null);
    let instance: PluginInstance = {};
    let raf = 0;
    let disposed = false;

    (async () => {
      try {
        const mod: PluginModule = await import(/* @vite-ignore */ `/plugins/${pluginName}.mjs`);
        instance = mod.default.mount({ scene, camera, renderer, THREE });
        setLabel(`plugin: ${mod.default.name}`);
      } catch (err) {
        console.error('plugin load failed:', err);
        setLoadError(`Could not load plugin '${pluginName}'`);
      }
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
  }, [pluginName]);

  return (
    <PageShell width="wide">
      <PageHeader
        title="Canvas"
        subtitle={
          <>
            Three.js host for visual plugins. Swap plugin with{' '}
            <code className="text-accent">?plugin=&lt;name&gt;</code>. Each plugin is an ESM module that exports <code className="text-accent">mount()</code>.
          </>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <PillRow label="Plugin" className="min-w-0 flex-1">
          {PLUGINS.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={name === pluginName}
              onClick={() => setParams({ plugin: name })}
              className={pillClass(name === pluginName)}
            >
              {name}
            </button>
          ))}
        </PillRow>
        <span className="shrink-0 text-sm text-text-secondary">{label}</span>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full h-[70vh] bg-black rounded-xl overflow-hidden"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-text-secondary">
            {loadError}
          </div>
        )}
      </div>
    </PageShell>
  );
}
