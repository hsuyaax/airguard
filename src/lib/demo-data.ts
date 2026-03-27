import { Station, WardData, WardGeoJSON, WeatherData, ForecastPoint, SourceBreakdown } from "./types";
import { pm25ToAqi } from "./aqi";

// Seeded random for deterministic demo data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);
function uniform(lo: number, hi: number) { return lo + rand() * (hi - lo); }

const STATION_NAMES = [
  "Anand Vihar", "RK Puram", "Punjabi Bagh", "DTU", "Mandir Marg",
  "ITO", "Lodhi Road", "Dwarka Sec-8", "Mundka", "Bawana",
  "Rohini", "Sonia Vihar", "Jahangirpuri", "Wazirpur", "Okhla Phase-2",
  "Patparganj", "Siri Fort", "Shadipur", "Nehru Nagar", "Vivek Vihar",
  "IGI Airport T3", "North Campus DU", "Narela", "Aya Nagar", "Pusa DPCC",
  "Ashok Vihar", "Burari Crossing", "CRRI Mathura Road", "East Arjun Nagar",
  "IHBAS Dilshad Garden", "JLN Stadium", "Karni Singh Shooting Range",
  "Loni", "Major Dhyan Chand Stadium", "NSIT Dwarka", "Najafgarh",
  "New Moti Bagh", "Alipur", "Dr. Karni Singh SSR",
];

export function generateDemoStations(): Station[] {
  const r = seededRandom(42);
  const u = (lo: number, hi: number) => lo + r() * (hi - lo);

  const baseLats = Array.from({ length: STATION_NAMES.length }, (_, i) =>
    28.50 + (i / (STATION_NAMES.length - 1)) * 0.32
  );
  const baseLons = Array.from({ length: STATION_NAMES.length }, (_, i) =>
    76.95 + (i / (STATION_NAMES.length - 1)) * 0.35
  );

  // Shuffle
  for (let i = baseLats.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [baseLats[i], baseLats[j]] = [baseLats[j], baseLats[i]];
    [baseLons[i], baseLons[j]] = [baseLons[j], baseLons[i]];
  }

  return STATION_NAMES.map((name, i) => ({
    station_id: `DLCPCB${String(i).padStart(3, "0")}`,
    name,
    latitude: baseLats[i] + u(-0.02, 0.02),
    longitude: baseLons[i] + u(-0.02, 0.02),
    pm25: Math.round(u(40, 300) * 10) / 10,
    pm10: Math.round(u(80, 450) * 10) / 10,
    no2: Math.round(u(15, 120) * 10) / 10,
    so2: Math.round(u(5, 60) * 10) / 10,
    co: Math.round(u(0.5, 4.0) * 100) / 100,
    o3: Math.round(u(10, 80) * 10) / 10,
    aqi: Math.round(u(50, 400)),
    timestamp: new Date().toISOString(),
    source: "demo",
  }));
}

function idwInterpolate(
  sLats: number[], sLons: number[], sValues: number[],
  tLat: number, tLon: number, power = 2
): number {
  let weightSum = 0;
  let valueSum = 0;
  for (let i = 0; i < sLats.length; i++) {
    if (isNaN(sValues[i])) continue;
    const dist = Math.sqrt((sLats[i] - tLat) ** 2 + (sLons[i] - tLon) ** 2);
    if (dist < 1e-10) return sValues[i];
    const w = 1.0 / (dist ** power);
    weightSum += w;
    valueSum += w * sValues[i];
  }
  return weightSum > 0 ? valueSum / weightSum : 0;
}

export function generateDemoWards(stations: Station[]): { wardData: WardData[]; geoJSON: WardGeoJSON } {
  const r2 = seededRandom(42);
  const nWards = 250;
  const wardLats = Array.from({ length: nWards }, () => 28.45 + r2() * 0.4);
  const wardLons = Array.from({ length: nWards }, () => 76.88 + r2() * 0.45);

  const sLats = stations.map((s) => s.latitude);
  const sLons = stations.map((s) => s.longitude);
  const sVals = stations.map((s) => s.pm25 ?? 100);

  const wardData: WardData[] = [];
  const features: WardGeoJSON["features"] = [];

  for (let i = 0; i < nWards; i++) {
    const pm25 = idwInterpolate(sLats, sLons, sVals, wardLats[i], wardLons[i]);
    const { aqi, category, color } = pm25ToAqi(pm25);

    wardData.push({
      ward_name: `Ward ${i + 1}`,
      ward_no: i + 1,
      centroid_lat: wardLats[i],
      centroid_lon: wardLons[i],
      pm25: Math.round(pm25 * 10) / 10,
      aqi: aqi ?? 0,
      category,
      color,
    });

    const d = 0.008;
    const lat = wardLats[i];
    const lon = wardLons[i];
    features.push({
      type: "Feature",
      properties: {
        ward_name_display: `Ward ${i + 1}`,
        aqi: aqi ?? 0,
        pm25: Math.round(pm25 * 10) / 10,
        category,
        color,
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [lon - d, lat - d], [lon + d, lat - d],
          [lon + d, lat + d], [lon - d, lat + d],
          [lon - d, lat - d],
        ]],
      },
    });
  }

  return { wardData, geoJSON: { type: "FeatureCollection", features } };
}

export function generateDemoWeather(): WeatherData {
  const month = new Date().getMonth() + 1;
  let temp: number, humidity: number, wind: number, desc: string;
  if ([12, 1, 2].includes(month)) { temp = 12; humidity = 75; wind = 3; desc = "haze"; }
  else if ([3, 4, 5].includes(month)) { temp = 38; humidity = 30; wind = 8; desc = "clear"; }
  else if ([6, 7, 8, 9].includes(month)) { temp = 32; humidity = 80; wind = 5; desc = "partly cloudy"; }
  else { temp = 25; humidity = 55; wind = 4; desc = "haze"; }

  return {
    temperature: Math.round((temp + uniform(-3, 3)) * 10) / 10,
    humidity: Math.round(humidity + uniform(-10, 10)),
    wind_speed: Math.round((wind + uniform(-1, 1)) * 10) / 10,
    wind_direction: Math.round(uniform(0, 360)),
    description: desc,
    source: "default",
    pressure: 1013,
    visibility: [11, 12, 1].includes(month) ? 4000 : 8000,
  };
}

export function generateDemoForecast(basePm25: number, hours = 48): ForecastPoint[] {
  const r3 = seededRandom(123);
  const now = Date.now();
  const points: ForecastPoint[] = [];

  for (let h = 1; h <= hours; h++) {
    const trend = basePm25 + (r3() - 0.5) * 20 + Math.sin(h / 6) * 15;
    const predicted = Math.max(10, Math.min(500, trend));
    const uncertainty = 15 + h * 0.8;
    points.push({
      timestamp: new Date(now + h * 3600000).toISOString(),
      pm25_predicted: Math.round(predicted * 10) / 10,
      pm25_lower: Math.round(Math.max(0, predicted - uncertainty) * 10) / 10,
      pm25_upper: Math.round(Math.min(500, predicted + uncertainty) * 10) / 10,
    });
  }
  return points;
}

export function estimateSources(pm25: number, pm10: number, no2: number, so2: number, co: number): SourceBreakdown {
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;

  pm25 = pm25 || 50;
  pm10 = pm10 || 100;
  no2 = no2 || 30;
  so2 = so2 || 10;
  co = co || 1.0;

  const pmRatio = pm10 / Math.max(pm25, 1);
  const fineFraction = pm25 / Math.max(pm10, 1);
  const isWinter = [10, 11, 12, 1, 2].includes(month);
  const isSummer = [4, 5, 6].includes(month);
  const isRushHour = [7, 8, 9, 10, 17, 18, 19, 20].includes(hour);
  const isEvening = [18, 19, 20, 21, 22, 23].includes(hour);
  const isDaytime = hour >= 8 && hour < 20;

  const scores: Record<string, number> = {
    road_dust: 0.30 * Math.min(pmRatio / 3.0, 1.0) + 0.20 * (isDaytime ? 1 : 0) + 0.15 * (isSummer ? 1 : 0) + 0.10 * (no2 > 60 ? 1 : 0),
    construction_dust: 0.35 * Math.min(pmRatio / 3.5, 1.0) + 0.25 * (hour >= 9 && hour <= 17 ? 1 : 0) + 0.10 * (isSummer ? 1 : 0),
    biomass_burning: 0.30 * Math.min(fineFraction / 0.8, 1.0) + 0.25 * (isWinter ? 1 : 0) + 0.20 * (isEvening ? 1 : 0) + 0.15 * Math.min(co / 3.0, 1.0),
    vehicular_traffic: 0.35 * Math.min(no2 / 100, 1.0) + 0.25 * (isRushHour ? 1 : 0) + 0.20 * Math.min(co / 3.0, 1.0) + 0.10 * Math.min(fineFraction / 0.7, 1.0),
    industrial: 0.40 * Math.min(so2 / 50, 1.0) + 0.20 * (isDaytime ? 1 : 0) + 0.15 * Math.min(no2 / 80, 1.0),
    secondary_aerosols: 0.35 * Math.min(fineFraction / 0.8, 1.0) + 0.25 * (pm25 > 100 ? 1 : 0) + 0.15 * (isWinter ? 1 : 0),
    waste_burning: 0.25 * Math.min(co / 4.0, 1.0) + 0.25 * (isEvening ? 1 : 0) + 0.20 * Math.min(fineFraction / 0.7, 1.0) + 0.10 * (isWinter ? 1 : 0),
    diesel_generators: 0.30 * Math.min(no2 / 80, 1.0) + 0.25 * Math.min(so2 / 30, 1.0) + 0.20 * (hour >= 10 && hour <= 16 ? 1 : 0) + 0.15 * Math.min(co / 2.5, 1.0),
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) {
    const n = Object.keys(scores).length;
    return Object.fromEntries(Object.keys(scores).map((k) => [k, Math.round(1000 / n) / 10]));
  }
  return Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.round((v / total) * 1000) / 10]));
}

export function getWindRoseData(): Record<string, number> {
  return { N: 8, NE: 5, E: 7, SE: 10, S: 12, SW: 15, W: 18, NW: 25 };
}

export const SAFAR_SOURCES: Record<string, number> = {
  Vehicles: 28, Industry: 22, Dust: 18, "Biomass Burning": 15, Domestic: 10, Others: 7,
};
