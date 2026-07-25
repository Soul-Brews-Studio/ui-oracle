/**
 * UI error bus — client-side observability for HUGINN (/__debug).
 *
 * Captures everything that goes wrong in the *browser* (not the backend):
 *   - uncaught errors (window 'error')
 *   - unhandled promise rejections
 *   - failed/non-2xx /api/* fetches  ← surfaces backend 5xx (e.g. SQLITE_IOERR)
 *     as the UI actually experiences them, with NO backend endpoint required
 *   - console.error calls
 *
 * Kept in a bounded ring buffer; the Debug page subscribes for a live stream.
 * Self-installs once (idempotent) — call installUiErrorCapture() as early as
 * possible so errors from app start are captured.
 */

export type UiErrorKind = 'error' | 'rejection' | 'fetch' | 'console';

export interface UiError {
  id: number;
  ts: string; // ISO
  kind: UiErrorKind;
  message: string;
  source?: string; // filename:line, or request URL
  detail?: string; // stack trace, when available
}

const BUFFER_MAX = 500;
const buffer: UiError[] = [];
let nextId = 1;

type Listener = (errors: UiError[]) => void;
const listeners = new Set<Listener>();

function emit() {
  const snapshot = buffer.slice();
  listeners.forEach((l) => {
    try {
      l(snapshot);
    } catch {
      /* a listener throwing must not break the bus */
    }
  });
}

function push(e: Omit<UiError, 'id' | 'ts'>) {
  buffer.push({ id: nextId++, ts: new Date().toISOString(), ...e });
  if (buffer.length > BUFFER_MAX) buffer.splice(0, buffer.length - BUFFER_MAX);
  emit();
}

export function getUiErrors(): UiError[] {
  return buffer.slice();
}

export function subscribeUiErrors(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearUiErrors() {
  buffer.length = 0;
  emit();
}

function stringify(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.message;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

let installed = false;

export function installUiErrorCapture() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (ev: ErrorEvent) => {
    push({
      kind: 'error',
      message: ev.message || 'Uncaught error',
      source: ev.filename ? `${ev.filename}:${ev.lineno ?? 0}:${ev.colno ?? 0}` : undefined,
      detail: ev.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    const reason = ev.reason;
    push({
      kind: 'rejection',
      message: reason?.message ?? stringify(reason),
      detail: reason?.stack,
    });
  });

  // Wrap fetch to capture network failures + non-2xx API responses. The debug
  // endpoints themselves are excluded so their (expected) 404s while the
  // backend catches up don't flood the very stream that reports them.
  const origFetch = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const isApi = url.includes('/api/');
    const isDebugEndpoint = url.includes('/api/debug/');
    try {
      const res = await origFetch(input, init);
      if (!res.ok && isApi && !isDebugEndpoint) {
        push({ kind: 'fetch', message: `HTTP ${res.status} ${res.statusText || ''}`.trim(), source: url });
      }
      return res;
    } catch (err) {
      if (!isDebugEndpoint) {
        push({
          kind: 'fetch',
          message: err instanceof Error ? err.message : 'Network request failed',
          source: url,
          detail: err instanceof Error ? err.stack : undefined,
        });
      }
      throw err;
    }
  }) as typeof window.fetch;

  const origConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      push({ kind: 'console', message: args.map(stringify).join(' ').slice(0, 800) });
    } catch {
      /* never let capture break logging */
    }
    origConsoleError(...args);
  };
}

// Self-install on import as a safety net; App also calls it explicitly on mount.
installUiErrorCapture();
