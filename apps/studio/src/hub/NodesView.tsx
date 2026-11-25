import { EmptyState } from '@ui-oracle/shared-ui';
import { useState } from 'react';
import type { HubApi, HubNodeRow, InviteRow } from './api';
import { ago, maskIp, stateTone } from './format';
import { Badge, Card, danger, ErrorLine, ghost, input } from './ui';

interface Props { api: HubApi; nodes: HubNodeRow[]; invites: InviteRow[]; onChange: () => void; showIps: boolean }

export function NodesView({ api, nodes, invites, onChange, showIps }: Props) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [why, setWhy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ip = (v: string | null) => (showIps ? v ?? '-' : maskIp(v));

  async function revoke(id: string) {
    setBusy(true); setError(null);
    try { await api.revoke(id, why.trim() || 'revoked from the hub UI'); setRevoking(null); setWhy(''); onChange(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const expiry = (n: HubNodeRow) => (n.state === 'revoked' ? `revoked ${ago(n.revokedAt)}` : n.expiresAt ? n.left : 'forever');
  const revokeControls = (n: HubNodeRow) => (
    <>
      {n.state !== 'revoked' && revoking !== n.id && <button className={danger} onClick={() => { setRevoking(n.id); setError(null); }}>Revoke</button>}
      {revoking === n.id && (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <input className={`${input} w-full sm:w-48`} placeholder="why (RETIRED.md row)" value={why} onChange={(e) => setWhy(e.target.value)} />
          <button className={danger} disabled={busy} onClick={() => revoke(n.id)}>Confirm revoke</button>
          <button className={ghost} onClick={() => setRevoking(null)}>Cancel</button>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <Card title={`Nodes (${nodes.length})`} right={<button className={ghost} onClick={onChange}>Refresh</button>}>
        {nodes.length === 0 && <EmptyState title="No node has joined yet." >Make an invite.</EmptyState>}
        {nodes.length > 0 && <ul className="grid gap-4 sm:hidden" aria-label="nodes">
          {nodes.map((n) => (
            <li key={n.id} data-node-card={n.id} className="rounded-xl border border-border bg-bg-card p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="break-words text-text">{n.label}</div><div className="break-all font-mono text-xs text-text-muted">{n.id}</div></div>
                <Badge tone={stateTone(n.state)}>{n.state}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                <div><dt className="text-xs text-text-muted">expires</dt><dd className="font-mono text-xs text-text">{expiry(n)}</dd></div>
                <div><dt className="text-xs text-text-muted">last seen</dt><dd className="text-text">{ago(n.lastSeenAt)}</dd></div>
                <div><dt className="text-xs text-text-muted">from</dt><dd className="break-all font-mono text-xs text-text-muted">{ip(n.lastIp)}</dd></div>
                <div><dt className="text-xs text-text-muted">calls</dt><dd className="font-mono text-text">{n.calls}</dd></div>
              </dl>
              <div className="mt-3">{revokeControls(n)}</div>
            </li>
          ))}
        </ul>}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-text-muted">
              <tr><th className="py-2 pr-4">node</th><th className="pr-4">state</th><th className="pr-4">expires</th><th className="pr-4">last seen</th><th className="pr-4">from</th><th className="pr-4">calls</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {nodes.map((n) => (
                <tr key={n.id} data-node={n.id} className="align-top">
                  <td className="py-2 pr-4"><div className="text-text">{n.label}</div><div className="font-mono text-xs text-text-muted">{n.id}</div></td>
                  <td className="pr-4 pt-2"><Badge tone={stateTone(n.state)}>{n.state}</Badge></td>
                  <td className="pr-4 pt-2 font-mono text-xs text-text">{expiry(n)}</td>
                  <td className="pr-4 pt-2 text-text">{ago(n.lastSeenAt)}</td>
                  <td className="pr-4 pt-2 font-mono text-xs text-text-muted">{ip(n.lastIp)}</td>
                  <td className="pr-4 pt-2 font-mono text-text">{n.calls}</td>
                  <td className="pt-1 text-right">
                    {revokeControls(n)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ErrorLine error={error} />
        <p className="mt-3 text-xs text-text-muted">Revoke stops the token at once and writes a RETIRED.md row in the hub vault. Nothing is deleted.</p>
      </Card>
      <Card title={`Invites (${invites.length})`}>
        <ul className="space-y-1 text-sm">
          {invites.length === 0 && <li className="text-text-muted">none</li>}
          {invites.slice().reverse().map((i) => (
            <li key={i.createdAt} className="flex flex-wrap gap-3 font-mono text-xs text-text">
              <Badge tone={stateTone(i.state)}>{i.state}</Badge>
              <span>{i.label}</span><span className="text-text-muted">--for {i.grant}</span>
              <span className="text-text-muted">{i.usedBy ? `→ ${i.usedBy}` : `made ${ago(i.createdAt)}`}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
