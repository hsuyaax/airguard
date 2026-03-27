import { NextResponse } from "next/server";
import { getCurrentData } from "@/lib/ingestion";
import { loadRealStations } from "@/lib/data-loader";
import { generateDemoStations } from "@/lib/demo-data";
import { upsertStations, saveReadings, getLatestReadings } from "@/lib/db";

export async function GET() {
  // Tier 1: Live WAQI → save to Supabase
  try {
    const { stations, source } = await getCurrentData();
    // Persist to Supabase (non-blocking)
    upsertStations(stations).catch(() => {});
    saveReadings(stations).catch(() => {});
    return NextResponse.json({ stations, source });
  } catch { /* fall through */ }

  // Tier 2: Read from Supabase cache
  try {
    const cached = await getLatestReadings();
    if (cached.length > 0) {
      return NextResponse.json({ stations: cached, source: "supabase cache" });
    }
  } catch { /* fall through */ }

  // Tier 3: Load real station CSV
  try {
    const stations = await loadRealStations();
    return NextResponse.json({ stations, source: "csv fallback" });
  } catch { /* fall through */ }

  // Tier 4: Pure synthetic demo
  const stations = generateDemoStations();
  return NextResponse.json({ stations, source: "demo (synthetic)" });
}
