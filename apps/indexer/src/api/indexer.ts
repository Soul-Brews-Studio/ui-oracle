import { apiUrl } from './host';

export interface ModelInfo {
  key: string;
  model: string;
  collection: string;
  dims: number;
  speed: string;
}

export interface IndexerConfig {
  adapters: string[];
  models: ModelInfo[];
  ollamaModels: string[];
  currentAdapter: string;
}

export interface ScannedFile {
  path: string;
  relativePath: string;
  size: number;
  type: string;
  modified: number;
}

export interface ScanResult {
  files: ScannedFile[];
  total: number;
  byType: Record<string, number>;
  error?: string;
}

export interface Progress {
  status: 'idle' | 'indexing' | 'completed' | 'error';
  current: number;
  total: number;
  docsPerSec: string;
  eta: number;
  error: string | null;
}

export async function getConfig(): Promise<IndexerConfig> {
  const res = await fetch(apiUrl('/api/indexer/config'));
  return res.json();
}

export async function scanFiles(sourcePath: string, types?: string[]): Promise<ScanResult> {
  const res = await fetch(apiUrl('/api/indexer/scan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePath, types }),
  });
  return res.json();
}

export async function startIndexing(config: { model?: string; sourcePath?: string; batchSize?: number }) {
  const res = await fetch(apiUrl('/api/indexer/start'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export function subscribeProgress(onData: (p: Progress) => void): () => void {
  const es = new EventSource(apiUrl('/api/indexer/progress'));
  es.onmessage = (e) => {
    try { onData(JSON.parse(e.data)); } catch {}
  };
  es.onerror = () => es.close();
  return () => es.close();
}

export async function stopIndexing() {
  const res = await fetch(apiUrl('/api/indexer/stop'), { method: 'POST' });
  return res.json();
}

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/health'), { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}
