import { HubApp } from '../hub/HubApp';

/** /hub: the arra hub pages (status, topology, nodes, search, graph, ontology, invite) in the classic Studio. */
export function Hub() {
  return (
    <div className="hub-module mx-auto max-w-6xl px-6 py-6">
      <HubApp />
    </div>
  );
}
