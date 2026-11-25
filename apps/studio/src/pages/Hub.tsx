import { PageShell } from '@ui-oracle/shared-ui';
import { HubApp } from '../hub/HubApp';

/** /hub: the arra hub pages (status, topology, nodes, search, graph, ontology, invite) in the classic Studio. */
export function Hub() {
  return (
    <PageShell width="wide">
      <div className="hub-module">
        <HubApp />
      </div>
    </PageShell>
  );
}
