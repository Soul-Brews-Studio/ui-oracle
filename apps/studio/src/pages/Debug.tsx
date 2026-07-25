/**
 * HUGINN — secret observability page (/__debug, /debug).
 *
 * Not in the menu registry: URL-reachable only. Mounted OUTSIDE BackendGate so
 * it works even when the backend is down. Three live streams:
 *   - Actions       — merged *_log rows   (GET /api/debug/actions)
 *   - Backend Errors— indexing/log errors (GET /api/debug/errors)
 *   - UI Errors     — client-side, captured in-browser (no backend needed)
 *
 * "What is arra doing + what's failing, right now." The observability raven.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { getDebugActions, getDebugErrors, isUnavailable } from '../api/debug';
import type { DebugAction, DebugError } from '../api/debug';
import {
  getUiErrors,
  subscribeUiErrors,
  clearUiErrors,
  installUiErrorCapture,
} from '../lib/ui-error-bus';
import type { UiError } from '../lib/ui-error-bus';

const POLL_MS = 2000;

const ACTION_COLOR: Record<string, string> = {
  activity: '#60a5fa',
  search: '#22d3ee',
  learn: '#a78bfa',
  trace: '#2dd4bf',
  supersede: '#fbbf24',
  consult: '#fb7185',
};
const UI_COLOR: Record<string, string> = {
  error: '#f87171',
  rejection: '#fb923c',
  fetch: '#fbbf24',
  console: '#9aa0ab',
};
const FALLBACK_COLOR = '#9aa0ab';
const ERROR_COLOR = '#f87171';

interface DisplayRow {
  id: number;
  ts: string;
  tag: string;
  color: string;
  title: string;
  detail?: string;
}

function ago(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  if (isNaN(ms)) return '';
  if (ms < 1000) return 'now';
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

const byNewest = (a: DisplayRow, b: DisplayRow) =>
  b.ts.localeCompare(a.ts) || b.id - a.id;

function asJson(v: unknown): string | undefined {
  if (v == null) return undefined;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function Debug() {
  const [actions, setActions] = useState<DebugAction[] | null>(null);
  const [backendErrors, setBackendErrors] = useState<DebugError[] | null>(null);
  const [actionsDown, setActionsDown] = useState(false);
  const [errorsDown, setErrorsDown] = useState(false);
  const [uiErrors, setUiErrors] = useState<UiError[]>(() => getUiErrors());
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Live UI-error subscription (no polling — pushed as they happen).
  useEffect(() => {
    installUiErrorCapture();
    return subscribeUiErrors((errs) => {
      if (!pausedRef.current) setUiErrors(errs);
    });
  }, []);

  // Poll the two backend streams.
  useEffect(() => {
    let alive = true;
    async function tick() {
      if (pausedRef.current) return;
      const [a, e] = await Promise.all([
        getDebugActions({ limit: 200 }),
        getDebugErrors({ limit: 200 }),
      ]);
      if (!alive) return;
      if (isUnavailable(a)) setActionsDown(true);
      else {
        setActionsDown(false);
        setActions(a.actions);
      }
      if (isUnavailable(e)) setErrorsDown(true);
      else {
        setErrorsDown(false);
        setBackendErrors(e.errors);
      }
    }
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const actionRows = useMemo<DisplayRow[]>(
    () =>
      (actions ?? [])
        .map((a) => ({
          id: a.id,
          ts: a.ts,
          tag: a.type,
          color: ACTION_COLOR[a.type] ?? FALLBACK_COLOR,
          title: a.duration_ms != null ? `${a.summary} · ${a.duration_ms}ms` : a.summary,
          detail: asJson(a.meta),
        }))
        .sort(byNewest),
    [actions],
  );

  const backendErrorRows = useMemo<DisplayRow[]>(
    () =>
      (backendErrors ?? [])
        .map((e) => ({
          id: e.id,
          ts: e.ts,
          tag: e.source,
          color: ERROR_COLOR,
          title: e.message,
          detail: asJson(e.context),
        }))
        .sort(byNewest),
    [backendErrors],
  );

  const uiErrorRows = useMemo<DisplayRow[]>(
    () =>
      uiErrors
        .map((u) => ({
          id: u.id,
          ts: u.ts,
          tag: u.kind,
          color: UI_COLOR[u.kind] ?? FALLBACK_COLOR,
          title: u.message,
          detail: [u.source, u.detail].filter(Boolean).join('\n') || undefined,
        }))
        .sort(byNewest),
    [uiErrors],
  );

  const backendReachable = !actionsDown || !errorsDown;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-[1700px] mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span aria-hidden>🐦‍⬛</span> HUGINN
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted border border-border rounded px-1.5 py-0.5">
                observability
              </span>
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              what arra is doing &amp; what&apos;s failing, right now
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  backendReachable ? 'bg-success' : 'bg-text-muted'
                }`}
              />
              backend {backendReachable ? 'reachable' : 'debug endpoints pending'}
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  paused ? 'bg-warning' : 'bg-accent animate-pulse'
                }`}
              />
              {paused ? 'paused' : 'live'}
            </span>
            <button
              onClick={() => setPaused((p) => !p)}
              className="px-3 py-1.5 rounded-lg border border-border text-text-primary font-medium hover:bg-bg-elevated"
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>

        {/* Three streams */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StreamPane
            title="Actions"
            rows={actionRows}
            unavailable={actionsDown}
            unavailableHint="arra-oracle-v3 needs GET /api/debug/actions"
            emptyHint="No actions yet."
          />
          <StreamPane
            title="Backend Errors"
            rows={backendErrorRows}
            unavailable={errorsDown}
            unavailableHint="arra-oracle-v3 needs GET /api/debug/errors"
            emptyHint="No backend errors. 🎉"
          />
          <StreamPane
            title="UI Errors"
            rows={uiErrorRows}
            live
            onClear={clearUiErrors}
            emptyHint="No UI errors captured this session. 🎉"
          />
        </div>
      </div>
    </div>
  );
}

function StreamPane({
  title,
  rows,
  live,
  unavailable,
  unavailableHint,
  emptyHint,
  onClear,
}: {
  title: string;
  rows: DisplayRow[];
  live?: boolean;
  unavailable?: boolean;
  unavailableHint?: string;
  emptyHint?: string;
  onClear?: () => void;
}) {
  const [active, setActive] = useState<Set<string>>(new Set());
  const tags = useMemo(
    () => Array.from(new Set(rows.map((r) => r.tag))).sort(),
    [rows],
  );
  const visible = active.size ? rows.filter((r) => active.has(r.tag)) : rows;

  const toggle = (tag: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });

  return (
    <div className="flex flex-col bg-bg-card border border-border rounded-xl overflow-hidden h-[calc(100vh-170px)] min-h-[420px]">
      <header className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            <span className="text-[11px] text-text-muted font-mono">{rows.length}</span>
            {live && (
              <span className="text-[10px] uppercase tracking-wider text-accent">live</span>
            )}
          </div>
          {onClear && rows.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] text-text-muted hover:text-accent underline-offset-2 hover:underline"
            >
              clear
            </button>
          )}
        </div>
        {tags.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => {
              const on = active.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggle(tag)}
                  className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border transition-colors ${
                    on
                      ? 'border-accent text-accent'
                      : 'border-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {unavailable ? (
          <PaneNotice
            title="Stream pending"
            body={unavailableHint ?? 'Endpoint not available yet.'}
          />
        ) : visible.length === 0 ? (
          <PaneNotice body={emptyHint ?? 'Nothing yet.'} muted />
        ) : (
          visible.map((row) => <RowView key={`${title}-${row.id}`} row={row} />)
        )}
      </div>
    </div>
  );
}

function RowView({ row }: { row: DisplayRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-3 py-2 border-b border-border/40 hover:bg-bg-elevated/40 text-sm">
      <div className="flex items-start gap-2">
        <span
          title={new Date(row.ts).toLocaleString()}
          className="text-[11px] text-text-muted font-mono w-9 shrink-0 pt-0.5 text-right"
        >
          {ago(row.ts)}
        </span>
        <span
          className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 mt-px"
          style={{ color: row.color, backgroundColor: `${row.color}1f` }}
        >
          {row.tag}
        </span>
        <span className="text-text-primary break-words min-w-0 flex-1">{row.title}</span>
        {row.detail && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-text-muted text-xs shrink-0 px-1 hover:text-accent"
            aria-label={open ? 'Collapse detail' : 'Expand detail'}
          >
            {open ? '−' : '⋯'}
          </button>
        )}
      </div>
      {open && row.detail && (
        <pre className="mt-1.5 ml-11 text-[11px] leading-relaxed text-text-muted whitespace-pre-wrap break-words bg-bg-primary/60 border border-border rounded p-2 max-h-60 overflow-y-auto">
          {row.detail}
        </pre>
      )}
    </div>
  );
}

function PaneNotice({ title, body, muted }: { title?: string; body: string; muted?: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12 gap-1">
      {title && <p className="text-sm font-medium text-text-secondary">{title}</p>}
      <p className={`text-xs ${muted ? 'text-text-muted' : 'text-text-secondary'}`}>{body}</p>
    </div>
  );
}
