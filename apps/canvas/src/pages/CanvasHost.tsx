import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import {
  DEFAULT_PLUGIN_ID,
  findPlugin,
  listPlugins,
  type CanvasPlugin,
  type SceneMount,
} from '../lib/plugins/registry';

export default function CanvasHost() {
  const location = useLocation();
  const pluginId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('plugin') ?? DEFAULT_PLUGIN_ID;
  }, [location.search]);

  const plugin = findPlugin(pluginId);
  const all = listPlugins();

  return (
    <div className="relative">
      <PluginPicker plugins={all} activeId={pluginId} />
      {!plugin && <NotFound pluginId={pluginId} />}
      {plugin?.kind === 'three' && <ThreeHost mount={plugin.mount} key={plugin.id} />}
      {plugin?.kind === 'react' && <plugin.renderer />}
    </div>
  );
}

function PluginPicker({ plugins, activeId }: { plugins: CanvasPlugin[]; activeId: string }) {
  return (
    <div className="absolute top-3 right-3 z-30 flex flex-wrap gap-1 max-w-[60vw] justify-end">
      {plugins.map((p) => {
        const active = p.id === activeId;
        return (
          <Link
            key={p.id}
            to={`/?plugin=${p.id}`}
            className={`px-2.5 py-1 rounded-md text-xs font-mono backdrop-blur-xl border transition-colors ${
              active
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-black/50 text-text-secondary border-white/10 hover:border-accent/40 hover:text-accent'
            }`}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}

function NotFound({ pluginId }: { pluginId: string }) {
  return (
    <div className="p-8 text-text-secondary">
      <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 text-warning">
        Plugin <code>{pluginId}</code> not found in registry.
      </div>
    </div>
  );
}

function ThreeHost({ mount }: { mount: SceneMount }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const instance = mount({ scene, camera, renderer, THREE });
    let raf = 0;
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      instance.tick?.();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      instance.dispose?.();
      renderer.dispose();
    };
  }, [mount]);

  return (
    <div ref={wrapRef} className="w-full h-[calc(100vh-64px)] bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
