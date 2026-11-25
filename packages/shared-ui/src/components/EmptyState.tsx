import type { ReactNode } from 'react';

/** The one "nothing here yet" panel: same padding, colour and type on every page. */
export function EmptyState({ title, children, className = '' }: { title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-bg-card px-6 py-12 text-center ${className}`}>
      <p className="text-base text-text-secondary">{title}</p>
      {children && <div className="mt-2 text-sm text-text-secondary">{children}</div>}
    </div>
  );
}
