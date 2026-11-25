/** The right-hand rail of the History tab: every vault commit, newest on top. Click one to travel there. */

import type { EventKind, HistoryEvent } from './history-api';
import { ago } from './format';

const DOT: Record<EventKind, string> = {
  init: 'var(--color-accent)', share: 'var(--color-ok-text)', retire: 'var(--color-err-text)', other: 'var(--color-text-muted)',
};
const WORD: Record<EventKind, string> = { init: 'Vault created', share: 'Note shared', retire: 'Revoked', other: 'Change' };

/** "share: Note from node a" → "Note from node a". */
const what = (e: HistoryEvent) => e.subject.replace(/^(share|retire|init):?\s*/, '') || WORD[e.kind];

export function HistoryTimeline({ events, head, selected, onPick }: { events: HistoryEvent[]; head: string | null; selected: string | null; onPick: (sha: string) => void }) {
  return (
    <ol aria-label="Vault timeline" className="relative ml-2 border-l border-border">
      {events.map((e) => {
        const on = e.sha === selected;
        return (
          <li key={e.sha} className="relative -ml-px pl-5 pb-1">
            <span aria-hidden className="absolute -left-[6px] top-3.5 h-[11px] w-[11px] rounded-full border-2 border-bg" style={{ background: DOT[e.kind] }} />
            <button
              type="button"
              onClick={() => onPick(e.sha)}
              aria-current={on ? 'true' : undefined}
              className={`focus-ring w-full rounded-lg px-3 py-2 text-left transition-colors ${on ? 'bg-accent-soft' : 'hover:bg-surface-muted'}`}
            >
              <span className="flex items-center gap-2 text-xs text-text-muted">
                <span style={{ color: DOT[e.kind] }}>{WORD[e.kind]}</span>
                {e.sha === head && <span className="rounded bg-accent-soft px-1.5 text-accent">now</span>}
                {e.snapshots.length > 0 && <span className="rounded border border-border px-1.5" title={e.snapshots.join('\n')}>backup</span>}
              </span>
              <span className={`mt-0.5 block truncate text-sm ${on ? 'font-semibold text-accent' : 'text-text'}`}>{what(e)}</span>
              <span className="mt-0.5 block text-xs text-text-muted">{ago(e.at)} · <span className="font-mono">{e.short}</span> · {e.author}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
