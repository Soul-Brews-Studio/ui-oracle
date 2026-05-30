import { Link } from 'react-router-dom'
import type { MouseEvent } from 'react'
import type { OracleApp } from '../data/apps'

export function AppCard({ app }: { app: OracleApp }) {
  const openStandalone = (e: MouseEvent) => {
    e.preventDefault()
    window.open(app.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Link
      to={`/a/${app.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card/60 p-5 transition-colors hover:border-border-hover hover:bg-bg-card ${
        app.featured ? 'lg:col-span-2' : ''
      }`}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${app.accent}, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <span
          className="grid h-11 w-11 place-items-center rounded-xl text-2xl"
          style={{ background: `${app.accent}22`, boxShadow: `inset 0 0 0 1px ${app.accent}33` }}
        >
          {app.emoji}
        </span>
        <button
          type="button"
          onClick={openStandalone}
          title="Open standalone"
          className="flex items-center gap-1 text-xs text-text-muted opacity-0 transition hover:text-text-primary group-hover:opacity-100"
        >
          open <span aria-hidden>↗</span>
        </button>
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        {app.tagline}
      </p>
      <h3 className="text-lg font-semibold" style={{ color: app.accent }}>
        {app.label}
      </h3>
      <p className="mt-1 text-sm leading-snug text-text-secondary">{app.description}</p>

      <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}
        />
        <span className="truncate font-mono">{app.host}</span>
      </div>
    </Link>
  )
}
