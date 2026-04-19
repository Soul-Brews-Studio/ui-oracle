import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { CrossOriginResolver, NavItem } from './nav-types';
import { isActivePath } from './nav-types';

interface ToolsDropdownProps {
  items: NavItem[];
  crossOriginHref: CrossOriginResolver;
  label?: string;
}

/**
 * Hover-triggered "Tools ▾" dropdown. Renders internal or cross-origin links
 * via `crossOriginHref(item)`.
 */
export function ToolsDropdown({ items, crossOriginHref, label = 'Tools ▾' }: ToolsDropdownProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const anyActive = items.some((t) => isActivePath(location, t.path));

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 bg-transparent border-none cursor-pointer font-[inherit] ${
          anyActive
            ? 'bg-bg-card text-accent'
            : 'text-text-secondary hover:bg-bg-card hover:text-accent'
        }`}
      >
        {label}
      </button>
      {open && (
        <>
          <div className="absolute top-full left-0 right-0 h-2" />
          <div className="absolute top-[calc(100%+4px)] right-0 bg-bg-card border border-border rounded-xl p-1 min-w-[140px] shadow-lg z-[200]">
            {items.map((item) => {
              const href = crossOriginHref(item);
              if (href) {
                return (
                  <a
                    key={href}
                    href={href}
                    className="block px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 text-text-secondary hover:bg-white/5 hover:text-accent"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
                    isActivePath(location, item.path)
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:bg-white/5 hover:text-accent'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
