import type { ReactNode } from 'react';
import { LAYOUT, type PageWidth } from '../tokens';

interface PageShellProps {
  children: ReactNode;
  /**
   * Page width: `reading` 900px (lists, feeds, docs), `wide` 1152px (tables,
   * dashboards, Hub), `form` 640px (settings, single forms), `full` no cap
   * (canvas / 3D scenes). Default `reading`.
   */
  width?: PageWidth;
  /** Legacy escape hatch: an exact max-width. Prefer `width`. */
  maxWidth?: string;
  /** Extra class names to merge onto the container. */
  className?: string;
}

/**
 * The one page container. Every top-level route uses it so every page starts at
 * the same distance under the header, centred, with the same side gutters:
 * 20px / 24px phone gutters, 24px / 32px top padding (phone / desktop).
 */
export function PageShell({ children, width = 'reading', maxWidth, className = '' }: PageShellProps) {
  const cap = maxWidth ?? LAYOUT.widths[width];
  // Same container and gutters as the header row; the content column is centred inside it
  // (Nat 2026-11-25: "ui center is better"), so pages of one width share both edges.
  return (
    <div className={`mx-auto w-full min-w-0 max-w-[1400px] px-5 py-6 md:px-6 md:py-8 ${className}`}>
      <div className="mx-auto min-w-0" style={cap === 'none' ? undefined : { maxWidth: cap }}>
        {children}
      </div>
    </div>
  );
}
