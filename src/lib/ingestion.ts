/**
 * AirGuard — Data Ingestion Layer
 * Primary: WAQI (28 live Delhi CPCB stations)
 * Weather: OpenWeatherMap
 * Fallback: Real station CSV with demo values → Synthetic demo
 */

import { WAQI_API_TOKEN, OWM_API_KEY, DELHI_CENTER } from "./config";
import type { Station, WeatherData } from "./types";

const WAQI_BASE_URL = "https://api.waqi.info";
const OWM_URL = "https://api.openweathermap.org/data/2.5/weather";

// ── 28 verified live Delhi WAQI feeds (tested 2026-03-28) ──
const DELHI_WAQI_FEEDS = [
  "delhi/anand-vihar",
  "delhi/aya-nagar",
  "delhi/alipur",
  "delhi/burari-crossing",
  "delhi/dtu",
  "delhi/dwarka",
  "delhi/igi-airport",
  "delhi/ihbas",
  "delhi/iti-jahangirpuri",
  "delhi/iti-shahdra--jhilmil-industrial-area",
  "delhi/ito",
  "delhi/jawaharlal-nehru-stadium",
  "delhi/lodhi-road",
  "delhi/major-dhyan-chand-national-stadium",
  "delhi/mandir-marg",
  "delhi/mother-dairy-plant--parparganj",
  "delhi/mundka",
  "delhi/narela",
  "delhi/north-campus",
  "delhi/pgdav-college--sriniwaspuri",
  "delhi/punjabi-bagh",
  "delhi/pusa",
  "delhi/r.k.-puram",
  "delhi/satyawati-college",
  "delhi/shadipur",
  "delhi/siri-fort",
  "delhi/sonia-vihar-water-treatment-plant-djb",
  "delhi/delhi-institute-of-tool-engineering--wazirpur",
];

// ── WAQI station fetcher ──
async function fetchWaqiStation(feed: string): Promise<Station | null> {
  if (!WAQI_API_TOKEN || WAQI_API_TOKEN === "YOUR_TOKEN_HERE") return null;

  try {
    const res = await fetch(`${WAQI_BASE_URL}/feed/${feed}/?token=${WAQI_API_TOKEN}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "ok") return null;

    const d = data.data;
    const iaqi = d.iaqi || {};
    const geo = d.city?.geo || [0, 0];

    return {
      station_id: feed.replace("/", "_"),
      name: d.city?.name || feed,
      latitude: geo[0],
      longitude: geo[1],
      pm25: iaqi.pm25?.v ?? null,
      pm10: iaqi.pm10?.v ?? null,
      no2: iaqi.no2?.v ?? null,
      so2: iaqi.so2?.v ?? null,
      co: iaqi.co?.v ?? null,
      o3: iaqi.o3?.v ?? null,
      aqi: d.aqi ?? null,
      timestamp: d.time?.iso || new Date().toISOString(),
      source: "waqi_live",
    };
  } catch {
    return null;
  }
}

export async function fetchWAQI(): Promise<{ stations: Station[]; source: string }> {
  const results = await Promise.allSettled(
    DELHI_WAQI_FEEDS.map((feed) => fetchWaqiStation(feed))
  );

  const stations = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((s): s is Station => s !== null && s.aqi !== null);

  if (!stations.length) throw new Error("No data from WAQI API");
  return { stations, source: `live (WAQI, ${stations.length} stations)` };
}

// ── Weather: OpenWeatherMap ──
export async function fetchWeatherOWM(): Promise<WeatherData> {
  if (!OWM_API_KEY) throw new Error("No OWM API key");

  const params = new URLSearchParams({
    lat: String(DELHI_CENTER[0]),
    lon: String(DELHI_CENTER[1]),
    appid: OWM_API_KEY,
    units: "metric",
  });

  const res = await fetch(`${OWM_URL}?${params}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`OWM HTTP ${res.status}`);
  const data = await res.json();

  return {
    temperature: data.main?.temp,
    humidity: data.main?.humidity,
    wind_speed: data.wind?.speed,
    wind_direction: data.wind?.deg || 0,
    description: data.weather?.[0]?.description || "",
    source: "openweathermap",
    pressure: data.main?.pressure,
    visibility: data.visibility,
  };
}

// ── Default Delhi weather (seasonal fallback) ──
export function defaultWeather(): WeatherData {
  const month = new Date().getMonth() + 1;
  let temp: number, humidity: number, wind: number, desc: string;
  if ([12, 1, 2].includes(month)) { temp = 12; humidity = 75; wind = 3; desc = "haze"; }
  else if ([3, 4, 5].includes(month)) { temp = 38; humidity = 30; wind = 8; desc = "clear"; }
  else if ([6, 7, 8, 9].includes(month)) { temp = 32; humidity = 80; wind = 5; desc = "partly cloudy"; }
  else { temp = 25; humidity = 55; wind = 4; desc = "haze"; }

  const jitter = (v: number, r: number) => Math.round((v + (Math.random() * 2 - 1) * r) * 10) / 10;
  return {
    temperature: jitter(temp, 3), humidity: Math.round(humidity + (Math.random() * 20 - 10)),
    wind_speed: jitter(wind, 1), wind_direction: Math.round(Math.random() * 360),
    description: desc, source: "default", pressure: 1013,
    visibility: [11, 12, 1].includes(month) ? 4000 : 8000,
  };
}

// ── Primary data orchestrator: WAQI → Real CSV → Demo ──
export async function getCurrentData(): Promise<{ stations: Station[]; source: string }> {
  try {
    const result = await fetchWAQI();
    if (result.stations.length > 0) return result;
  } catch (e) {
    console.warn("WAQI failed:", (e as Error).message);
  }

  throw new Error("Live WAQI source failed — falling back to cached data");
}

export async function getWeather(): Promise<WeatherData> {
  try {
    return await fetchWeatherOWM();
  } catch {
    return defaultWeather();
  }
}
