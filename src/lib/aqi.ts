import { AQI_BREAKPOINTS_PM25, AQI_CATEGORIES } from "./config";

export function pm25ToAqi(pm25: number | null): { aqi: number | null; category: string; color: string } {
  if (pm25 === null || isNaN(pm25)) return { aqi: null, category: "Unknown", color: "#999999" };
  pm25 = Math.max(0, pm25);
  for (const bp of AQI_BREAKPOINTS_PM25) {
    if (pm25 >= bp.cLo && pm25 <= bp.cHi) {
      const aqi = ((bp.iHi - bp.iLo) / (bp.cHi - bp.cLo)) * (pm25 - bp.cLo) + bp.iLo;
      return { aqi: Math.round(aqi), category: bp.category, color: bp.color };
    }
  }
  return { aqi: 500, category: "Severe", color: "#7e0023" };
}

export function aqiColor(aqi: number | null): string {
  if (aqi === null) return "#999999";
  for (const cat of AQI_CATEGORIES) {
    if (aqi >= cat.lo && aqi <= cat.hi) return cat.color;
  }
  return "#7e0023";
}

export function aqiCategory(aqi: number | null): string {
  if (aqi === null) return "Unknown";
  for (const cat of AQI_CATEGORIES) {
    if (aqi >= cat.lo && aqi <= cat.hi) return cat.category;
  }
  return "Severe";
}

export function healthAdvisory(aqi: number | null): string {
  if (aqi === null) return "No data available.";
  for (const cat of AQI_CATEGORIES) {
    if (aqi >= cat.lo && aqi <= cat.hi) return cat.advisory;
  }
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1].advisory;
}

export function getGrapStage(aqi: number | null): { stage: number; label: string } {
  if (aqi === null || aqi <= 200) return { stage: 0, label: "Normal" };
  if (aqi <= 300) return { stage: 1, label: "Stage I - Poor" };
  if (aqi <= 400) return { stage: 2, label: "Stage II - Very Poor" };
  if (aqi <= 450) return { stage: 3, label: "Stage III - Severe" };
  return { stage: 4, label: "Stage IV - Severe+" };
}

export function formatSourceName(source: string): string {
  return source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const GRAP_STAGE_COLORS: Record<number, string> = {
  0: "#009966", 1: "#ffde33", 2: "#ff9933", 3: "#cc0033", 4: "#7e0023",
};
