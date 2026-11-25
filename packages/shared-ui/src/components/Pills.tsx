import type { ReactNode } from 'react';

/**
 * The one tab / filter style. A row scrolls sideways on phones instead of
 * wrapping into several rows. Use `pillClass(active)` on a <button> or <Link>.
 */
export function pillClass(active: boolean): string {
  return `shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] border-none cursor-pointer font-[inherit] transition-colors duration-150 ${
    active
      ? 'bg-accent/10 text-accent font-medium'
      : 'bg-transparent text-text-secondary hover:bg-bg-card hover:text-text-primary'
  }`;
}

export function PillRow({ children, className = '', label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div role="tablist" aria-label={label} className={`flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] ${className}`}>
      {children}
    </div>
  );
}
