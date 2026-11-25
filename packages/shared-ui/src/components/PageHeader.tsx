import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned controls (refresh, filters, a status pill). Wraps under the title on phones. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The one page title: 32px bold (26px on phones), subtitle 8px under it, 32px
 * before the content. Use it as the first child of PageShell on every page.
 */
export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-[26px] md:text-[32px] leading-tight font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
