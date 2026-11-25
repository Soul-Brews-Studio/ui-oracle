/** Phone layout of the Topology drawing (#3110): the same boxes, words and colours as TopologyCanvas, stacked full width. */

import type { CSSProperties, ReactNode } from 'react';
import type { Topology } from './topology-api';
import { ago, shortSha } from './format';
import { activityLine, EXPORT, ossieLine, stateOf, statusLine, STRANGER, strangerLines } from './topology-words';

function Box({ title, lines, style, onClick, selected, ...rest }: { title: string; lines: { t: string; c?: string }[]; style?: CSSProperties; onClick?: () => void; selected?: boolean; [k: string]: unknown }) {
  return (
    <div {...rest} onClick={onClick} role={onClick ? 'button' : undefined} style={{ borderWidth: selected ? 3 : 2, ...style }}
      className={`min-w-0 rounded-xl p-4 text-sm ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="break-words text-base font-semibold text-text">{title}</div>
      {lines.map((l, i) => <div key={i} className="mt-1 break-words" style={{ color: l.c ?? 'var(--color-text-muted)' }}>{l.t}</div>)}
    </div>
  );
}

const Arrow = ({ children }: { children?: ReactNode }) => <div className="py-1 text-center text-xs text-text-muted" aria-hidden="true">↓ {children}</div>;

export function TopologyStack({ t, selected, onPick }: { t: Topology; selected?: string | null; onPick?: (id: string) => void }) {
  const o = ossieLine(t.ossie);
  const commit = t.truth ? `${t.truth.name} · commit ${shortSha(t.truth.sha)}${t.truth.committedAt ? ` · ${ago(t.truth.committedAt)}` : ''}${t.truth.dirty ? ' · unsaved edits' : ''}` : 'no vault connected';
  return (
    <div className="flex flex-col" data-testid="topology-stack">
      <Box data-box="vault" title="Org vault (git)" lines={[{ t: commit }]} style={{ borderStyle: 'solid', borderColor: EXPORT, background: 'var(--color-surface)' }} />
      <Arrow />
      <Box data-box="hub" title={t.hub ? `hub:${t.hub.name}` : 'not a hub'}
        lines={[{ t: t.hub ? `${t.hub.docs} shared notes · port ${t.hub.port ?? '-'}` : '' }, { t: 'you are the owner', c: 'var(--color-ok-text)' }]}
        style={{ borderStyle: 'solid', borderColor: 'var(--color-accent)', background: 'var(--color-surface)' }} />
      <Arrow>one-way export</Arrow>
      <Box data-box="ossie" title="Ossie export" lines={[{ t: o.text, c: o.colour }]} style={{ borderStyle: 'dashed', borderColor: EXPORT }} />
      <div className="mt-4 mb-2 text-sm tracking-wide text-text-muted">Machines that joined</div>
      <div className="grid gap-3">
        {t.nodes.map((n) => {
          const s = stateOf(n); const act = activityLine(n);
          return <Box key={n.id} data-node={n.id} data-state={n.state} title={n.label} selected={selected === n.id} onClick={() => onPick?.(n.id)}
            lines={[{ t: statusLine(n), c: s.text }, { t: act.text, c: act.alert ? s.text : undefined }]}
            style={{ borderStyle: s.dash ? 'dashed' : 'solid', borderColor: selected === n.id ? 'var(--color-text)' : s.stroke, background: s.fill }} />;
        })}
        <Box data-box="strangers" title="Strangers" lines={strangerLines(t.door).map((l, i) => ({ t: l, c: i === 0 ? STRANGER.text : undefined }))}
          style={{ borderStyle: 'dotted', borderColor: STRANGER.stroke }} />
      </div>
    </div>
  );
}
