import { clearStoredHost, hostLabel, isDefault, setStoredHost } from '../../host';
import { localStore, idbStore } from '../../cache';

/**
 * Pill button showing the current Oracle host. Click opens a prompt to change
 * or clear the stored host; page reloads after change. When a non-default
 * host is active, a labelled "Disconnect" button appears alongside it — one
 * click back to the default localhost:47778, no prompt round-trip, and it
 * fully resets client state (not just the host pointer): the shared-ui cache
 * (menu, etc.) is host-agnostic — a stale entry fetched from the old backend
 * would otherwise survive the switch and get served under the new one.
 */
export function HostPicker() {
  const onClick = () => {
    const next = window.prompt(
      'Oracle host (leave empty to use default localhost:47778):\n\nExamples:\n  localhost:47778\n  http://mba.wg:47778\n  https://oracle.example.com',
      isDefault ? '' : hostLabel().replace(' (default)', ''),
    );
    if (next === null) return;
    if (next.trim() === '') clearStoredHost();
    else setStoredHost(next.trim());
    window.location.reload();
  };

  const onDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearStoredHost();
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
      {!isDefault && (
        <button
          onClick={onDisconnect}
          title="Disconnect — return to default localhost:47778 and clear cached state"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border text-text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-400 transition-all duration-150"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
