import { useEffect, useState, type ReactNode } from 'react';
import { ping } from '../api/oracle';

/**
 * Soft-mode backend gate. Never blocks the UI.
 *   - checking → render children with `backendLive=false` (UI still usable, shows loaders)
 *   - live     → render children with `backendLive=true`
 *   - offline  → render children with `backendLive=false` + demo banner on top
 *
 * This is the *demo surface* for vector.buildwithoracle.com, so we always render
 * the playground. If the backend is unreachable, the playground itself renders
 * canned/demo results instead of showing a gate modal.
 */
export function BackendGate({ children }: { children: (ctx: { backendLive: boolean }) => ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'live' | 'offline'>('checking');

  useEffect(() => {
    let cancelled = false;
    ping().then((ok) => { if (!cancelled) setStatus(ok ? 'live' : 'offline'); });
    const id = setInterval(() => {
      ping().then((ok) => { if (!cancelled) setStatus(ok ? 'live' : 'offline'); });
    }, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const backendLive = status === 'live';

  return (
    <>
      {status === 'offline' && <DemoBanner />}
      {children({ backendLive })}
    </>
  );
}

function DemoBanner() {
  return (
    <div
      className="max-w-[1200px] mx-auto mt-4 px-6"
    >
      <div
        className="rounded-xl py-3 px-4 flex items-center gap-3 backdrop-blur-lg"
        style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.3)' }}
      >
        <span className="text-lg">✨</span>
        <div className="flex-1 text-[13px] leading-snug">
          <span className="font-semibold text-warning">Demo mode.</span>{' '}
          <span className="text-text-secondary">
            No local Oracle backend reachable — showing canned results. To run with real data, start{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/30 text-[12px]">arra-oracle-v3</code>
            {' '}on <code className="px-1.5 py-0.5 rounded bg-black/30 text-[12px]">localhost:47778</code>, or append{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/30 text-[12px]">?host=your-host:port</code> to the URL.
          </span>
        </div>
      </div>
    </div>
  );
}
