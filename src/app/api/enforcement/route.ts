import { NextResponse } from "next/server";
import { mlEnforcement } from "@/lib/ml-client";
import { generateEnforcementNotice } from "@/lib/enforcement";
import { estimateSources } from "@/lib/demo-data";
import { getGrapStage } from "@/lib/aqi";
import { saveNotice } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wardName, wardNo, aqi, pm25, language, mode } = body;

    let noticeText = "";
    let primarySource = "";
    let grapStage = 0;
    let sources: Record<string, number> = {};

    // Tier 1: ML Backend
    try {
      const result = await mlEnforcement(wardName, wardNo, aqi, pm25, {
        language: language || "english",
        mode: mode || "template",
      });
      noticeText = result.notice;
      primarySource = result.primary_source;
      grapStage = result.grap_stage;

      // Save to Supabase
      saveNotice({
        ward_name: wardName, ward_no: wardNo, aqi_at_issue: aqi,
        primary_source: primarySource, grap_stage: grapStage,
        notice_text: noticeText, language: language || "english", mode: mode || "template",
      }).catch(() => {});

      return NextResponse.json({ ...result, backend: "ml-api" });
    } catch { /* ML backend down */ }

    // Tier 2: TypeScript enforcement
    sources = estimateSources(pm25, pm25 * 1.8, 40, 15, 1.5);
    const sortedSources = Object.entries(sources).sort(([, a], [, b]) => b - a);
    primarySource = sortedSources[0][0];
    grapStage = getGrapStage(aqi).stage;

    noticeText = await generateEnforcementNotice(
      wardName, wardNo, aqi,
      primarySource, sortedSources[0][1],
      sources,
      { language: language || "english", mode: mode || "template" }
    );

    // Save to Supabase
    saveNotice({
      ward_name: wardName, ward_no: wardNo, aqi_at_issue: aqi,
      primary_source: primarySource, grap_stage: grapStage,
      notice_text: noticeText, language: language || "english", mode: mode || "template",
    }).catch(() => {});

    return NextResponse.json({ notice: noticeText, sources, backend: "fallback" });
  } catch {
    return NextResponse.json({ error: "Failed to generate notice" }, { status: 500 });
  }
}
