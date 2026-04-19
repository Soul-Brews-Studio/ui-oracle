import type { Agreement } from '../../hooks/useCompareSearch';

interface Props {
  agreement: Agreement;
}

function colorForPct(pct: number): string {
  if (pct >= 0.66) return '#4ade80';
  if (pct >= 0.33) return '#fbbf24';
  return '#f87171';
}

function colorForShift(shift: number): string {
  if (shift <= 2) return '#4ade80';
  if (shift <= 5) return '#fbbf24';
  return '#f87171';
}

export function CompareAgreement({ agreement }: Props) {
  const { top1, top5Jaccard, avgShift } = agreement;
  const top1Pct = Math.round(top1 * 100);
  const jaccardPct = Math.round(top5Jaccard * 100);

  return (
    <div className="flex max-md:flex-col items-center gap-4 text-[12px]">
      <Badge label="Top-1" value={`${top1Pct}%`} color={colorForPct(top1)} />

      <div className="flex-1 min-w-[140px] flex flex-col gap-1 max-md:w-full">
        <div className="flex justify-between">
          <span className="text-text-muted uppercase tracking-wide text-[10px]">Top-5 Jaccard</span>
          <span className="tabular-nums font-semibold" style={{ color: colorForPct(top5Jaccard) }}>
            {jaccardPct}%
          </span>
        </div>
        <div className="h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <div
            className="h-full rounded-sm transition-[width] duration-500 ease-out"
            style={{ width: `${jaccardPct}%`, background: colorForPct(top5Jaccard) }}
          />
        </div>
      </div>

      <Badge
        label="Avg Shift"
        value={avgShift.toFixed(1)}
        color={colorForShift(avgShift)}
      />
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center py-1.5 px-3 rounded-lg min-w-[80px]"
      style={{ background: `${color}15`, border: `1px solid ${color}40` }}
    >
      <span className="text-[10px] text-text-muted uppercase tracking-wide">{label}</span>
      <span className="tabular-nums font-bold text-[14px]" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
