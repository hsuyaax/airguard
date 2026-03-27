/**
 * AirGuard — Database Operations (Supabase)
 * All CRUD operations for the 8 tables.
 * Uses service_role client for server-side writes.
 * Uses anon client for client-side reads.
 */

import { supabaseAdmin } from "./supabase";
import type { Station, WeatherData } from "./types";

function db() {
  if (!supabaseAdmin) throw new Error("Supabase not configured");
  return supabaseAdmin;
}

// ── Stations ──

export async function upsertStations(stations: Station[]) {
  const rows = stations.map((s) => ({
    station_id: s.station_id,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
  }));
  const { error } = await db()
    .from("stations")
    .upsert(rows, { onConflict: "station_id" });
  if (error) console.warn("upsertStations:", error.message);
}

export async function getStations(): Promise<Station[]> {
  const { data, error } = await db()
    .from("stations")
    .select("*")
    .order("station_id");
  if (error) { console.warn("getStations:", error.message); return []; }
  return (data || []).map((r) => ({
    station_id: r.station_id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    pm25: null, pm10: null, no2: null, so2: null, co: null, o3: null, aqi: null,
    timestamp: r.created_at || new Date().toISOString(),
    source: "supabase",
  }));
}

// ── Readings ──

export async function saveReadings(stations: Station[]) {
  const rows = stations
    .filter((s) => s.aqi !== null)
    .map((s) => ({
      station_id: s.station_id,
      timestamp: s.timestamp || new Date().toISOString(),
      pm25: s.pm25,
      pm10: s.pm10,
      no2: s.no2,
      so2: s.so2,
      co: s.co,
      o3: s.o3,
      aqi: s.aqi,
      source: s.source,
    }));

  if (rows.length === 0) return;

  const { error } = await db()
    .from("readings")
    .upsert(rows, { onConflict: "station_id,timestamp" });
  if (error) console.warn("saveReadings:", error.message);
}

export async function getLatestReadings(): Promise<Station[]> {
  // Get most recent reading per station
  const { data, error } = await db()
    .from("readings")
    .select("*, stations!inner(name, latitude, longitude)")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // Deduplicate: keep only the latest per station
  const seen = new Set<string>();
  const results: Station[] = [];
  for (const r of data) {
    if (seen.has(r.station_id)) continue;
    seen.add(r.station_id);
    const s = r.stations as { name: string; latitude: number; longitude: number };
    results.push({
      station_id: r.station_id,
      name: s?.name || r.station_id,
      latitude: s?.latitude || 0,
      longitude: s?.longitude || 0,
      pm25: r.pm25, pm10: r.pm10, no2: r.no2,
      so2: r.so2, co: r.co, o3: r.o3, aqi: r.aqi,
      timestamp: r.timestamp,
      source: r.source || "supabase",
    });
  }
  return results;
}

export async function getHistoricalReadings(days = 7) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await db()
    .from("readings")
    .select("*")
    .gte("timestamp", cutoff)
    .order("timestamp", { ascending: true })
    .limit(5000);
  if (error) return [];
  return data || [];
}

// ── Weather ──

export async function saveWeather(weather: WeatherData) {
  const { error } = await db().from("weather").insert({
    temperature: weather.temperature,
    humidity: weather.humidity,
    wind_speed: weather.wind_speed,
    wind_direction: weather.wind_direction,
    pressure: weather.pressure,
    description: weather.description,
    source: weather.source,
  });
  if (error) console.warn("saveWeather:", error.message);
}

// ── Complaints ──

export async function saveComplaint(complaint: {
  user_id?: string;
  ward_name: string;
  ward_no?: number;
  pollution_type: string;
  severity: string;
  description?: string;
}) {
  const { data, error } = await db()
    .from("complaints")
    .insert(complaint)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getComplaints(limit = 50) {
  const { data, error } = await db()
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

export async function updateComplaintStatus(id: number, status: string) {
  const { error } = await db()
    .from("complaints")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Enforcement Notices ──

export async function saveNotice(notice: {
  ward_name: string;
  ward_no?: number;
  aqi_at_issue: number;
  primary_source: string;
  grap_stage: number;
  notice_text: string;
  language?: string;
  mode?: string;
  issued_by?: string;
}) {
  const { data, error } = await db()
    .from("enforcement_notices")
    .insert({
      ...notice,
      compliance_deadline: new Date(Date.now() + 48 * 3600000).toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getNotices(limit = 50) {
  const { data, error } = await db()
    .from("enforcement_notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

export async function updateNoticeStatus(id: number, status: string) {
  const { error } = await db()
    .from("enforcement_notices")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── AQI History (for trends) ──

export async function saveAqiSnapshot(snapshot: {
  avg_aqi: number;
  worst_ward?: string;
  worst_aqi?: number;
  best_ward?: string;
  best_aqi?: number;
  grap_stage?: number;
  ward_count?: number;
  severe_count?: number;
  very_poor_count?: number;
  station_count?: number;
  source?: string;
}) {
  const { error } = await db().from("aqi_history").insert(snapshot);
  if (error) console.warn("saveAqiSnapshot:", error.message);
}

export async function getAqiHistory(hours = 168) {
  const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
  const { data, error } = await db()
    .from("aqi_history")
    .select("*")
    .gte("timestamp", cutoff)
    .order("timestamp", { ascending: true })
    .limit(2000);
  if (error) return [];
  return data || [];
}

// ── Alert Log ──

export async function logAlert(alert: {
  ward_name: string;
  ward_no?: number;
  aqi: number;
  alert_type: string;
  priority?: string;
  message?: string;
}) {
  const { error } = await db().from("alert_log").insert(alert);
  if (error) console.warn("logAlert:", error.message);
}

export async function getRecentAlerts(limit = 50) {
  const { data, error } = await db()
    .from("alert_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}
