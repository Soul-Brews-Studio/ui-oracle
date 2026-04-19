import type { ReactNode } from 'react';
import { LAYOUT } from '../tokens';

interface PageShellProps {
  children: ReactNode;
  /** Max-width for the container. Default: 1300px. */
  maxWidth?: string;
  /** Extra class names to merge onto the container. */
  className?: string;
}

/**
 * Standard page container — centers content with max-width + padding.
 * Use on every top-level route component to keep layout consistent across apps.
 */
export function PageShell({
  children,
  maxWidth = LAYOUT.maxWidth,
  className = '',
}: PageShellProps) {
  return (
    <div
      className={`mx-auto py-6 px-6 ${className}`}
      style={{ maxWidth }}
    >
      {children}
    </div>
  );
}
