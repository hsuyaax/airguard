/**
 * AirGuard — Satellite AOD Module
 * Ported from ingestion/satellite.py
 * Sentinel-5P / MODIS synthetic data + correlation
 */

import { DELHI_LAT_MIN, DELHI_LAT_MAX, DELHI_LON_MIN, DELHI_LON_MAX } from "./config";

export interface AODPoint {
  latitude: number;
  longitude: number;
  aod_550nm: number;
  no2_column: number;
  dust_flag: boolean;
  smoke_flag: boolean;
  timestamp: string;
  source: string;
}

export interface AODCorrelation {
  station: string;
  ground_pm25: number;
  satellite_aod: number;
  satellite_estimated_pm25: number;
}

/** Generate synthetic satellite-derived AOD data for Delhi grid */
export function fetchSatelliteAOD(): AODPoint[] {
  const nSide = Math.ceil(Math.sqrt(50));
  const lats = Array.from({ length: nSide }, (_, i) => DELHI_LAT_MIN + (i / (nSide - 1)) * (DELHI_LAT_MAX - DELHI_LAT_MIN));
  const lons = Array.from({ length: nSide }, (_, i) => DELHI_LON_MIN + (i / (nSide - 1)) * (DELHI_LON_MAX - DELHI_LON_MIN));

  const records: AODPoint[] = [];
  let seed = 77;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  for (const lat of lats) {
    for (const lon of lons) {
      const baseAOD = 0.3 + rand() * 1.2;
      const baseNO2 = 5e15 + rand() * 1.5e16;
      records.push({
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lon * 10000) / 10000,
        aod_550nm: Math.round(baseAOD * 1000) / 1000,
        no2_column: Math.round(baseNO2 * 100) / 100,
        dust_flag: baseAOD > 1.0,
        smoke_flag: baseAOD > 0.8 && baseNO2 > 1e16,
        timestamp: new Date().toISOString(),
        source: "synthetic_satellite",
      });
    }
  }
  return records;
}

/**
 * Validate ground PM2.5 against satellite AOD.
 * Published Delhi relationship: PM2.5 = 160 * AOD + 30 (Dey et al., 2012)
 */
export function correlateAODWithPM25(
  aodData: AODPoint[],
  stations: Array<{ name: string; latitude: number; longitude: number; pm25: number | null }>
): AODCorrelation[] {
  if (!aodData.length || !stations.length) return [];

  const results: AODCorrelation[] = [];
  for (const station of stations) {
    if (station.pm25 === null) continue;

    // Find nearest satellite pixel
    let minDist = Infinity;
    let nearestAOD = 0;
    for (const aod of aodData) {
      const dist = Math.sqrt((aod.latitude - station.latitude) ** 2 + (aod.longitude - station.longitude) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearestAOD = aod.aod_550nm;
      }
    }

    results.push({
      station: station.name,
      ground_pm25: station.pm25,
      satellite_aod: nearestAOD,
      satellite_estimated_pm25: Math.round((160 * nearestAOD + 30) * 10) / 10,
    });
  }
  return results;
}

/** Identify potential dust plumes from high AOD (>threshold) */
export function detectDustPlumes(aodData: AODPoint[], threshold = 1.0): AODPoint[] {
  return aodData.filter((p) => p.aod_550nm > threshold);
}

/** Identify potential biomass burning from combined AOD + NO2 signals */
export function detectBiomassHotspots(aodData: AODPoint[]): AODPoint[] {
  return aodData.filter((p) => p.smoke_flag);
}
