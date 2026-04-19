import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { findPlugin, listPlugins } from '../lib/plugins/registry';

export default function CanvasHost() {
  const location = useLocation();
  const pluginId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('plugin');
  }, [location.search]);

  const plugin = pluginId ? findPlugin(pluginId) : undefined;
  const all = listPlugins();

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-10 text-text-primary">
      <h1 className="text-2xl font-semibold mb-3">Canvas host — phase 1 scaffold</h1>
      <p className="text-text-secondary mb-6">
        Plugin: <code className="bg-bg-card px-2 py-0.5 rounded">{pluginId ?? '(none — pass ?plugin=<id>)'}</code>
      </p>

      {pluginId && !plugin && (
        <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 text-warning">
          Plugin <code>{pluginId}</code> not found in registry. The populator will fill this in.
        </div>
      )}

      {plugin && (
        <div className="p-4 rounded-xl border border-border bg-bg-card">
          <div className="text-sm text-text-muted mb-2">Resolved plugin</div>
          <div className="font-mono text-accent">{plugin.id}</div>
          <div className="text-text-secondary">{plugin.label} · kind={plugin.kind}</div>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Registered plugins</h2>
        {all.length === 0 ? (
          <p className="text-text-muted">None yet — registry is empty until the populator runs.</p>
        ) : (
          <ul className="space-y-1 text-sm font-mono">
            {all.map((p) => (
              <li key={p.id}>
                <span className="text-accent">{p.id}</span>
                <span className="text-text-muted"> — {p.label} ({p.kind})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
