import { NextResponse } from "next/server";
import { fetchSatelliteAOD, correlateAODWithPM25, detectDustPlumes, detectBiomassHotspots } from "@/lib/satellite";
import { loadRealStations } from "@/lib/data-loader";
import { generateDemoStations } from "@/lib/demo-data";

export async function GET() {
  try {
    const aodData = fetchSatelliteAOD();

    let stations;
    try {
      stations = await loadRealStations();
    } catch {
      stations = generateDemoStations();
    }

    const correlation = correlateAODWithPM25(aodData, stations);
    const dustPlumes = detectDustPlumes(aodData);
    const biomassHotspots = detectBiomassHotspots(aodData);

    return NextResponse.json({
      aod: aodData,
      correlation,
      dustPlumes: dustPlumes.length,
      biomassHotspots: biomassHotspots.length,
      meanAOD: Math.round(aodData.reduce((s, p) => s + p.aod_550nm, 0) / aodData.length * 1000) / 1000,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch satellite data" }, { status: 500 });
  }
}
