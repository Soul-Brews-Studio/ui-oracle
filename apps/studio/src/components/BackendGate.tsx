import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../api/oracle';
import { clearStoredHost, hostLabel, setStoredHost } from '../api/host';

/**
 * 'down'  — nothing answered the connection at all.
 * 'stuck' — something IS listening but never served a healthy response. A
 *           wedged backend holds its port open, so treating that as "not
 *           installed" sends people to reinstall when they need to restart.
 */
type GateState = 'probing' | 'ok' | 'down' | 'stuck';

const PROBE_TIMEOUT_MS = 5000;

async function probeBackend(): Promise<Exclude<GateState, 'probing'>> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    // Any response means the process is alive and reachable — a non-OK status
    // is a sick backend, not a missing one.
    return res.ok ? 'ok' : 'stuck';
  } catch {
    // Timed out => the socket was accepted but nothing came back (hung).
    // Immediate failure => refused / DNS / blocked before any exchange.
    return timedOut ? 'stuck' : 'down';
  } finally {
    clearTimeout(timer);
  }
}

export function BackendGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>('probing');

  const probe = useCallback(async () => {
    setState('probing');
    setState(await probeBackend());
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  if (state === 'ok') return <>{children}</>;

  if (state === 'probing') {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary text-sm gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-accent animate-pulse" />
        checking backend…
      </div>
    );
  }

  return <UnreachableLanding onRetry={probe} state={state} />;
}

function UnreachableLanding({
  onRetry,
  state,
}: {
  onRetry: () => void;
  state: 'down' | 'stuck';
}) {
  const handleChangeHost = () => {
    const current = hostLabel();
    const next = window.prompt(
      'Enter a new host (e.g. localhost:47778, http://mba.wg:47778). Leave empty to reset to default.',
      current.replace(' (default)', ''),
    );
    if (next === null) return;
    const trimmed = next.trim();
    if (trimmed === '') {
      clearStoredHost();
    } else {
      setStoredHost(trimmed);
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-bg-card border border-border rounded-2xl p-10 max-w-[720px] w-full">
        <h1 className="text-3xl font-semibold text-text-primary mb-3">
          {state === 'stuck'
            ? 'ARRA Oracle 🔮 is not responding'
            : 'ARRA Oracle 🔮 needs a local MCP'}
        </h1>
        <p className="text-text-secondary mb-2">
          {state === 'stuck'
            ? `Something is listening on this host but it did not answer within ${PROBE_TIMEOUT_MS / 1000}s. The backend is most likely wedged — restart it rather than installing it again.`
            : 'This studio is a thin client. Run the backend locally first:'}
        </p>
        <p className="text-text-secondary text-xs mb-6">
          Current host: <code className="text-accent">{hostLabel()}</code>
        </p>

        {state === 'stuck' ? (
          <div className="space-y-4 mb-8">
            <InstallCard label="1. Restart the backend (pm2)" command="pm2 restart arra-oracle" />
            <InstallCard
              label="2. Or find and stop whatever holds the port"
              command="lsof -nP -iTCP:47778 -sTCP:LISTEN"
            />
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {/* Installed straight from GitHub: these packages are not published
                to npm, so a bare `bunx <name>` 404s. `#alpha` is deliberate —
                main lags the active branch by a long way. */}
            <InstallCard
              label="1. Backend (MCP server)"
              command="bunx --bun github:Soul-Brews-Studio/arra-oracle-v3#alpha"
            />
            <InstallCard
              label="2. CLI"
              command="bunx --bun -p github:Soul-Brews-Studio/arra-oracle-v3#alpha arra"
            />
          </div>
        )}

        {state === 'down' && (
          <p className="text-text-muted text-xs mb-6 leading-relaxed">
            A browser cannot tell “nothing is running” apart from “the request was
            blocked before it left the page”. If the backend <em>is</em> up, this is
            usually Chrome’s private-network rules or CORS on a{' '}
            <code className="text-accent">localhost</code> host reached from an{' '}
            <code className="text-accent">https://</code> origin — check it directly
            with <code className="text-accent">curl {hostLabel().replace(' (default)', '')}/api/v1/health</code>.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
          >
            Retry
          </button>
          <button
            onClick={handleChangeHost}
            className="px-4 py-2 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-bg-hover"
          >
            Change host
          </button>
        </div>
      </div>
    </div>
  );
}

function InstallCard({ label, command }: { label: string; command: string }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-bg-elevated">
      <div className="text-text-secondary text-xs mb-2">{label}</div>
      <pre className="text-sm text-text-primary font-mono overflow-x-auto">{command}</pre>
    </div>
  );
}
