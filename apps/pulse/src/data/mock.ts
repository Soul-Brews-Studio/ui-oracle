// Bundled mock — matches the real Pulse service inventory (daily-healthcheck.sh,
// service-guardian.sh). Used as dev fallback when no live status URL is set.

import type { PulseStatus } from '../api/pulse';

const now = new Date();
const today = now.toISOString().slice(0, 10);

function daysAgo(n: number): string {
  const d = new Date(now.getTime() - n * 86400_000);
  return d.toISOString().slice(0, 10);
}

export const mockStatus: PulseStatus = {
  generatedAt: now.toISOString(),
  server: 'srv1439136.local (76.13.221.42)',
  services: [
    { id: 'erp-ui', name: 'ERP UI', url: 'http://76.13.221.42:8890/', state: 'up', latencyMs: 142, expected: '200', actual: '200' },
    { id: 'tconsiam-api', name: 'TCONSIAM API', url: 'http://localhost:3457/api/auth/login', state: 'up', latencyMs: 38, expected: '401', actual: '401', note: '401 = auth alive' },
    { id: 'kb-hub', name: 'KB Hub', url: 'http://76.13.221.42/maw/tconsiam/', state: 'up', latencyMs: 89, expected: '200', actual: '200' },
    { id: 'kb-erp-modules', name: 'KB ERP Modules', url: 'http://76.13.221.42/maw/tconsiam/guides/erp-modules.html', state: 'up', latencyMs: 76, expected: '200', actual: '200' },
    { id: 'maw-api', name: 'MAW API (direct)', url: 'http://localhost:3456/api/pin-info', state: 'up', latencyMs: 21, expected: '200', actual: '200' },
    { id: 'maw-api-nginx', name: 'MAW API (nginx)', url: 'http://76.13.221.42/api/pin-info', state: 'up', latencyMs: 45, expected: '200', actual: '200' },
    { id: 'maw-dashboard', name: 'MAW Dashboard', url: 'http://76.13.221.42/maw/', state: 'up', latencyMs: 62, expected: '200', actual: '200' },
    { id: 'docker-nginx-proxy', name: 'Docker: nginx-proxy', state: 'up', note: 'container running' },
    { id: 'docker-maw-dashboard', name: 'Docker: maw-dashboard', state: 'up', note: 'container running' },
  ],
  recentAlerts: [
    { ts: `${today}T08:00:04Z`, severity: 'info', service: 'daily-healthcheck', message: 'All 9 services passing — ✅✅✅✅✅✅✅✅✅' },
    { ts: `${daysAgo(1)}T19:42:11Z`, severity: 'warn', service: 'pm2-persistence', message: 'PM2 degraded — 3/4 online (tconhr-api stopped, not errored)' },
    { ts: `${daysAgo(1)}T19:47:03Z`, severity: 'info', service: 'pm2-persistence', message: '✅ Recovery: all 4 PM2 apps online' },
    { ts: `${daysAgo(3)}T14:15:52Z`, severity: 'error', service: 'erp-ui', message: 'ERP UI unreachable — HTTPS cert expired; rotated + restored' },
  ],
  uptime7d: [
    { date: daysAgo(6), passed: 9, failed: 0 },
    { date: daysAgo(5), passed: 9, failed: 0 },
    { date: daysAgo(4), passed: 9, failed: 0 },
    { date: daysAgo(3), passed: 8, failed: 1 },
    { date: daysAgo(2), passed: 9, failed: 0 },
    { date: daysAgo(1), passed: 9, failed: 0 },
    { date: today, passed: 9, failed: 0 },
  ],
  meta: {
    source: 'mock',
    version: '0.1.0-prototype',
  },
};
