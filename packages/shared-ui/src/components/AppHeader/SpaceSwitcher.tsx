import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { apiUrl } from '../../host';
import { getSpace, onSpaceChange, setSpace } from '../../space';

interface SpaceInfo { id: string; label: string; docs: number; role: 'self' | 'owner' | 'joined'; expired?: boolean }

const ROLE: Record<SpaceInfo['role'], string> = { self: 'local', owner: 'owner', joined: 'joined' };

/**
 * Header space picker (#3110): a button + list, not the browser's select (Nat: "drop down is not
 * cool"). All spaces · This machine · each hub, with its role and note count. Keyboard: Enter or
 * Space opens, arrows move, Enter picks, Escape closes. Shown only when /api/arra/spaces answers
 * (the owner's machine) and there is more than one space.
 */
export function SpaceSwitcher() {
  const [spaces, setSpaces] = useState<SpaceInfo[] | null>(null);
  const [space, setLocal] = useState(getSpace);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => onSpaceChange(setLocal), []);
  useEffect(() => {
    fetch(apiUrl('/api/v1/arra/spaces'), { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null)).then((b) => setSpaces(b?.spaces ?? null)).catch(() => setSpaces(null));
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  if (!spaces || spaces.length < 2) return null;

  const options = [{ id: 'all', label: 'All spaces', docs: spaces.reduce((s, x) => s + x.docs, 0), role: null as SpaceInfo['role'] | null, expired: false }, ...spaces];
  const current = options.find((o) => o.id === space) ?? options[0];
  // Pages load their data once on mount: reload so every list and search re-runs in the new space.
  const pick = (id: string) => { setOpen(false); if (id !== space) { setSpace(id); window.location.reload(); } };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); setCursor(Math.max(0, options.indexOf(current))); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(options.length - 1, c + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); pick(options[cursor].id); }
  };

  return (
    <div ref={root} className="relative font-sans" onKeyDown={onKey}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Space: ${current.label}`}
        onClick={() => { setCursor(Math.max(0, options.indexOf(current))); setOpen((o) => !o); }}
        className="flex max-w-[220px] cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-card px-2.5 py-1 text-[12px] text-text-primary transition-colors hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="text-text-secondary">Space</span>
        <span className="truncate font-medium">{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`shrink-0 text-text-secondary transition-transform duration-150 ${open ? 'rotate-180' : ''}`}><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Spaces" className="absolute left-0 top-[calc(100%+6px)] z-[60] min-w-[260px] overflow-hidden rounded-lg border border-border bg-bg-card p-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          {options.map((o, i) => {
            const selected = o.id === current.id;
            return (
              <li
                key={o.id}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setCursor(i)}
                onClick={() => pick(o.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-[13px] ${i === cursor ? 'bg-white/[0.05]' : ''} ${selected ? 'text-accent' : 'text-text-primary'}`}
              >
                <span className="w-3 shrink-0 text-accent">{selected ? '✓' : ''}</span>
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.role && <span className="shrink-0 rounded border border-border px-1.5 text-[11px] text-text-secondary">{o.expired ? 'expired' : ROLE[o.role]}</span>}
                <span className="w-8 shrink-0 text-right font-mono text-[11px] text-text-secondary">{o.docs}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
