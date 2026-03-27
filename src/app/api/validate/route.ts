import { NextResponse } from "next/server";
import { mlValidate } from "@/lib/ml-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const method = searchParams.get("method") || "idw";

  // Tier 1: ML Backend (real LOSO cross-validation with scipy/numpy)
  try {
    const result = await mlValidate(method);
    return NextResponse.json({ ...result, backend: "ml-api" });
  } catch { /* ML backend down */ }

  // Tier 2: Return placeholder metrics (frontend shows "Run Cross-Validation" button)
  return NextResponse.json({
    rmse: null,
    mae: null,
    r2: null,
    n_stations: 0,
    method,
    backend: "fallback",
    message: "Start the ML backend (ml-api) to run real cross-validation",
  });
}
