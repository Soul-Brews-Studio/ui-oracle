/**
 * arra hub pages (#3110): the Studio route /hub (one app, one dist), on `arra serve --hub`.
 * Status · Topology · Nodes · History · Search · Graph · Ontology · Invite. On the hub machine (loopback) everything works; from any
 * other machine /api/arra answers 403, so only the public hub card shows and the rest says
 * "owner only". Invite and revoke can never run from another machine: the server refuses.
 */

import { useCallback, useEffect, useState } from 'react';
import { PageHeader, PillRow, pillClass } from '@ui-oracle/shared-ui';
import { hubApi as defaultApi, OwnerOnlyError, type ArraStatus, type HubApi, type HubNodeRow, type InviteRow, type PublicHub } from './api';
import { TABS, tabFromHash, type Tab } from './format';
import { GraphView } from './GraphView';
import { InviteView } from './InviteView';
import { OntologyView } from './OntologyView';
import { NodesView } from './NodesView';
import { SearchView } from './SearchView';
import { StatusView } from './StatusView';
import { TopologyView } from './TopologyView';
import { HistoryView } from './HistoryView';
import { ErrorLine, OwnerOnly } from './ui';

const LABEL: Record<Tab, string> = { status: 'Status', topology: 'Topology', nodes: 'Nodes', history: 'History', search: 'Search', graph: 'Graph', ontology: 'Ontology', invite: 'Invite' };

export function HubApp({ api = defaultApi }: { api?: HubApi }) {
  const [tab, setTab] = useState<Tab>(() => (typeof location === 'undefined' ? 'status' : tabFromHash(location.hash)));
  const [owner, setOwner] = useState<boolean | null>(null);
  const [status, setStatus] = useState<ArraStatus | null>(null);
  const [publicHub, setPublicHub] = useState<PublicHub | null>(null);
  const [nodes, setNodes] = useState<{ nodes: HubNodeRow[]; invites: InviteRow[] }>({ nodes: [], invites: [] });
  const [showIps, setShowIps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    api.publicHub().then(setPublicHub, () => setPublicHub(null));
    try {
      const s = await api.status();
      setStatus(s); setOwner(true);
      if (s.hub) setNodes(await api.nodes());
    } catch (e) {
      if (e instanceof OwnerOnlyError) { setOwner(false); setStatus(null); }
      else setError(e instanceof Error ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const onHash = () => setTab(tabFromHash(location.hash));
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const hubName = status?.hub?.name ?? publicHub?.hub ?? null;
  return (
    <div className="min-w-0">
      <PageHeader title="Hub" subtitle="Machines that joined this hub, how they connect, and what arra stores." actions={
        <>
          <span className="text-sm font-semibold text-text">{hubName ? `hub:${hubName}` : 'not a hub'}</span>
          <span data-testid="viewer" className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${owner ? 'status-ok' : 'status-warn'}`}>
            {owner === null ? 'checking…' : owner ? 'owner (this machine)' : 'visitor (read-only)'}
          </span>
          {owner && <label className="flex items-center gap-2 text-sm text-text-muted"><input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" checked={showIps} onChange={(e) => setShowIps(e.target.checked)} /> show addresses</label>}
        </>
      } />
      <PillRow label="hub pages" className="mb-6">
        {TABS.map((t) => (
          <a key={t} href={`#/${t}`} role="tab" aria-selected={tab === t} aria-current={tab === t ? 'page' : undefined} className={`focus-ring ${pillClass(tab === t)}`}>{LABEL[t]}</a>
        ))}
      </PillRow>
      <div className="grid min-w-0 gap-4">
        <ErrorLine error={error} />
        {tab === 'status' && <StatusView status={status} publicHub={publicHub} />}
        {tab === 'topology' && <TopologyView api={api} owner={owner} publicHub={publicHub} showIps={showIps} onChange={load} />}
        {tab !== 'status' && tab !== 'topology' && owner === false && <OwnerOnly what={LABEL[tab]} />}
        {tab === 'nodes' && owner && <NodesView api={api} nodes={nodes.nodes} invites={nodes.invites} onChange={load} showIps={showIps} />}
        {tab === 'history' && owner && <HistoryView />}
        {tab === 'search' && owner && <SearchView api={api} />}
        {tab === 'graph' && owner && <GraphView />}
        {tab === 'ontology' && owner && <OntologyView />}
        {tab === 'invite' && owner && <InviteView api={api} onChange={load} />}
      </div>
    </div>
  );
}
