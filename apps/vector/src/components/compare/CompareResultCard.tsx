import type { Document } from '../../api/oracle';
import { colorForDocId } from '../../lib/compare';

interface Props {
  doc: Document;
  rank: number;
  shared: boolean;
  unique: boolean;
  currentHost: string;
  studioOrigin: string;
}

export function CompareResultCard({ doc, rank, shared, unique, currentHost, studioOrigin }: Props) {
  const color = colorForDocId(doc.id);
  const scorePct = Math.round((doc.score ?? 0) * 100);
  const href = `${studioOrigin}/doc/${encodeURIComponent(doc.id)}?host=${encodeURIComponent(currentHost)}`;
  const statusDot = shared ? '●' : unique ? '○' : ' ';
  const statusColor = shared ? '#4ade80' : unique ? '#fbbf24' : 'transparent';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-[12px] p-3 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.35)] no-underline"
      style={{
        background: 'rgba(20, 20, 35, 0.55)',
        border: `1px solid ${shared ? 'rgba(74, 222, 128, 0.25)' : unique ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255, 255, 255, 0.05)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="text-[10px] font-mono font-bold tabular-nums py-0.5 px-1.5 rounded"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
        >
          #{rank}
        </span>
        <span className="text-[11px] text-text-muted tabular-nums">{scorePct}%</span>
        <span className="text-[11px] text-accent font-medium capitalize flex-1 min-w-0 truncate">
          {doc.type}
        </span>
        <span className="text-[12px] leading-none shrink-0" style={{ color: statusColor }} aria-hidden>
          {statusDot}
        </span>
      </div>

      <div className="text-[13px] text-text-primary leading-snug mb-1.5 line-clamp-2">
        {firstLine(doc.content) || doc.id}
      </div>

      {doc.concepts && doc.concepts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.concepts.slice(0, 3).map((c) => (
            <span
              key={c}
              className="text-[10px] py-0.5 px-1.5 rounded-full"
              style={{ background: 'rgba(100, 181, 246, 0.1)', color: 'var(--color-accent)' }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

function firstLine(content: string): string {
  return (content || '')
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/^#+\s*/gm, '')
    .split('\n')[0]
    ?.slice(0, 120) ?? '';
}
