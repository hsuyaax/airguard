import { NextResponse } from "next/server";
import { mlPredictSources } from "@/lib/ml-client";
import { estimateSources } from "@/lib/demo-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pm25 = parseFloat(searchParams.get("pm25") || "100");
  const pm10 = parseFloat(searchParams.get("pm10") || "180");
  const no2 = parseFloat(searchParams.get("no2") || "40");
  const so2 = parseFloat(searchParams.get("so2") || "15");
  const co = parseFloat(searchParams.get("co") || "1.5");

  // Tier 1: ML Backend (XGBoost + fingerprinting)
  try {
    const result = await mlPredictSources(pm25, pm10, no2, so2, co);
    return NextResponse.json({ ...result, backend: "ml-api" });
  } catch { /* ML backend down */ }

  // Tier 2: TypeScript fingerprinting heuristic
  const sources = estimateSources(pm25, pm10, no2, so2, co);
  return NextResponse.json({ sources, model_used: "ts_fingerprinting", backend: "fallback" });
}
