import { BackendChip, Brand, VersionChip } from '@ui-oracle/shared-ui';
import { ping } from '../api/oracle';

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 15, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex justify-between items-center gap-4 px-4 py-2 max-w-[1400px] mx-auto">
        <Brand label="ARRA 🔮Racle — Feed">
          <VersionChip />
        </Brand>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <a
            href={STUDIO_ORIGIN}
            className="px-2 py-0.5 rounded-md border border-border text-text-muted hover:bg-bg-card transition-all duration-150"
            title="Back to studio.buildwithoracle.com"
          >
            ← studio
          </a>
          <BackendChip ping={ping} />
        </div>
      </div>
    </header>
  );
}
