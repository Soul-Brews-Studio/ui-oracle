import { AppLink } from '../base-path';

export interface SegmentedItem { key: string; label: string; href?: string }

/**
 * The one filter control: a compact capsule of options that sits with the list it filters.
 * Deliberately smaller and boxed, so it never reads as a second navigation row (Nat 2026-11-25:
 * "reduce all submenus"). Navigation is the section tabs; this only narrows the list.
 */
export function Segmented({ items, value, onChange, label, className = '' }: {
  items: SegmentedItem[]; value: string; onChange?: (key: string) => void; label: string; className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-bg-card p-0.5 text-[12px] [scrollbar-width:none] ${className}`}>
      {items.map((it) => {
        const on = it.key === value;
        const cls = `shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 font-[inherit] transition-colors duration-150 ${
          on ? 'bg-accent/15 font-medium text-accent' : 'text-text-secondary hover:text-text-primary'
        } focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`;
        return it.href
          ? <AppLink key={it.key} to={it.href} role="radio" aria-checked={on} className={cls}>{it.label}</AppLink>
          : <button key={it.key} type="button" role="radio" aria-checked={on} onClick={() => onChange?.(it.key)} className={`${cls} cursor-pointer border-none bg-transparent`}>{it.label}</button>;
      })}
    </div>
  );
}
