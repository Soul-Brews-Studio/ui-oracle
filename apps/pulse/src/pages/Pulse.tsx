import { useState, useEffect, useMemo } from 'react';
import { PageShell } from '@ui-oracle/shared-ui';
import { getPulseStatus, type PulseStatus, type ServiceState } from '../api/pulse';

const stateBadge: Record<ServiceState, { label: string; className: string }> = {
  up: { label: '● UP', className: 'text-success' },
  down: { label: '● DOWN', className: 'text-danger' },
  unknown: { label: '● ?', className: 'text-text-muted' },
};

const severityBadge: Record<'info' | 'warn' | 'error', string> = {
  info: 'text-accent',
  warn: 'text-warning',
  error: 'text-danger',
};

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Pulse() {
  const [status, setStatus] = useState<PulseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStatus(await getPulseStatus());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    if (!status) return null;
    const total = status.services.length;
    const up = status.services.filter(s => s.state === 'up').length;
    const down = status.services.filter(s => s.state === 'down').length;
    const unknown = total - up - down;
    return { total, up, down, unknown };
  }, [status]);

  return (
    <PageShell className="text-text-primary">
      <div className="flex justify-between items-start mb-6 max-md:flex-col max-md:gap-3">
        <div>
          <h1 className="text-[32px] font-bold text-text-primary mb-2">Pulse 🫀</h1>
          <p className="text-text-secondary text-sm">
            TCONSIAM infrastructure heartbeat —{' '}
            <code className="bg-bg-card px-1.5 py-0.5 rounded text-[13px]">{status?.server ?? '…'}</code>
          </p>
        </div>
        <button
          className="bg-accent text-black border-none px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {status?.meta.note && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-[13px] text-warning">
          ⚠️ {status.meta.note}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          ✗ {error}
        </div>
      )}

      {loading && !status ? (
        <div className="text-text-muted py-12 text-center">Loading status…</div>
      ) : status && summary ? (
        <>
          <div className="grid grid-cols-4 gap-3 mb-8 max-md:grid-cols-2">
            <SummaryCard label="Services" value={String(summary.total)} tone="muted" />
            <SummaryCard label="Up" value={String(summary.up)} tone="success" />
            <SummaryCard label="Down" value={String(summary.down)} tone={summary.down > 0 ? 'danger' : 'muted'} />
            <SummaryCard label="Unknown" value={String(summary.unknown)} tone="muted" />
          </div>

          <section className="mb-8">
            <h2 className="text-[17px] font-semibold text-text-primary mb-3">Services</h2>
            <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-xs text-text-muted uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-semibold">State</th>
                    <th className="text-left px-4 py-3 font-semibold">Service</th>
                    <th className="text-left px-4 py-3 font-semibold">Endpoint</th>
                    <th className="text-right px-4 py-3 font-semibold">Latency</th>
                    <th className="text-left px-4 py-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {status.services.map(s => (
                    <tr key={s.id} className="border-t border-border text-[13px]">
                      <td className={`px-4 py-3 font-mono ${stateBadge[s.state].className}`}>{stateBadge[s.state].label}</td>
                      <td className="px-4 py-3 text-text-primary">{s.name}</td>
                      <td className="px-4 py-3 text-text-muted font-mono text-[12px] truncate max-w-[280px]">{s.url ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-text-secondary font-mono">{s.latencyMs != null ? `${s.latencyMs}ms` : '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.note ?? (s.expected && s.actual ? `${s.expected} → ${s.actual}` : '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div>
              <h2 className="text-[17px] font-semibold text-text-primary mb-3">7-day Uptime</h2>
              <div className="bg-bg-card border border-border rounded-xl p-4">
                <div className="flex gap-1.5 items-end h-24">
                  {status.uptime7d.map(d => {
                    const total = d.passed + d.failed;
                    const pct = total === 0 ? 0 : (d.passed / total) * 100;
                    const color = d.failed === 0 ? 'bg-success' : d.failed < 3 ? 'bg-warning' : 'bg-danger';
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-bg-secondary relative h-full flex flex-col justify-end">
                          <div className={`w-full rounded-t ${color}`} style={{ height: `${pct}%` }} title={`${d.date}: ${d.passed}/${total} passed`} />
                        </div>
                        <span className="text-[10px] text-text-muted font-mono">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-text-primary mb-3">Recent Alerts</h2>
              <div className="bg-bg-card border border-border rounded-xl divide-y divide-border">
                {status.recentAlerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-text-muted text-sm">No alerts — all quiet 🌿</div>
                ) : (
                  status.recentAlerts.map((a, i) => (
                    <div key={i} className="px-4 py-3 text-[13px]">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className={`font-mono text-xs uppercase tracking-wide ${severityBadge[a.severity]}`}>{a.severity}</span>
                        <span className="text-text-muted text-xs">{relTime(a.ts)}</span>
                      </div>
                      <div className="text-text-primary mt-1">
                        <span className="font-mono text-xs text-text-secondary mr-2">{a.service}</span>
                        {a.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <footer className="text-[11px] text-text-muted font-mono text-center py-4">
            Generated {relTime(status.generatedAt)} · source: {status.meta.source} · build {__APP_VERSION__}
          </footer>
        </>
      ) : null}
    </PageShell>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: 'success' | 'danger' | 'muted' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-text-primary';
  return (
    <div className="bg-bg-card border border-border rounded-xl px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-text-muted font-mono">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
