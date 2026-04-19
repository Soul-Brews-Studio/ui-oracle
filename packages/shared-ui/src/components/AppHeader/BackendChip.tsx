import { useEffect, useState } from 'react';
import { CHIP_COLORS } from '../../tokens';

export type BackendStatus = 'checking' | 'live' | 'demo';

interface BackendChipProps {
  /** Async probe returning true when backend is reachable. */
  ping: () => Promise<boolean>;
  /** Polling interval in ms. Default 15000. */
  intervalMs?: number;
}

/**
 * Backend-status pill. Polls `ping()` and renders a checking/live/demo chip.
 * Caller supplies the `ping` function so this component stays app-agnostic.
 */
export function BackendChip({ ping, intervalMs = 15000 }: BackendChipProps) {
  const [status, setStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    const check = () =>
      ping().then((ok) => {
        if (!cancelled) setStatus(ok ? 'live' : 'demo');
      });
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ping, intervalMs]);

  const label = status === 'checking' ? 'checking…' : status === 'live' ? 'live' : 'demo mode';
  const c: { bg: string; border: string; dot: string } = CHIP_COLORS[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[11px] font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.dot }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}` }}
      />
      {label}
    </span>
  );
}
