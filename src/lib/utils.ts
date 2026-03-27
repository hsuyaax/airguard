/**
 * AirGuard — Shared Utilities
 * Ported from src/utils.py
 */

import { AQI_BREAKPOINTS_PM25 } from "./config";

// ── AQI Reverse Conversion ──

export function aqiToPm25(aqi: number | null): number | null {
  if (aqi === null) return null;
  for (const bp of AQI_BREAKPOINTS_PM25) {
    if (aqi >= bp.iLo && aqi <= bp.iHi) {
      return Math.round(((aqi - bp.iLo) / (bp.iHi - bp.iLo)) * (bp.cHi - bp.cLo) + bp.cLo * 10) / 10;
    }
  }
  return 500.0;
}

// ── Distance Utilities ──

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function findNearestStations(
  lat: number,
  lon: number,
  stations: Array<{ latitude: number; longitude: number; [key: string]: unknown }>,
  n = 3
): typeof stations {
  return [...stations]
    .map((s) => ({ ...s, _dist: haversineKm(lat, lon, s.latitude, s.longitude) }))
    .sort((a, b) => a._dist - b._dist)
    .slice(0, n);
}

// ── Time Utilities ──

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // +5:30 in ms

export function istNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET + now.getTimezoneOffset() * 60000);
}

export function formatTimestamp(ts: string | Date, fmt?: string): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  if (fmt) return d.toLocaleString("en-IN");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(ts: string | Date): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const minutes = (Date.now() - d.getTime()) / 60000;
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.floor(minutes)} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

// ── Data Validation ──

export function validateStationData(stations: Array<{ latitude?: number; longitude?: number }>): boolean {
  if (!stations.length) throw new Error("Empty station array");
  const hasCoords = stations.some((s) => s.latitude != null && s.longitude != null);
  if (!hasCoords) throw new Error("All coordinates are missing");
  return true;
}

export function validateWardGeojson(geojson: { features?: unknown[] }, expected = 250): number {
  const n = geojson.features?.length || 0;
  if (n === 0) throw new Error("GeoJSON has no features");
  if (n < 200 || n > 300) console.warn(`Expected ~${expected} wards, got ${n}`);
  return n;
}

// ── Multilingual Labels ──

export const LABELS_EN: Record<string, string> = {
  aqi: "Air Quality Index", pm25: "PM2.5", pm10: "PM10",
  good: "Good", satisfactory: "Satisfactory", moderate: "Moderate",
  poor: "Poor", very_poor: "Very Poor", severe: "Severe",
  ward: "Ward", forecast: "48-Hour Forecast", sources: "Pollution Sources", health: "Health Advisory",
};

export const LABELS_HI: Record<string, string> = {
  aqi: "\u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0938\u0942\u091a\u0915\u093e\u0902\u0915", pm25: "PM2.5", pm10: "PM10",
  good: "\u0905\u091a\u094d\u091b\u093e", satisfactory: "\u0938\u0902\u0924\u094b\u0937\u091c\u0928\u0915", moderate: "\u092e\u0927\u094d\u092f\u092e",
  poor: "\u0916\u0930\u093e\u092c", very_poor: "\u092c\u0939\u0941\u0924 \u0916\u0930\u093e\u092c", severe: "\u0917\u0902\u092d\u0940\u0930",
  ward: "\u0935\u093e\u0930\u094d\u0921", forecast: "48 \u0918\u0902\u091f\u0947 \u0915\u093e \u092a\u0942\u0930\u094d\u0935\u093e\u0928\u0941\u092e\u093e\u0928",
  sources: "\u092a\u094d\u0930\u0926\u0942\u0937\u0923 \u0938\u094d\u0930\u094b\u0924", health: "\u0938\u094d\u0935\u093e\u0938\u094d\u0925\u094d\u092f \u0938\u0932\u093e\u0939",
};

export function getLabel(key: string, lang: "en" | "hi" = "en"): string {
  if (lang === "hi") return LABELS_HI[key] || LABELS_EN[key] || key;
  return LABELS_EN[key] || key;
}
