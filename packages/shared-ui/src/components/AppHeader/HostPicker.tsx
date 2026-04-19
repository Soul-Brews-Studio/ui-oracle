import { clearStoredHost, hostLabel, isDefault, setStoredHost } from '../../host';

/**
 * Pill button showing the current Oracle host. Click opens a prompt to change
 * or clear the stored host; page reloads after change.
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

  return (
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
  );
}
