interface Props {
  variant: 'loading' | 'empty' | 'error';
  message?: string;
}

export function CompareEmpty({ variant, message }: Props) {
  if (variant === 'loading') {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[84px] rounded-[12px] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)',
              backgroundSize: '200% 100%',
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div
        className="text-center py-8 px-4 text-[12px] rounded-xl"
        style={{ background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#f87171' }}
      >
        <div className="font-semibold mb-1">Search failed</div>
        {message && <div className="text-[11px] opacity-80 font-mono">{message}</div>}
      </div>
    );
  }

  return (
    <div
      className="text-center text-text-muted py-8 px-4 text-[12px] rounded-xl"
      style={{ background: 'rgba(20, 20, 35, 0.3)' }}
    >
      No results
    </div>
  );
}
