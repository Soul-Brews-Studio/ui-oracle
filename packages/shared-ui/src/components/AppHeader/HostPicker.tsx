import { clearStoredHost, hostLabel, isDefault, setManuallyDisconnected, setStoredHost } from '../../host';
import { localStore, idbStore } from '../../cache';

/**
 * Pill button showing the current Oracle host, plus a "Disconnect" button.
 *
 * HostPicker only ever renders while BackendGate has let the app through
 * (Disconnect lives INSIDE the gate) — so being visible at all means we are
 * currently connected, regardless of which host. Disconnect therefore always
 * shows, not just for a non-default host: it sets the manually-disconnected
 * flag so BackendGate stops probing ANY backend (not even the default) until
 * the user explicitly hits Connect in the gate screen — "stay off until I say
 * so", not an auto-reconnect to whatever's reachable. It also resets the host
 * pointer to default and clears the shared-ui cache (host-agnostic keys would
 * otherwise serve stale data from the old backend after a future reconnect).
 */
export function HostPicker() {
  const onClick = () => {
    const next = window.prompt(
      'Oracle host (leave empty to use default localhost:47778):\n\nExamples:\n  localhost:47778\n  http://mba.wg:47778\n  https://oracle.example.com',
      isDefault ? '' : hostLabel().replace(' (default)', ''),
    );
    if (next === null) return;
    setManuallyDisconnected(false); // picking a host is an explicit connect intent
    if (next.trim() === '') clearStoredHost();
    else setStoredHost(next.trim());
    window.location.reload();
  };

  const onDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearStoredHost();
    setManuallyDisconnected(true);
    await Promise.allSettled([localStore.clear(), idbStore.clear()]);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onClick}
        title={`Click to change host. Currently: ${hostLabel()}`}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all duration-150 ${
          isDefault
            ? 'border-border text-text-muted hover:bg-bg-card'
            : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isDefault ? 'bg-text-muted' : 'bg-accent animate-pulse'}`}
        />
        <span className="max-w-[220px] truncate">{hostLabel()}</span>
      </button>
      <button
        onClick={onDisconnect}
        title="Disconnect — stop connecting to any backend until you reconnect"
        className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border text-text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-400 transition-all duration-150"
      >
        Disconnect
      </button>
    </div>
  );
}
