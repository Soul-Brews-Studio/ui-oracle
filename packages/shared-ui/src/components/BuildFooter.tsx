/**
 * Fixed bottom-of-page footer showing the frontend build version and build date.
 * Version comes from __APP_VERSION__ (v<pkg>+<gitHash>) and the date from
 * __BUILD_DATE__ (ISO string), both injected by each app's vite.config.ts.
 * Non-interactive, pointer-events-none so it never blocks the 3D canvas beneath.
 */
function formatBuildDate(iso: string): string {
  if (!iso || iso === 'dev') return 'dev';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // e.g. "2026-07-15 14:32 UTC"
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

export function BuildFooter() {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
  const built =
    typeof __BUILD_DATE__ !== 'undefined' ? formatBuildDate(__BUILD_DATE__) : 'dev';
  return (
    <footer
      className="fixed bottom-0 inset-x-0 z-20 pointer-events-none flex justify-center pb-1"
      aria-label="build info"
    >
      <span className="text-[10px] font-mono text-text-muted/70">
        {version} · built {built}
      </span>
    </footer>
  );
}
