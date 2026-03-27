/**
 * AirGuard — Real Data Loader
 * Loads real delhi_stations.csv and delhi_wards_2022.geojson from public/data
 * Falls back to synthetic demo data if files unavailable
 */

import { promises as fs } from "fs";
import path from "path";
import type { Station, WardData, WardGeoJSON } from "./types";
import { pm25ToAqi } from "./aqi";

const DATA_DIR = path.join(process.cwd(), "public", "data");

// ── Load real 39 CPCB stations from CSV ──
export async function loadRealStations(): Promise<Station[]> {
  const csvPath = path.join(DATA_DIR, "stations", "delhi_stations.csv");
  const csv = await fs.readFile(csvPath, "utf-8");
  const lines = csv.trim().split("\n").slice(1); // skip header

  // Seeded randomizer for deterministic demo pollutant values
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const uniform = (lo: number, hi: number) => lo + rand() * (hi - lo);

  return lines.map((line) => {
    const [station_id, name, lat, lon] = line.split(",");
    return {
      station_id,
      name: name.trim(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      pm25: Math.round(uniform(40, 300) * 10) / 10,
      pm10: Math.round(uniform(80, 450) * 10) / 10,
      no2: Math.round(uniform(15, 120) * 10) / 10,
      so2: Math.round(uniform(5, 60) * 10) / 10,
      co: Math.round(uniform(0.5, 4.0) * 100) / 100,
      o3: Math.round(uniform(10, 80) * 10) / 10,
      aqi: Math.round(uniform(50, 400)),
      timestamp: new Date().toISOString(),
      source: "demo",
    };
  });
}

// ── IDW interpolation (pure math) ──
function idwInterpolate(
  sLats: number[], sLons: number[], sValues: number[],
  tLat: number, tLon: number, power = 2
): number {
  let weightSum = 0, valueSum = 0;
  for (let i = 0; i < sLats.length; i++) {
    if (isNaN(sValues[i])) continue;
    const dist = Math.sqrt((sLats[i] - tLat) ** 2 + (sLons[i] - tLon) ** 2);
    if (dist < 1e-10) return sValues[i];
    const w = 1.0 / dist ** power;
    weightSum += w;
    valueSum += w * sValues[i];
  }
  return weightSum > 0 ? valueSum / weightSum : 0;
}

// ── Load real GeoJSON and compute ward AQI via IDW ──
export async function loadRealWards(stations: Station[]): Promise<{ wardData: WardData[]; geoJSON: WardGeoJSON }> {
  const geoPath = path.join(DATA_DIR, "geojson", "delhi_wards_2022.geojson");
  const raw = await fs.readFile(geoPath, "utf-8");
  const geojson = JSON.parse(raw);

  const sLats = stations.map((s) => s.latitude);
  const sLons = stations.map((s) => s.longitude);
  const sVals = stations.map((s) => s.pm25 ?? 100);

  const wardData: WardData[] = [];

  for (let i = 0; i < geojson.features.length; i++) {
    const feature = geojson.features[i];
    const props = feature.properties || {};

    // Extract ward name from GeoJSON properties (flexible key matching)
    const wardName = props.Ward_Name || props.ward_name || props.NAME || props.name || `Ward ${i + 1}`;
    const wardNo = props.Ward_No || props.ward_no || props.WARD_NO || i + 1;

    // Compute centroid from polygon coordinates
    let centLat = 0, centLon = 0, nPts = 0;
    const coords = feature.geometry?.coordinates;
    if (coords) {
      const ring = coords[0] || coords;
      const flatRing = Array.isArray(ring[0]?.[0]) ? ring[0] : ring;
      for (const pt of flatRing) {
        if (Array.isArray(pt) && pt.length >= 2) {
          centLon += pt[0];
          centLat += pt[1];
          nPts++;
        }
      }
    }
    if (nPts > 0) { centLat /= nPts; centLon /= nPts; }

    // IDW interpolate PM2.5 at centroid
    const pm25 = idwInterpolate(sLats, sLons, sVals, centLat, centLon);
    const { aqi, category, color } = pm25ToAqi(pm25);

    wardData.push({
      ward_name: wardName,
      ward_no: typeof wardNo === "number" ? wardNo : parseInt(wardNo) || i + 1,
      centroid_lat: centLat,
      centroid_lon: centLon,
      pm25: Math.round(pm25 * 10) / 10,
      aqi: aqi ?? 0,
      category,
      color,
    });

    // Enrich GeoJSON feature with AQI properties
    feature.properties = {
      ...feature.properties,
      ward_name_display: wardName,
      aqi: aqi ?? 0,
      pm25: Math.round(pm25 * 10) / 10,
      category,
      color,
    };
  }

  return { wardData, geoJSON: geojson as WardGeoJSON };
}
