import { useState, useEffect, useCallback } from 'react';
import {
  getConfig,
  scanFiles,
  startIndexing,
  stopIndexing,
  subscribeProgress,
  type IndexerConfig,
  type ScannedFile,
  type Progress,
} from '../api/indexer';

export default function Indexer() {
  const [config, setConfig] = useState<IndexerConfig | null>(null);
  const [adapter, setAdapter] = useState('lancedb');
  const [model, setModel] = useState('nomic');
  const [sourcePath, setSourcePath] = useState('');
  const [types, setTypes] = useState<string[]>(['learning', 'retro', 'principle']);
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [fileFilter, setFileFilter] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getConfig().then(c => {
      setConfig(c);
      setAdapter(c.currentAdapter);
    }).catch(() => setError('Cannot connect to backend'));
  }, []);

  const handleScan = useCallback(async () => {
    if (!sourcePath) return;
    setScanning(true);
    setError('');
    try {
      const result = await scanFiles(sourcePath, types.length > 0 ? types : undefined);
      if (result.error) setError(result.error);
      else setFiles(result.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    }
    setScanning(false);
  }, [sourcePath, types]);

  const handleStart = useCallback(async () => {
    setError('');
    try {
      await startIndexing({ model, sourcePath: sourcePath || undefined });
      const unsub = subscribeProgress((p) => {
        setProgress(p);
        if (p.status === 'completed' || p.status === 'error') unsub();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Start failed');
    }
  }, [model, sourcePath]);

  const handleStop = useCallback(async () => {
    await stopIndexing();
  }, []);

  const toggleType = (t: string) => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const filteredFiles = fileFilter
    ? files.filter(f => f.relativePath.toLowerCase().includes(fileFilter.toLowerCase()))
    : files;

  const isIndexing = progress?.status === 'indexing';
  const pct = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-accent mb-6">Indexer Settings</h1>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Config Panel */}
      <section className="bg-bg-card border border-border rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold text-text-dim mb-3 uppercase tracking-wide">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-xs text-text-dim mb-1">Vector DB Adapter</label>
            <select
              value={adapter}
              onChange={e => setAdapter(e.target.value)}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:border-border-focus outline-none"
            >
              {config?.adapters.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-1">Embedding Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:border-border-focus outline-none"
            >
              {config?.models.map(m => (
                <option key={m.key} value={m.key}>{m.model} ({m.dims}d, {m.speed})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-1">Source Path</label>
            <input
              type="text"
              value={sourcePath}
              onChange={e => setSourcePath(e.target.value)}
              placeholder="/path/to/vault/ψ/memory"
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:border-border-focus outline-none"
            />
          </div>
        </div>
        <div className="flex gap-4">
          {['learning', 'retro', 'principle'].map(t => (
            <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={types.includes(t)}
                onChange={() => toggleType(t)}
                className="accent-accent"
              />
              <span className="text-text-dim">{t}</span>
            </label>
          ))}
        </div>
      </section>

      {/* File Browser + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <section className="bg-bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">
              Files {files.length > 0 && <span className="text-accent">({files.length})</span>}
            </h2>
            <input
              type="text"
              value={fileFilter}
              onChange={e => setFileFilter(e.target.value)}
              placeholder="Filter..."
              className="bg-bg border border-border rounded px-2 py-1 text-xs w-32 focus:border-border-focus outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {filteredFiles.length === 0 && !scanning && (
              <p className="text-text-dim text-sm">No files scanned yet. Enter path and click Scan.</p>
            )}
            {scanning && <p className="text-text-dim text-sm animate-pulse">Scanning...</p>}
            {filteredFiles.slice(0, 100).map(f => (
              <div key={f.path} className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-bg-hover">
                <span className="truncate flex-1 text-text">{f.relativePath}</span>
                <span className="text-text-dim ml-2 shrink-0">
                  {f.size > 1024 ? `${(f.size / 1024).toFixed(1)}KB` : `${f.size}B`}
                </span>
              </div>
            ))}
            {filteredFiles.length > 100 && (
              <p className="text-text-dim text-xs mt-1">...and {filteredFiles.length - 100} more</p>
            )}
          </div>
        </section>

        <section className="bg-bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-text-dim mb-3 uppercase tracking-wide">Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-dim">Adapter</span>
              <span className="text-text">{adapter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Model</span>
              <span className="text-text">{config?.models.find(m => m.key === model)?.model || model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Ollama Models</span>
              <span className="text-text">{config?.ollamaModels.length || 0} available</span>
            </div>
            {progress && (
              <>
                <div className="flex justify-between">
                  <span className="text-text-dim">Status</span>
                  <span className={progress.status === 'indexing' ? 'text-warning' : progress.status === 'completed' ? 'text-success' : progress.status === 'error' ? 'text-danger' : 'text-text'}>
                    {progress.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Progress</span>
                  <span className="text-text">{progress.current}/{progress.total}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Action Bar */}
      <section className="bg-bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={!sourcePath || scanning}
            className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            {scanning ? 'Scanning...' : 'Scan'}
          </button>
          <button
            onClick={handleStart}
            disabled={isIndexing}
            className="px-4 py-2 bg-success/10 border border-success/30 text-success rounded hover:bg-success/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            Start Indexing
          </button>
          {isIndexing && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-danger/10 border border-danger/30 text-danger rounded hover:bg-danger/20 text-sm font-medium"
            >
              Stop
            </button>
          )}

          {/* Progress bar */}
          {progress && progress.total > 0 && (
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-text-dim whitespace-nowrap">
                {pct}% &middot; {progress.docsPerSec}/s &middot; ETA {progress.eta}s
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
