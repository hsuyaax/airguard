import { INTERVENTIONS } from "./config";
import { pm25ToAqi } from "./aqi";
import type { SourceBreakdown, SimulationResult } from "./types";

export function simulateInterventions(
  currentPm25: number,
  sourceBreakdown: SourceBreakdown,
  selectedInterventions: string[]
): SimulationResult {
  const sourceContributions: Record<string, number> = {};
  for (const [source, pct] of Object.entries(sourceBreakdown)) {
    sourceContributions[source] = currentPm25 * (pct / 100);
  }

  const reduced = { ...sourceContributions };
  const applied: SimulationResult["applied_interventions"] = [];

  for (const name of selectedInterventions) {
    const reductions = INTERVENTIONS[name];
    if (!reductions) continue;
    for (const [source, reductionPct] of Object.entries(reductions)) {
      if (source in reduced) {
        const reduction = reduced[source] * Math.abs(reductionPct) / 100;
        reduced[source] = Math.max(0, reduced[source] - reduction);
        applied.push({ intervention: name, source, reduction_pct: reductionPct, reduction_ug: Math.round(reduction * 10) / 10 });
      }
    }
  }

  const newPm25 = Object.values(reduced).reduce((a, b) => a + b, 0);
  const before = pm25ToAqi(currentPm25);
  const after = pm25ToAqi(newPm25);

  return {
    before: { pm25: Math.round(currentPm25 * 10) / 10, aqi: before.aqi, category: before.category, color: before.color, sources: sourceContributions },
    after: { pm25: Math.round(newPm25 * 10) / 10, aqi: after.aqi, category: after.category, color: after.color, sources: reduced },
    reduction_pm25: Math.round((currentPm25 - newPm25) * 10) / 10,
    reduction_pct: Math.round(((currentPm25 - newPm25) / Math.max(currentPm25, 1)) * 1000) / 10,
    applied_interventions: applied,
  };
}
