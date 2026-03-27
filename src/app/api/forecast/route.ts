import { NextResponse } from "next/server";
import { mlForecast } from "@/lib/ml-client";
import { forecastWard } from "@/lib/forecaster";
import { generateDemoForecast } from "@/lib/demo-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const basePm25 = parseFloat(searchParams.get("pm25") || "120");
  const hours = parseInt(searchParams.get("hours") || "48");
  const stationId = searchParams.get("station") || undefined;
  const wardName = searchParams.get("ward") || undefined;

  // Tier 1: ML Backend (Prophet / LSTM / Linear)
  try {
    const result = await mlForecast(basePm25, hours, stationId, wardName);
    return NextResponse.json({ ...result, backend: "ml-api" });
  } catch { /* ML backend down */ }

  // Tier 2: TypeScript linear extrapolation
  try {
    const historicalPm25 = Array.from({ length: 24 }, (_, i) =>
      basePm25 + Math.sin(i / 4) * 20 + (Math.random() - 0.5) * 10
    );
    const forecast = forecastWard(basePm25, historicalPm25, hours);
    return NextResponse.json({ forecast, model_used: "ts_linear", backend: "fallback" });
  } catch {
    const forecast = generateDemoForecast(basePm25, hours);
    return NextResponse.json({ forecast, model_used: "ts_demo", backend: "fallback" });
  }
}
