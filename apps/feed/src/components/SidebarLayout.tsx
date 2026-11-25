import { Children, isValidElement } from 'react';
import { PageHeader, PageShell, Segmented } from '@ui-oracle/shared-ui';

const DEFAULT_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'principle', label: 'Principles' },
  { key: 'learning', label: 'Learnings' },
  { key: 'retro', label: 'Retros' }
];

interface FilterItem {
  key: string;
  label: string;
}

interface NavItem {
  path: string;
  label: string;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeType?: string;
  onTypeChange?: (type: string) => void;
  filters?: FilterItem[];
  filterTitle?: string;
  linkBase?: string;
  navItems?: NavItem[];
  navTitle?: string;
}

export const TOOLS_NAV: NavItem[] = [
  { path: '/evolution', label: 'Evolution' },
  { path: '/traces', label: 'Traces' },
  { path: '/superseded', label: 'Superseded' },
  { path: '/handoff', label: 'Handoff' },
  { path: '/schedule', label: 'Schedule' },
];

export function SidebarLayout({
  children,
  activeType = 'all',
  onTypeChange,
  filters = DEFAULT_TYPES,
  linkBase = '/feed',
}: SidebarLayoutProps) {
  // Title first, then filters: a leading <PageHeader> child is lifted above the pill row.
  const [first, ...rest] = Children.toArray(children);
  const header = isValidElement(first) && first.type === PageHeader ? first : null;

  return (
    <PageShell width="reading">
      {header}
      {/* Section pages are the PageHeader tabs; this is only the list filter (one compact control). */}
      {filters.length > 0 && (
        <Segmented
          className="mb-6"
          label="Filter"
          value={activeType}
          onChange={onTypeChange}
          items={filters.map((t) => ({ key: t.key, label: t.label, ...(onTypeChange ? {} : { href: t.key === 'all' ? linkBase : `${linkBase}?type=${t.key}` }) }))}
        />
      )}

      <div className="min-w-0">
        {header ? rest : children}
      </div>
    </PageShell>
  );
}
