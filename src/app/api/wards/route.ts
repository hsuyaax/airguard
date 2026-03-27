import { NextResponse } from "next/server";
import { mlComputeWards } from "@/lib/ml-client";
import { getCurrentData } from "@/lib/ingestion";
import { loadRealStations, loadRealWards } from "@/lib/data-loader";
import { generateDemoStations, generateDemoWards } from "@/lib/demo-data";
import { upsertStations, saveReadings, saveAqiSnapshot } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const method = searchParams.get("method") || "idw";

  // Tier 1: ML Backend
  try {
    const result = await mlComputeWards(method);
    return NextResponse.json({ ...result, backend: "ml-api" });
  } catch { /* fall through */ }

  // Tier 2: Live WAQI + real GeoJSON
  let stations;
  let source = "demo (synthetic)";

  try {
    const result = await getCurrentData();
    stations = result.stations;
    source = result.source;
    upsertStations(stations).catch(() => {});
    saveReadings(stations).catch(() => {});
  } catch {
    try {
      stations = await loadRealStations();
      source = "csv fallback";
    } catch {
      stations = generateDemoStations();
    }
  }

  try {
    const { wardData, geoJSON } = await loadRealWards(stations);

    // Save snapshot to Supabase for trends
    if (wardData.length > 0) {
      const sorted = [...wardData].sort((a, b) => b.aqi - a.aqi);
      const best = [...wardData].sort((a, b) => a.aqi - b.aqi)[0];
      saveAqiSnapshot({
        avg_aqi: Math.round(wardData.reduce((s, w) => s + w.aqi, 0) / wardData.length),
        worst_ward: sorted[0]?.ward_name, worst_aqi: sorted[0]?.aqi,
        best_ward: best?.ward_name, best_aqi: best?.aqi,
        ward_count: wardData.length,
        severe_count: wardData.filter((w) => w.aqi > 400).length,
        very_poor_count: wardData.filter((w) => w.aqi > 300 && w.aqi <= 400).length,
        station_count: stations.length, source,
      }).catch(() => {});
    }

    return NextResponse.json({ wardData, geoJSON, stations, source, backend: "fallback" });
  } catch {
    const { wardData, geoJSON } = generateDemoWards(stations);
    return NextResponse.json({ wardData, geoJSON, stations, source, backend: "fallback" });
  }
}
