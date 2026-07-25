interface VersionChipProps {
  /** Backend version string, if known. When present, renders as " · <version>". */
  backendVersion?: string | null;
}

/**
 * Compact version chip — shows the frontend build version; when a backend
 * version is supplied, appends it in accent color.
 *
 * Both halves are LABELLED (`ui` / `api`) because they are different schemes
 * from different sources and were easy to confuse: `ui` is this bundle's
 * `v<pkg>+<gitHash>` (stamped at build time by vite), `api` is the backend's
 * CalVer read from its package.json via GET /api/health.
 */
export function VersionChip({ backendVersion }: VersionChipProps) {
  const title = backendVersion
    ? `frontend build ${__APP_VERSION__} · backend ${backendVersion}`
    : `frontend build ${__APP_VERSION__}`;
  return (
    <span
      className="text-[10px] font-medium text-text-muted bg-bg-card px-1.5 py-0.5 rounded"
      title={title}
    >
      <span className="text-text-muted/60">ui </span>
      {__APP_VERSION__}
      {backendVersion && <span className="text-text-muted/60"> · api </span>}
      {backendVersion && <span className="text-accent/80">{backendVersion}</span>}
    </span>
  );
}
