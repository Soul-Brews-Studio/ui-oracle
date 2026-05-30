import { useParams, Link, Navigate } from 'react-router-dom'
import { APPS } from '../data/apps'

export function EmbedView() {
  const { id } = useParams()
  const app = APPS.find((a) => a.id === id)

  if (!app) return <Navigate to="/" replace />

  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-bg-primary/80 px-4 backdrop-blur">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-text-primary"
        >
          <span aria-hidden className="text-base">←</span> Hub
        </Link>
        <span className="h-5 w-px bg-border" />
        <span className="text-lg">{app.emoji}</span>
        <span className="font-medium" style={{ color: app.accent }}>
          {app.label}
        </span>
        <span className="hidden font-mono text-xs text-text-muted sm:inline">{app.host}</span>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-sm text-text-secondary transition hover:text-accent"
        >
          Open standalone <span aria-hidden>↗</span>
        </a>
      </div>

      <iframe
        src={app.url}
        title={app.label}
        className="w-full flex-1 border-0 bg-bg-primary"
        allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  )
}
