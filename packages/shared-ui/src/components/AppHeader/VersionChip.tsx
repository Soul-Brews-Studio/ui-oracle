interface VersionChipProps {
  /** Backend version string, if known. When present, renders as " · <version>". */
  backendVersion?: string | null;
}

/**
 * Compact version chip — shows the frontend build version; when a backend
 * version is supplied, appends it in accent color.
 */
export function VersionChip({ backendVersion }: VersionChipProps) {
  const title = backendVersion
    ? `ui ${__APP_VERSION__} · api ${backendVersion}`
    : `ui ${__APP_VERSION__}`;
  return (
    <span
      className="text-[10px] font-medium text-text-muted bg-bg-card px-1.5 py-0.5 rounded"
      title={title}
    >
      {__APP_VERSION__}
      {backendVersion && <span className="text-text-muted/60"> · </span>}
      {backendVersion && <span className="text-accent/80">{backendVersion}</span>}
    </span>
  );
}
