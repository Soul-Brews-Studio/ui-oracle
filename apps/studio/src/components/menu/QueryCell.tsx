import { useState } from 'react';

type QueryMap = Record<string, string>;

interface Props {
  value: QueryMap | null | undefined;
  onSave: (next: QueryMap | null) => void;
}

function entriesOf(v: QueryMap | null | undefined): Array<[string, string]> {
  if (!v) return [];
  return Object.entries(v);
}

export function QueryCell({ value, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Array<[string, string]>>(() => entriesOf(value));

  function expand() {
    setDraft(entriesOf(value));
    setOpen(true);
  }

  function commit() {
    const cleaned: QueryMap = {};
    for (const [k, v] of draft) {
      const key = k.trim();
      if (key) cleaned[key] = v;
    }
    const next = Object.keys(cleaned).length === 0 ? null : cleaned;
    onSave(next);
    setOpen(false);
  }

  const count = value ? Object.keys(value).length : 0;
  const summary = count === 0
    ? 'none'
    : Object.entries(value!).map(([k, v]) => `${k}=${v}`).join(' ');

  if (!open) {
    return (
      <button
        type="button"
        onClick={expand}
        className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 max-w-[140px] truncate"
        title={`query: ${summary}`}
      >
        {count === 0 ? '{ }' : `{${count}}`}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2 rounded border border-teal-500/40 bg-bg-base max-w-[280px]">
      <div className="text-[10px] text-text-secondary">query</div>
      {draft.length === 0 && (
        <div className="text-[10px] text-text-secondary italic">no entries</div>
      )}
      {draft.map(([k, v], idx) => (
        <div key={idx} className="flex gap-1">
          <input
            type="text"
            value={k}
            placeholder="key"
            onChange={(e) => setDraft((d) => d.map((row, i) => i === idx ? [e.target.value, row[1]] : row))}
            className="flex-1 min-w-0 bg-bg-elevated border border-border rounded px-1 py-0.5 text-[11px] font-mono"
          />
          <input
            type="text"
            value={v}
            placeholder="value"
            onChange={(e) => setDraft((d) => d.map((row, i) => i === idx ? [row[0], e.target.value] : row))}
            className="flex-1 min-w-0 bg-bg-elevated border border-border rounded px-1 py-0.5 text-[11px] font-mono"
          />
          <button
            type="button"
            onClick={() => setDraft((d) => d.filter((_, i) => i !== idx))}
            className="text-text-secondary hover:text-red-400 text-xs px-1"
            title="Remove"
          >×</button>
        </div>
      ))}
      <div className="flex gap-1 justify-between pt-1">
        <button
          type="button"
          onClick={() => setDraft((d) => [...d, ['', '']])}
          className="text-[10px] text-accent hover:underline"
        >+ add</button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[10px] text-text-secondary hover:text-accent"
          >cancel</button>
          <button
            type="button"
            onClick={commit}
            className="text-[10px] text-teal-300 hover:text-teal-200"
          >save</button>
        </div>
      </div>
    </div>
  );
}
