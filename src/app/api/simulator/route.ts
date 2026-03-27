import { NextResponse } from "next/server";
import { mlSimulate } from "@/lib/ml-client";
import { simulateInterventions } from "@/lib/simulator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentPm25, sourceBreakdown, selectedInterventions } = body;

    // Tier 1: ML Backend (real model-based simulation)
    try {
      const result = await mlSimulate(currentPm25, sourceBreakdown, selectedInterventions);
      return NextResponse.json({ ...result, backend: "ml-api" });
    } catch { /* ML backend down */ }

    // Tier 2: TypeScript simulation
    const result = simulateInterventions(currentPm25, sourceBreakdown, selectedInterventions);
    return NextResponse.json({ ...result, backend: "fallback" });
  } catch {
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
