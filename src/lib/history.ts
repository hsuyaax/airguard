/**
 * AirGuard — Historical Data Accumulator
 * Stores AQI snapshots in localStorage for trend analysis.
 * Every time ward data is loaded, a snapshot is saved.
 * This accumulates real history as the app is used.
 */

export interface AQISnapshot {
  timestamp: string;
  avgAqi: number;
  worstWard: string;
  worstAqi: number;
  bestWard: string;
  bestAqi: number;
  grapStage: number;
  wardCount: number;
  severeCount: number;
  veryPoorCount: number;
  wardAqiMap: Record<string, number>;
}

const STORAGE_KEY = "airguard_history";
const MAX_SNAPSHOTS = 2000; // ~14 days at 5-min intervals

export function saveSnapshot(snapshot: AQISnapshot): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getHistory();
    // Don't save duplicate timestamps (within 2 minutes)
    const lastTs = existing.length > 0 ? new Date(existing[existing.length - 1].timestamp).getTime() : 0;
    const newTs = new Date(snapshot.timestamp).getTime();
    if (newTs - lastTs < 120000) return; // skip if <2 min since last

    existing.push(snapshot);
    if (existing.length > MAX_SNAPSHOTS) existing.splice(0, existing.length - MAX_SNAPSHOTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch { /* localStorage full or unavailable */ }
}

export function getHistory(): AQISnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getWardTrend(wardName: string, hours = 24): Array<{ timestamp: string; aqi: number }> {
  const history = getHistory();
  const cutoff = Date.now() - hours * 3600000;
  return history
    .filter((s) => new Date(s.timestamp).getTime() > cutoff && s.wardAqiMap[wardName] != null)
    .map((s) => ({ timestamp: s.timestamp, aqi: s.wardAqiMap[wardName] }));
}

export function getCityTrend(hours = 168): Array<{ timestamp: string; avgAqi: number; severeCount: number }> {
  const history = getHistory();
  const cutoff = Date.now() - hours * 3600000;
  return history
    .filter((s) => new Date(s.timestamp).getTime() > cutoff)
    .map((s) => ({ timestamp: s.timestamp, avgAqi: s.avgAqi, severeCount: s.severeCount }));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
