import { Link } from 'react-router-dom'

export function HubHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-lg">🔮</span>
          <span className="font-semibold tracking-tight">
            ARRA <span className="text-accent">Oracle</span>
          </span>
          <span className="ml-1 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Hub
          </span>
        </Link>
        <span className="font-mono text-xs text-text-muted">{__APP_VERSION__}</span>
      </div>
    </header>
  )
}
