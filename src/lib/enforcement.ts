/**
 * AirGuard — Enforcement Notice Generator
 * Ported from enforcement/templates.py + enforcement/llm_generator.py + enforcement/generator.py
 * Tier 1: Groq LLM (Llama-3 70B) | Tier 2: Template (offline, instant)
 */

import { getGrapStage, formatSourceName } from "./aqi";
import type { SourceBreakdown } from "./types";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ── 8 Source Action Matrices (4 actions each) ──
const SOURCE_ACTIONS: Record<string, string[]> = {
  road_dust: [
    "Deploy mechanical sweepers on all arterial roads within the ward",
    "Ensure water sprinkling twice daily (6 AM and 2 PM) on unpaved roads",
    "Inspect and enforce dust suppression at all active construction sites",
    "Impose penalty on trucks carrying uncovered construction material",
  ],
  construction_dust: [
    "Issue stop-work notices to sites without anti-smog nets and windbreakers",
    "Mandate wet drilling and grinding at all construction sites",
    "Deploy anti-smog guns at construction sites > 500 sqm",
    "Ensure construction debris is covered during transport",
  ],
  biomass_burning: [
    "Deploy patrol teams to detect and extinguish open biomass fires",
    "Issue challans under Delhi Municipal Corporation Act Sec 461",
    "Set up awareness camps on alternatives to open burning",
    "Coordinate with Delhi Police for enforcement at known burning hotspots",
  ],
  vehicular_traffic: [
    "Coordinate with Delhi Traffic Police for traffic diversion on key corridors",
    "Enforce PUC certificate checks at ward entry points",
    "Restrict entry of BS-III and below diesel vehicles during GRAP activation",
    "Activate congestion-based traffic signal optimization",
  ],
  industrial: [
    "Inspect all industrial units for valid Consent to Operate (CTO)",
    "Verify emission stack monitoring records for the past 6 months",
    "Issue closure notices to units operating without DPCC clearance",
    "Verify use of approved fuel (no pet coke, furnace oil without permission)",
  ],
  secondary_aerosols: [
    "Implement emergency GRAP measures for photochemical pollution",
    "Restrict use of coal and wood in tandoors and restaurants",
    "Coordinate with DPCC for regional emission source controls",
    "Issue public health advisory for sensitive groups",
  ],
  waste_burning: [
    "Deploy night patrol teams at known waste dumping/burning sites",
    "Issue challans under Solid Waste Management Rules 2016",
    "Ensure door-to-door waste collection compliance in the ward",
    "Set up CCTV monitoring at known open burning hotspots",
  ],
  diesel_generators: [
    "Enforce ban on diesel generators > 2 KVA in residential areas",
    "Inspect commercial establishments for unapproved DG set usage",
    "Verify DG set emission compliance certificates",
    "Ensure backup power infrastructure meets DPCC noise/emission norms",
  ],
};

// ── 4 GRAP Stage Action Matrices ──
const GRAP_ACTIONS: Record<number, string[]> = {
  1: [
    "Enforce GRAP Stage I: Intensify road sweeping and water sprinkling",
    "Issue advisory to schools for reducing outdoor activities",
  ],
  2: [
    "Enforce GRAP Stage II: Ban on coal/firewood in restaurants",
    "Restrict diesel generators, enhance public transport frequency",
  ],
  3: [
    "Enforce GRAP Stage III: Ban on construction/demolition activities",
    "Close brick kilns, hot mix plants, and stone crushers",
    "Restrict BS-IV and below diesel vehicles",
  ],
  4: [
    "Enforce GRAP Stage IV: Stop entry of trucks (except essential services)",
    "Ban all construction activities without exception",
    "Consider school closures and work-from-home advisories",
    "Deploy water tankers for continuous road sprinkling",
  ],
};

// ── Template-Based Notice Generator (Tier 2: always works) ──
export function generateTemplateNotice(
  wardName: string, wardNo: number, aqi: number,
  primarySource: string, sourcePct: number,
  sourceBreakdown: SourceBreakdown
): string {
  const date = new Date();
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const dateRef = date.toISOString().slice(0, 10).replace(/-/g, "");
  const { stage: grapStage } = getGrapStage(aqi);

  let cat = "Severe";
  if (aqi <= 50) cat = "Good";
  else if (aqi <= 100) cat = "Satisfactory";
  else if (aqi <= 200) cat = "Moderate";
  else if (aqi <= 300) cat = "Poor";
  else if (aqi <= 400) cat = "Very Poor";

  let notice = `
================================================================================
                     MUNICIPAL CORPORATION OF DELHI
                  ENVIRONMENT & FOREST DEPARTMENT
                     ENFORCEMENT NOTICE
================================================================================
Reference: MCD/AQ/${wardNo}/${dateRef}
Date: ${dateStr}

WARD: ${wardName} (Ward No. ${wardNo})
CURRENT AQI: ${aqi} | Category: ${cat}
PRIMARY POLLUTION SOURCE: ${formatSourceName(primarySource)} (${sourcePct}%)
GRAP STAGE: ${grapStage > 0 ? `Stage ${grapStage}` : "Pre-GRAP (Normal)"}

--------------------------------------------------------------------------------
DIRECTED ACTIONS (Under Section 5 of the Air (Prevention and Control of
Pollution) Act, 1981 and GRAP Directives):
--------------------------------------------------------------------------------`;

  const actions = SOURCE_ACTIONS[primarySource] || SOURCE_ACTIONS.road_dust;
  actions.forEach((action, i) => { notice += `\n  ${i + 1}. ${action}`; });

  if (grapStage > 0) {
    notice += `\n\nGRAP STAGE ${grapStage} MANDATORY ACTIONS:`;
    (GRAP_ACTIONS[grapStage] || []).forEach((action, i) => { notice += `\n  ${i + 1}. ${action}`; });
  }

  notice += "\n\n--------------------------------------------------------------------------------";
  notice += "\nSOURCE APPORTIONMENT ANALYSIS:";
  notice += "\n--------------------------------------------------------------------------------";
  Object.entries(sourceBreakdown)
    .sort(([, a], [, b]) => b - a)
    .forEach(([source, pct]) => {
      const bar = "#".repeat(Math.round(pct / 2));
      notice += `\n  ${formatSourceName(source).padEnd(25)} ${pct.toFixed(1).padStart(5)}%  ${bar}`;
    });

  notice += `
--------------------------------------------------------------------------------
COMPLIANCE DEADLINE: 48 hours from date of issuance

FAILURE TO COMPLY will result in:
- Penalty under DPCC regulations (Rs. 5,000 - Rs. 5,00,000)
- Closure notice under Section 31A of the Air Act, 1981
- FIR under Section 268/290 IPC for public nuisance

Issued by authority of the Commissioner,
Municipal Corporation of Delhi

______________________________
Authorized Signatory
Environment & Forest Department, MCD
================================================================================`;

  return notice;
}

// ── Hindi Header for Template ──
function addHindiHeader(notice: string, wardName: string, aqi: number): string {
  return `
================================================================================
                     \u0926\u093f\u0932\u094d\u0932\u0940 \u0928\u0917\u0930 \u0928\u093f\u0917\u092e
              \u092a\u0930\u094d\u092f\u093e\u0935\u0930\u0923 \u090f\u0935\u0902 \u0935\u0928 \u0935\u093f\u092d\u093e\u0917
                 \u092a\u094d\u0930\u0935\u0930\u094d\u0924\u0928 \u0938\u0942\u091a\u0928\u093e
================================================================================

\u0935\u093e\u0930\u094d\u0921: ${wardName}
\u0935\u0930\u094d\u0924\u092e\u093e\u0928 \u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0938\u0942\u091a\u0915\u093e\u0902\u0915 (AQI): ${aqi}

[\u0905\u0902\u0917\u094d\u0930\u0947\u091c\u093c\u0940 \u0938\u0902\u0938\u094d\u0915\u0930\u0923 \u0928\u0940\u091a\u0947 / English version below]

${notice}`;
}

// ── Groq LLM Notice Generator (Tier 1) ──
async function groqGenerate(
  wardName: string, wardNo: number, aqi: number,
  primarySource: string, sourcePct: number,
  sourceBreakdown: SourceBreakdown,
  language: "english" | "hindi" | "both"
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("No Groq API key configured");

  let langInstruction = "";
  if (language === "hindi") langInstruction = "Generate the notice in Hindi (Devanagari script) with English technical terms.";
  else if (language === "both") langInstruction = "Generate the notice in both Hindi and English (bilingual format).";

  const sourceText = Object.entries(sourceBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([s, p]) => `  - ${formatSourceName(s)}: ${p}%`)
    .join("\n");

  const dateRef = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const { stage: grapStage } = getGrapStage(aqi);

  const prompt = `Generate a formal Municipal Corporation of Delhi (MCD) enforcement notice with these details:

Ward: ${wardName} (Ward No. ${wardNo})
Current AQI: ${aqi}
GRAP Stage: ${grapStage}
Primary Pollution Source: ${formatSourceName(primarySource)} (${sourcePct}%)

Source Apportionment:
${sourceText}

Requirements:
1. Include MCD letterhead format with reference number MCD/AQ/${wardNo}/${dateRef}
2. Cite Section 5 of the Air (Prevention and Control of Pollution) Act, 1981
3. Include 4-5 specific enforcement actions targeted at the primary source
4. Include GRAP Stage ${grapStage} mandatory actions
5. Set compliance deadline of 48 hours
6. Include penalty clauses (Rs 5,000 - Rs 5,00,000 under DPCC regulations)
7. Professional government tone
${langInstruction}`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert Indian municipal governance officer drafting formal enforcement notices." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Groq API HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Main Orchestrator (matches enforcement/generator.py) ──
export async function generateEnforcementNotice(
  wardName: string, wardNo: number, aqi: number,
  primarySource: string, sourcePct: number,
  sourceBreakdown: SourceBreakdown,
  options: { language?: "english" | "hindi" | "both"; mode?: "template" | "llm" } = {}
): Promise<string> {
  const { language = "english", mode = "template" } = options;

  // Try LLM if requested and available
  if (mode === "llm" && GROQ_API_KEY) {
    try {
      return await groqGenerate(wardName, wardNo, aqi, primarySource, sourcePct, sourceBreakdown, language);
    } catch (e) {
      console.warn("Groq LLM failed, falling back to template:", (e as Error).message);
    }
  }

  // Template fallback (always works)
  let notice = generateTemplateNotice(wardName, wardNo, aqi, primarySource, sourcePct, sourceBreakdown);

  if (language === "hindi") {
    notice = addHindiHeader(notice, wardName, aqi);
  } else if (language === "both") {
    const hindiVersion = addHindiHeader(notice, wardName, aqi);
    notice = `${hindiVersion}\n\n${"=".repeat(80)}\n\n${notice}`;
  }

  return notice;
}
