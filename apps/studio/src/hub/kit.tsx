import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
/** Glass, StatCard and Badge from arra-oracle-v3 Studio (frontend/src/components), so the hub module carries its own kit. */

// --- Glass ---

type GlassProps = ComponentPropsWithoutRef<'div'>;

export function Glass({ className = '', children, ...props }: GlassProps) {
  const classes = `glass rounded-xl ${className}`.trim();
  return <div className={classes} {...props}>{children}</div>;
}

// --- StatCard ---

export type StatTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const toneClasses: Record<StatTone, string> = {
  neutral: 'border-border',
  accent: 'border-accent-border',
  success: 'border-ok-border',
  warning: 'border-warn-border',
  danger: 'border-err-border',
};

const valueClasses: Record<StatTone, string> = {
  neutral: 'text-text',
  accent: 'text-accent',
  success: 'text-ok-text',
  warning: 'text-warn-text',
  danger: 'text-err-text',
};

export function StatCard({
  label,
  value,
  detail,
  tone = 'neutral',
  trend,
}: {
  label: string;
  value: ReactNode;
  detail: string;
  tone?: StatTone;
  trend?: string;
}) {
  const labelId = useId();
  return (
    <article
      aria-labelledby={labelId}
      className={`glass glass-hover min-w-0 rounded-xl border p-4 transition-[background-color,border-color,box-shadow] duration-200 ease-out ${toneClasses[tone]}`}
    >
      <p id={labelId} className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className={`break-words text-2xl font-semibold sm:text-3xl ${valueClasses[tone]}`} aria-live="polite">{value}</p>
        {trend ? <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-muted">{trend}</span> : null}
      </div>
      <p className="mt-1 break-words text-sm text-text-muted">{detail}</p>
    </article>
  );
}

// --- Badge ---

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-muted text-text-muted',
  accent: 'border-accent-border bg-accent-soft text-accent',
  success: 'border-ok-border bg-ok-bg text-ok-text',
  warning: 'border-warn-border bg-warn-bg text-warn-text',
  danger: 'border-err-border bg-err-bg text-err-text',
};

export function badgeToneForStatus(status?: string): BadgeTone {
  const value = status?.toLowerCase() ?? '';
  if (['ok', 'up', 'healthy', 'connected', 'enabled', 'green', 'success'].includes(value)) return 'success';
  if (['degraded', 'draining', 'inactive', 'disabled', 'warn', 'warning', 'yellow'].includes(value)) return 'warning';
  if (['error', 'err', 'down', 'unhealthy', 'failed', 'red', 'disconnected'].includes(value)) return 'danger';
  return value ? 'accent' : 'neutral';
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className = '',
  ariaLabel,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <span
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeToneClasses[tone]} ${className}`.trim()}
      data-contrast-badge
      data-contrast-target={`badge-${tone}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
