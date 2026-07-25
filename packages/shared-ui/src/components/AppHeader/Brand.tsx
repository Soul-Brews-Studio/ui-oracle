import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface BrandProps {
  /** Brand text — e.g. "ARRA Oracle 🔮" or "ARRA Oracle 🔮 — Canvas". */
  label?: ReactNode;
  /** Path the brand links to. Default "/". */
  to?: string;
  /** Optional adornment rendered after the brand label (e.g. VersionChip). */
  children?: ReactNode;
}

/**
 * Brand link + optional right-adornment (e.g. version chip).
 * Layout and typography are fixed; consumers compose adornments as children.
 */
export function Brand({ label = 'ARRA Oracle 🔮', to = '/', children }: BrandProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 text-lg font-bold text-accent shrink-0 min-w-0"
    >
      <span>{label}</span>
      {children}
    </Link>
  );
}
