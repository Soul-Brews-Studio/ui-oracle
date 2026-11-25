import { Children, isValidElement } from 'react';
import { AppLink as Link, PageHeader, PageShell, PillRow, pillClass } from '@ui-oracle/shared-ui';

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
  // Title first, then the section pills, like every other page: a leading
  // <PageHeader> child is lifted above the pill row.
  const [first, ...rest] = Children.toArray(children);
  const header = isValidElement(first) && first.type === PageHeader ? first : null;

  return (
    <PageShell width="reading">
      {header}
      {filters.length > 0 && <PillRow className="mb-6" label="Filters">
        {/* Section pages (Traces, Evolution, ...) are the PageHeader's section tabs now (sections.ts);
            this row keeps only the filters. `navItems` is accepted for old callers and ignored. */}
        {filters.length > 0 && filters.map(t => (
          onTypeChange ? (
            <button
              key={t.key}
              type="button"
              onClick={() => onTypeChange(t.key)}
              className={pillClass(activeType === t.key)}
            >
              {t.label}
            </button>
          ) : (
            <Link
              key={t.key}
              to={t.key === 'all' ? linkBase : `${linkBase}?type=${t.key}`}
              className={pillClass(activeType === t.key)}
            >
              {t.label}
            </Link>
          )
        ))}
      </PillRow>}

      <div className="min-w-0">
        {header ? rest : children}
      </div>
    </PageShell>
  );
}
