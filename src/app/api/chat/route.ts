import { NextResponse } from "next/server";
import { generateDemoStations, generateDemoWards, estimateSources } from "@/lib/demo-data";
import { getGrapStage, aqiCategory } from "@/lib/aqi";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildWardSummary(): string {
  const stations = generateDemoStations();
  const { wardData } = generateDemoWards(stations);

  const avgAqi = Math.round(wardData.reduce((s, w) => s + w.aqi, 0) / wardData.length);
  const { stage: grapStage } = getGrapStage(avgAqi);
  const severeWards = wardData.filter((w) => w.aqi > 400);
  const veryPoorWards = wardData.filter((w) => w.aqi > 300 && w.aqi <= 400);
  const worstWards = [...wardData].sort((a, b) => b.aqi - a.aqi).slice(0, 10);

  const worstList = worstWards
    .map((w) => {
      const sources = estimateSources(w.pm25, w.pm25 * 1.8, 40, 15, 1.5);
      const topSource = Object.entries(sources).sort(([, a], [, b]) => b - a)[0];
      return `  - ${w.ward_name}: AQI ${w.aqi} (${aqiCategory(w.aqi)}), PM2.5 ${w.pm25} ug/m3, primary source: ${topSource[0].replace(/_/g, " ")} (${topSource[1]}%)`;
    })
    .join("\n");

  return `Current Delhi Air Quality Snapshot:
- City Average AQI: ${avgAqi} (${aqiCategory(avgAqi)})
- Active GRAP Stage: ${grapStage > 0 ? `Stage ${grapStage}` : "Pre-GRAP (Normal)"}
- Total Wards: ${wardData.length}
- Wards in Severe (AQI > 400): ${severeWards.length}
- Wards in Very Poor (AQI 301-400): ${veryPoorWards.length}
- Monitoring Stations: ${stations.length}

Top 10 Worst Wards:
${worstList}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const wardSummary = buildWardSummary();

    const systemPrompt = `You are AirGuard AI, an environmental intelligence assistant for the Municipal Corporation of Delhi. You help officers understand air quality data and make decisions. Be concise and action-oriented. Use specific ward names and AQI numbers when available.

Here is the current real-time ward data you should reference when answering questions:

${wardSummary}`;

    if (!GROQ_API_KEY) {
      // Fallback when no API key is configured
      return NextResponse.json({
        reply: `I don't have an active AI connection right now, but here is the current data summary:\n\n${wardSummary}\n\nPlease configure GROQ_API_KEY for full AI-powered responses.`,
        model: "fallback",
      });
    }

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Groq API HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply, model: "llama-3.3-70b-versatile" });
  } catch (e) {
    console.warn("Chat API error:", (e as Error).message);
    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}
