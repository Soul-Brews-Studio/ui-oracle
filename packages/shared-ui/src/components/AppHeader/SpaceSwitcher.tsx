import { useEffect, useState } from 'react';
import { apiUrl } from '../../host';
import { getSpace, onSpaceChange, setSpace } from '../../space';

interface SpaceInfo { id: string; label: string; docs: number; role: 'self' | 'owner' | 'joined'; expired?: boolean }

/**
 * Header picker (#3110): All · This machine · each hub. Shown only when the backend answers
 * /api/arra/spaces (the owner's own machine) and there is more than one space to pick.
 */
export function SpaceSwitcher() {
  const [spaces, setSpaces] = useState<SpaceInfo[] | null>(null);
  const [space, setLocal] = useState(getSpace);
  useEffect(() => onSpaceChange(setLocal), []);
  useEffect(() => {
    fetch(apiUrl('/api/v1/arra/spaces'), { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => setSpaces(b?.spaces ?? null))
      .catch(() => setSpaces(null));
  }, []);
  if (!spaces || spaces.length < 2) return null;
  const word = (s: SpaceInfo) => `${s.label}${s.role === 'owner' ? ' (owner)' : ''}${s.expired ? ' (expired)' : ''} · ${s.docs}`;
  return (
    <label className="flex items-center gap-1.5 font-sans text-[12px] text-text-secondary">
      <span className="hidden lg:inline">Space</span>
      <select
        aria-label="Space: which notes Studio shows"
        value={space}
        // Pages load their data once on mount: reload so every list and search re-runs in the new space.
        onChange={(e) => { setSpace(e.target.value); window.location.reload(); }}
        className="max-w-[180px] cursor-pointer rounded-md border border-border bg-bg-card px-2 py-1 text-[12px] text-text-primary [color-scheme:dark] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <option value="all">All spaces</option>
        {spaces.map((s) => <option key={s.id} value={s.id}>{word(s)}</option>)}
      </select>
    </label>
  );
}
