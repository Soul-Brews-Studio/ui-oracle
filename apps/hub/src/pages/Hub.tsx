import { HubHeader } from '../components/HubHeader'
import { AppCard } from '../components/AppCard'
import { APPS } from '../data/apps'

export function Hub() {
  return (
    <div className="min-h-screen">
      <HubHeader />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="py-14 text-center sm:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            One Oracle · Many Faces
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">The Oracle Hub</h1>
          <p className="mx-auto max-w-xl leading-relaxed text-text-secondary">
            Every Oracle surface in one place. Launch any app inline, or open it standalone.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        <footer className="mt-16 text-center text-xs text-text-muted">
          <span className="font-mono">{__APP_VERSION__}</span>
          <span className="mx-2">·</span>
          {APPS.length} apps
          <span className="mx-2">·</span>
          app.buildwithoracle.com
        </footer>
      </main>
    </div>
  )
}
