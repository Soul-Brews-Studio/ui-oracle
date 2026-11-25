/**
 * History tab (#3110): time travel through the hub vault. The vault is git, so every shared note and every
 * revoke is a point in time. The rail on the right lists them; click one and the left shows the vault as it
 * was then: its notes (open any, even one retired since) and what has changed between then and now.
 * Read-only: going back never rewrites history.
 */

import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@ui-oracle/shared-ui';
import { OwnerOnlyError } from './api';
import { historyApi, type FileChange, type History, type HistoryApi, type VaultAt } from './history-api';
import { HistoryTimeline } from './HistoryTimeline';
import { Badge, Card, ErrorLine, OwnerOnly, ghost } from './ui';

const TONE: Record<FileChange['status'], 'success' | 'warning' | 'danger' | 'neutral'> = { added: 'success', modified: 'warning', deleted: 'danger', renamed: 'neutral' };
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function HistoryView({ api = historyApi }: { api?: HistoryApi }) {
  const [history, setHistory] = useState<History | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [at, setAt] = useState<VaultAt | null>(null);
  const [open, setOpen] = useState<{ path: string; markdown: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ownerOnly, setOwnerOnly] = useState(false);

  const fail = (e: unknown) => (e instanceof OwnerOnlyError ? setOwnerOnly(true) : setError(e instanceof Error ? e.message : String(e)));
  useEffect(() => { api.history().then((h) => { setHistory(h); setSha(h.head); }).catch(fail); }, [api]);
  useEffect(() => { if (sha) { setOpen(null); api.at(sha).then(setAt).catch(fail); } }, [api, sha]);
  const read = useCallback((path: string) => { if (sha) api.note(sha, path).then((markdown) => setOpen({ path, markdown })).catch(fail); }, [api, sha]);

  if (ownerOnly) return <OwnerOnly what="Vault history" />;
  if (error && !history) return <ErrorLine error={error} />;
  if (!history) return <EmptyState title="Loading the vault timeline…" />;
  if (!history.events.length) return <EmptyState title="No history yet">The vault has no commits.</EmptyState>;

  const past = sha !== history.head;
  const gone = new Set((at?.sinceThen ?? []).filter((c) => c.status === 'deleted').map((c) => c.path));
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="order-2 grid min-w-0 content-start gap-4 lg:order-1">
        {at && (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${past ? 'border-warn-border bg-warn-bg text-warn-text' : 'border-border bg-surface text-text-muted'}`}>
            <span>{past ? 'You are looking at the vault as it was on ' : 'Now: '}<b>{when(at.at)}</b> · {at.subject}</span>
            {past && <button type="button" className={ghost} onClick={() => setSha(history.head)}>Back to now</button>}
          </div>
        )}
        <Card title={`Notes then${at ? ` (${at.notes.length})` : ''}`}>
          <ul className="grid gap-1">
            {at?.notes.map((n) => (
              <li key={n.path}>
                <button type="button" onClick={() => read(n.path)} className={`focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted ${open?.path === n.path ? 'bg-accent-soft text-accent' : 'text-text'}`}>
                  <span className="min-w-0 truncate">{n.title}</span>
                  {gone.has(n.path) && <Badge tone="danger">gone now</Badge>}
                </button>
              </li>
            ))}
          </ul>
          {open && (
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-field p-4 font-mono text-[13px] leading-relaxed text-text">{open.markdown}</pre>
          )}
        </Card>
        {past && at && (
          <Card title={`Changed since then (${at.sinceThen.length})`}>
            {at.sinceThen.length === 0 ? <p className="text-sm text-text-muted">Nothing: the vault is the same now.</p> : (
              <ul className="grid gap-2 text-sm">
                {at.sinceThen.map((c) => (
                  <li key={c.path} className="flex items-center gap-3"><Badge tone={TONE[c.status]}>{c.status}</Badge><span className="min-w-0 truncate font-mono text-[13px] text-text-muted">{c.path}</span></li>
                ))}
              </ul>
            )}
          </Card>
        )}
        <ErrorLine error={error} />
      </div>
      <aside className="order-1 min-w-0 lg:order-2">
        <Card title="Timeline">
          <p className="-mt-2 mb-3 text-sm text-text-muted">Every note shared and every node revoked, newest on top. Click one to go back.</p>
          <div className="max-h-[340px] overflow-y-auto lg:max-h-[70vh]">
            <HistoryTimeline events={history.events} head={history.head} selected={sha} onPick={setSha} />
          </div>
        </Card>
      </aside>
    </div>
  );
}
