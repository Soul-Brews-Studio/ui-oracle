import { apiUrl } from './host';
export { apiUrl, hostLabel, activeHost, isDefault, isRemote } from './host';

export const API_BASE = apiUrl('/api');

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export interface ScheduleEventInput {
  date: string;
  event: string;
  time?: string;
  notes?: string;
}

export async function getScheduleMd(): Promise<string> {
  const res = await fetch(`${API_BASE}/schedule/md`);
  if (!res.ok) throw new Error(`schedule/md ${res.status}`);
  return res.text();
}

export async function addScheduleEvent(body: ScheduleEventInput): Promise<boolean> {
  const res = await fetch(`${API_BASE}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}
