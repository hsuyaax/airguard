/**
 * AirGuard — ML Backend Client
 * Calls the FastAPI ML service at localhost:8000
 * Falls back to TypeScript heuristics if the backend is down
 */

const ML_API_BASE = process.env.ML_API_URL || "http://localhost:8000";

async function mlFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ML_API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`ML API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function mlHealthCheck(): Promise<{ status: string; models: Record<string, boolean> } | null> {
  try {
    return await mlFetch("/");
  } catch {
    return null;
  }
}

export async function mlPredictSources(pm25: number, pm10: number, no2: number, so2: number, co: number) {
  return mlFetch<{
    sources: Record<string, number>;
    primary_source: string;
    primary_pct: number;
    model_used: string;
    top_sources: Array<{ source: string; pct: number }>;
  }>("/ml/sources", {
    method: "POST",
    body: JSON.stringify({ pm25, pm10, no2, so2, co }),
  });
}

export async function mlForecast(pm25: number, hours = 48, stationId?: string, wardName?: string) {
  return mlFetch<{
    forecast: Array<{ timestamp: string; pm25_predicted: number; pm25_lower: number; pm25_upper: number }>;
    model_used: string;
    hours: number;
  }>("/ml/forecast", {
    method: "POST",
    body: JSON.stringify({ pm25, hours, station_id: stationId, ward_name: wardName }),
  });
}

export async function mlInterpolate(targetLats: number[], targetLons: number[], method = "idw") {
  return mlFetch<{
    predicted: number[];
    method: string;
    n_stations: number;
    variance?: number[];
    variogram?: { sill: number; range: number; nugget: number };
  }>("/ml/interpolate", {
    method: "POST",
    body: JSON.stringify({ target_lats: targetLats, target_lons: targetLons, method }),
  });
}

export async function mlComputeWards(method = "idw") {
  return mlFetch<{
    ward_data: Array<Record<string, unknown>>;
    geojson: Record<string, unknown>;
    stations: Array<Record<string, unknown>>;
    source: string;
    n_wards: number;
    method: string;
  }>(`/ml/wards?method=${method}`);
}

export async function mlValidate(method = "idw") {
  return mlFetch<{
    rmse: number | null;
    mae: number | null;
    r2: number | null;
    n_stations: number;
    station_errors?: Array<{ station: string; actual: number; predicted: number; error: number }>;
    method: string;
  }>(`/ml/validate?method=${method}`);
}

export async function mlSimulate(currentPm25: number, sourceBreakdown: Record<string, number>, selectedInterventions: string[]) {
  return mlFetch<Record<string, unknown>>("/ml/simulate", {
    method: "POST",
    body: JSON.stringify({ current_pm25: currentPm25, source_breakdown: sourceBreakdown, selected_interventions: selectedInterventions }),
  });
}

export async function mlEnforcement(
  wardName: string, wardNo: number, aqi: number, pm25: number,
  options?: { pm10?: number; no2?: number; so2?: number; co?: number; language?: string; mode?: string }
) {
  return mlFetch<{
    notice: string;
    sources: Record<string, number>;
    primary_source: string;
    grap_stage: number;
    model_used: string;
  }>("/ml/enforcement", {
    method: "POST",
    body: JSON.stringify({
      ward_name: wardName, ward_no: wardNo, aqi, pm25,
      pm10: options?.pm10 || pm25 * 1.8,
      no2: options?.no2 || 40, so2: options?.so2 || 15, co: options?.co || 1.5,
      language: options?.language || "english",
      mode: options?.mode || "template",
    }),
  });
}

export async function mlAlerts(aqi: number) {
  return mlFetch<{ advisory: Record<string, string>; grap: Record<string, unknown> }>(`/ml/alerts?aqi=${aqi}`);
}

export async function mlModelInfo() {
  return mlFetch<Record<string, unknown>>("/ml/model-info");
}

export async function mlCacheStatus() {
  return mlFetch<{ staleness_minutes: number; n_stations_cached: number }>("/ml/cache-status");
}
