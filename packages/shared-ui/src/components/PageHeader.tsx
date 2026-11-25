import type { ReactNode } from 'react';
import { SectionTabs } from './SectionNav';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned controls (refresh, filters, a status pill). Wraps under the title on phones. */
  actions?: ReactNode;
  className?: string;
  /** Show the section's page tabs under the title (default). Off for pages that render them elsewhere. */
  sectionTabs?: boolean;
}

/**
 * The one page title: 32px bold (26px on phones), subtitle 8px under it, 32px
 * before the content. Use it as the first child of PageShell on every page. It also renders the
 * current section's page tabs (sections.ts) under the title, so every page gets the same second row.
 */
export function PageHeader({ title, subtitle, actions, className = '', sectionTabs = true }: PageHeaderProps) {
  return (
    <>
    <header className={`mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-[26px] md:text-[32px] leading-tight font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
    {sectionTabs && <SectionTabs className="-mt-4 mb-8" />}
    </>
  );
}
