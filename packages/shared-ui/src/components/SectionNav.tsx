import { Link, useLocation } from 'react-router-dom';
import { SECTIONS, sectionFor, tabMatches } from '../sections';
import { PillRow, pillClass } from './Pills';

/** Top bar: the seven sections. Plain router links (absolute paths), so they work inside any mounted app. */
export function SectionLinks({ className = '' }: { className?: string }) {
  const { pathname, search } = useLocation();
  const current = sectionFor(pathname, new URLSearchParams(search));
  return (
    <>
      {SECTIONS.map((s) => {
        const active = current?.key === s.key;
        return (
          <Link
            key={s.key}
            to={s.tabs[0].path}
            aria-current={active ? 'page' : undefined}
            className={`px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 border ${
              active ? 'bg-accent/15 text-accent font-semibold border-accent/20' : 'text-text-secondary hover:bg-bg-card hover:text-accent border-transparent'
            } ${className}`}
          >
            {s.label}
          </Link>
        );
      })}
    </>
  );
}

/** Under the page title: the current section's pages, one pill row. Hidden when the section has one page. */
export function SectionTabs({ className = '' }: { className?: string }) {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const section = sectionFor(pathname, params);
  if (!section || section.tabs.length < 2) return null;
  return (
    <PillRow label={`${section.label} pages`} className={className}>
      {section.tabs.map((t) => {
        const active = tabMatches(t, pathname, params);
        return (
          <Link key={t.path} to={t.path} role="tab" aria-selected={active} aria-current={active ? 'page' : undefined} className={pillClass(active)}>
            {t.label}
          </Link>
        );
      })}
    </PillRow>
  );
}
