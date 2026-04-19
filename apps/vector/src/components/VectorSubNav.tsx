import { Link, useLocation } from 'react-router-dom';
import { isVectorHost } from './Header';

type SubNavItem = { path: string; label: string; icon?: string };

const DEFAULT_ITEMS: SubNavItem[] = [
  { path: '/', label: 'Vector Playground', icon: '🔍' },
  { path: '/compare', label: 'Compare', icon: '⚖️' },
];

interface Props {
  items?: SubNavItem[];
}

/**
 * Vector-only sub-nav tab strip, rendered below the main Header.
 * Hidden outside vector.* hosts so studio.* keeps its own nav untouched.
 *
 * NOTE: reverted from DB-driven (PR #14) because /api/menu?host=X returns every
 * null-host item, which duplicates Header items into the sub-nav. Re-enable DB
 * fetch only after a scope key (e.g. group='subnav' or strict host filter) exists.
 * See feedback_subnav_distinct_scope.md.
 */
export function VectorSubNav({ items = DEFAULT_ITEMS }: Props) {
  const location = useLocation();

  if (!isVectorHost()) return null;

  return (
    <div
      className="sticky top-[92px] z-40 backdrop-blur-xl"
      style={{ background: 'rgba(10, 10, 15, 0.55)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
    >
      <nav className="flex items-center gap-1 px-4 py-1.5 max-w-[1400px] mx-auto overflow-x-auto">
        {items.map((it) => {
          const active = location.pathname === it.path;
          return (
            <Link
              key={it.path}
              to={it.path}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                  : 'text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent'
              }`}
            >
              {it.icon && <span aria-hidden>{it.icon}</span>}
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
