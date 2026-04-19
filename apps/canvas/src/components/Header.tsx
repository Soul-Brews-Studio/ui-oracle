import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ping } from '../api/oracle';

type BackendStatus = 'checking' | 'live' | 'demo';

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

export function Header() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    const check = () => ping().then((ok) => { if (!cancelled) setBackendStatus(ok ? 'live' : 'demo'); });
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const chip = {
    checking: { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', dot: '#94a3b8', text: 'checking…' },
    live:     { bg: 'rgba(74, 222, 128, 0.12)',  border: 'rgba(74, 222, 128, 0.4)',  dot: '#4ade80', text: 'live' },
    demo:     { bg: 'rgba(251, 191, 36, 0.12)',  border: 'rgba(251, 191, 36, 0.4)',  dot: '#fbbf24', text: 'demo mode' },
  }[backendStatus];

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{ background: 'rgba(10, 10, 15, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      <div className="flex justify-between items-center gap-4 px-4 py-2 max-w-[1400px] mx-auto">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent shrink-0 min-w-0">
          <span>ARRA 🔮Racle — Canvas</span>
          <span
            className="text-[10px] font-medium text-text-muted bg-bg-card px-1.5 py-0.5 rounded"
            title={`ui ${__APP_VERSION__}`}
          >
            {__APP_VERSION__}
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <a
            href={STUDIO_ORIGIN}
            className="px-2 py-0.5 rounded-md border border-border text-text-muted hover:bg-bg-card transition-all duration-150"
            title="Back to studio.buildwithoracle.com"
          >
            ← studio
          </a>
          <span
            className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[11px] font-semibold"
            style={{ background: chip.bg, border: `1px solid ${chip.border}`, color: chip.dot }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: chip.dot, boxShadow: `0 0 8px ${chip.dot}` }} />
            {chip.text}
          </span>
        </div>
      </div>
    </header>
  );
}
