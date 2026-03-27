"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getGrapStage, aqiColor, aqiCategory, formatSourceName } from "@/lib/aqi";
import { estimateSources } from "@/lib/demo-data";
import { INTERVENTIONS } from "@/lib/config";
import type { WardData, Station } from "@/lib/types";

// ── Mock Compliance Data ──
const MOCK_COMPLIANCE = [
  { ward: "Ward 14", aqiAtNotice: 438, currentAqi: 392, trend: "down" as const, status: "Compliant" as const },
  { ward: "Ward 87", aqiAtNotice: 412, currentAqi: 425, trend: "up" as const, status: "Overdue" as const },
  { ward: "Ward 203", aqiAtNotice: 389, currentAqi: 341, trend: "down" as const, status: "Compliant" as const },
  { ward: "Ward 56", aqiAtNotice: 401, currentAqi: 398, trend: "down" as const, status: "Pending" as const },
  { ward: "Ward 142", aqiAtNotice: 445, currentAqi: 461, trend: "up" as const, status: "Overdue" as const },
];

export default function CommandCenterPage() {
  const router = useRouter();
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterventions, setActiveInterventions] = useState<Record<string, boolean>>({});
  const [enforcementResult, setEnforcementResult] = useState<string | null>(null);
  const [enforcementWard, setEnforcementWard] = useState<string>("");
  const [enforcementLoading, setEnforcementLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wards")
      .then((r) => r.json())
      .then((data) => {
        const wards = data.wardData || data.ward_data || [];
        const stns = data.stations || [];
        setWardData(wards);
        setStations(stns);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const severeCount = wardData.filter((w) => w.aqi > 400).length;
  const veryPoorCount = wardData.filter((w) => w.aqi > 300 && w.aqi <= 400).length;
  const avgAqi = wardData.length > 0 ? Math.round(wardData.reduce((s, w) => s + w.aqi, 0) / wardData.length) : 0;
  const { stage: grapStage } = getGrapStage(avgAqi);

  const worstWards = [...wardData].sort((a, b) => b.aqi - a.aqi).slice(0, 10);

  // Compute aggregate AQI reduction from active interventions on worst ward
  const worstWard = worstWards[0];
  const computeReduction = useCallback(() => {
    if (!worstWard) return 0;
    const sources = estimateSources(worstWard.pm25, worstWard.pm25 * 1.8, 40, 15, 1.5);
    let totalReduction = 0;

    for (const [name, isActive] of Object.entries(activeInterventions)) {
      if (!isActive) continue;
      const effects = INTERVENTIONS[name];
      if (!effects) continue;
      for (const [sourceType, reductionPct] of Object.entries(effects)) {
        const sourceFraction = (sources[sourceType] || 0) / 100;
        totalReduction += Math.abs(reductionPct) * sourceFraction;
      }
    }

    return Math.round(totalReduction * 10) / 10;
  }, [activeInterventions, worstWard]);

  const predictedReduction = computeReduction();

  const handleIssueNotice = async (ward: WardData) => {
    setEnforcementWard(ward.ward_name);
    setEnforcementLoading(true);
    setEnforcementResult(null);

    try {
      const res = await fetch("/api/enforcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardName: ward.ward_name,
          wardNo: ward.ward_no,
          aqi: ward.aqi,
          pm25: ward.pm25,
          language: "english",
          mode: "template",
        }),
      });
      const data = await res.json();
      setEnforcementResult(data.notice || data.error || "Failed to generate notice.");
    } catch {
      setEnforcementResult("Network error. Please try again.");
    } finally {
      setEnforcementLoading(false);
    }
  };

  const toggleIntervention = (name: string) => {
    setActiveInterventions((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="font-label text-xs text-slate-400 uppercase tracking-widest">Loading command data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="animate-fade-up">
        <p className="font-label text-xs text-slate-400 uppercase tracking-[0.15em] font-semibold">Commissioner&apos;s War Room</p>
        <h1 className="font-headline text-2xl text-slate-900 mt-1">Command Center</h1>
      </div>

      {/* Section A: Situation Status Bar */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-up">
        {/* Wards in Severe */}
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: severeCount > 0 ? "1px solid rgba(186,26,26,0.2)" : "1px solid rgba(199,196,216,0.1)" }}>
          <p className="font-label text-xs text-slate-500 font-semibold tracking-[0.15em] uppercase">Wards in Severe</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className={`text-5xl font-label font-bold ${severeCount > 0 ? "text-error" : "text-slate-900"}`}>{severeCount}</span>
            <span className="text-sm font-label text-slate-400">AQI &gt; 400</span>
          </div>
          {severeCount > 0 && (
            <div className="mt-3 px-2.5 py-1 rounded-lg bg-error-container inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-on-error-container">warning</span>
              <span className="text-[10px] font-label font-bold text-on-error-container uppercase">Critical</span>
            </div>
          )}
        </div>

        {/* Wards Very Poor */}
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <p className="font-label text-xs text-slate-500 font-semibold tracking-[0.15em] uppercase">Wards Very Poor</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-label font-bold" style={{ color: "#cc0033" }}>{veryPoorCount}</span>
            <span className="text-sm font-label text-slate-400">AQI 301-400</span>
          </div>
        </div>

        {/* Active GRAP Stage */}
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <p className="font-label text-xs text-slate-500 font-semibold tracking-[0.15em] uppercase">Active GRAP Stage</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-label font-bold text-slate-900">{grapStage > 0 ? grapStage : "--"}</span>
            <span className="text-sm font-label text-slate-400">{grapStage > 0 ? `Stage ${grapStage}` : "Pre-GRAP"}</span>
          </div>
        </div>

        {/* Stations Reporting */}
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <p className="font-label text-xs text-slate-500 font-semibold tracking-[0.15em] uppercase">Stations Reporting</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-label font-bold text-slate-900">{stations.length}</span>
            <span className="text-sm font-label text-slate-400">active</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-label text-slate-400 uppercase">All online</span>
          </div>
        </div>
      </section>

      {/* Section B: Decision Queue */}
      <section className="bg-surface-lowest p-8 rounded-xl animate-fade-up delay-100" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <div className="flex flex-col gap-1 mb-6">
          <p className="font-label text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold">Decision Support</p>
          <h2 className="font-headline text-lg text-slate-900">Priority Action Queue</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="text-left" style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Rank</th>
                <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ward</th>
                <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">AQI</th>
                <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Category</th>
                <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Primary Source</th>
                <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {worstWards.map((ward, i) => {
                const sources = estimateSources(ward.pm25, ward.pm25 * 1.8, 40, 15, 1.5);
                const topSource = Object.entries(sources).sort(([, a], [, b]) => b - a)[0];
                return (
                  <tr key={ward.ward_no} className="group hover:bg-surface-low transition-colors" style={{ borderBottom: "1px solid rgba(199,196,216,0.1)" }}>
                    <td className="py-3 pr-4">
                      <span className="font-label text-xs font-bold text-slate-400">#{i + 1}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-slate-900">{ward.ward_name}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-label text-lg font-bold" style={{ color: aqiColor(ward.aqi) }}>
                        {ward.aqi}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="px-2 py-1 rounded-md text-[10px] font-label font-bold uppercase"
                        style={{
                          backgroundColor: `${aqiColor(ward.aqi)}15`,
                          color: aqiColor(ward.aqi),
                        }}
                      >
                        {aqiCategory(ward.aqi)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-slate-600">{formatSourceName(topSource[0])}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({topSource[1]}%)</span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleIssueNotice(ward)}
                          className="px-3 py-1.5 text-[11px] font-label font-bold rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
                        >
                          Issue Notice
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/admin?ward=${encodeURIComponent(ward.ward_name)}`)}
                          className="px-3 py-1.5 text-[11px] font-label font-bold rounded-lg bg-surface-low text-slate-600 hover:bg-primary hover:text-on-primary transition-colors"
                        >
                          Simulate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Grid: Interventions + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section C: Active Interventions Timeline */}
        <section className="bg-surface-lowest p-8 rounded-xl animate-fade-up delay-200" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex flex-col gap-1 mb-4">
            <p className="font-label text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold">Intervention Control</p>
            <h2 className="font-headline text-lg text-slate-900">Active Interventions</h2>
          </div>

          {worstWard && predictedReduction > 0 && (
            <div className="mb-5 p-3 rounded-xl bg-primary/5 flex items-center gap-3" style={{ border: "1px solid rgba(53,37,205,0.1)" }}>
              <span className="material-symbols-outlined text-lg text-primary">trending_down</span>
              <div>
                <p className="text-xs font-label font-bold text-primary">
                  Predicted AQI Reduction for {worstWard.ward_name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Estimated <span className="font-bold text-primary">-{predictedReduction}%</span> from active interventions
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {Object.entries(INTERVENTIONS).map(([name, effects]) => {
              const isActive = activeInterventions[name] || false;
              const targetSources = Object.keys(effects).map((s) => formatSourceName(s));
              const reductions = Object.values(effects).map((v) => `${Math.abs(v)}%`);
              return (
                <div
                  key={name}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive ? "bg-primary/5" : "bg-surface-low"
                  }`}
                  style={{ border: isActive ? "1px solid rgba(53,37,205,0.15)" : "1px solid transparent" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-label">
                        {targetSources.join(", ")}
                      </span>
                      <span className="text-[10px] font-label font-bold text-primary">
                        {reductions.join(", ")} reduction
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleIntervention(name)}
                    className={`px-3 py-1.5 text-[11px] font-label font-bold rounded-lg transition-all ${
                      isActive
                        ? "bg-primary text-on-primary"
                        : "bg-surface-high text-slate-500 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {isActive ? "Active" : "Deploy"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section D: Compliance Tracker */}
        <section className="bg-surface-lowest p-8 rounded-xl animate-fade-up delay-300" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex flex-col gap-1 mb-6">
            <p className="font-label text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold">Enforcement Tracking</p>
            <h2 className="font-headline text-lg text-slate-900">Compliance Monitor</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="text-left" style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ward</th>
                  <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">AQI at Notice</th>
                  <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Current AQI</th>
                  <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Trend</th>
                  <th className="pb-3 font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COMPLIANCE.map((row) => {
                  const improving = row.trend === "down";
                  const statusColors: Record<string, { bg: string; text: string }> = {
                    Compliant: { bg: "rgba(0,153,102,0.1)", text: "#009966" },
                    Pending: { bg: "rgba(255,222,51,0.15)", text: "#b89600" },
                    Overdue: { bg: "rgba(186,26,26,0.1)", text: "#ba1a1a" },
                  };
                  const colors = statusColors[row.status] || statusColors.Pending;
                  return (
                    <tr key={row.ward} className="hover:bg-surface-low transition-colors" style={{ borderBottom: "1px solid rgba(199,196,216,0.1)" }}>
                      <td className="py-3 pr-4 font-medium text-slate-900">{row.ward}</td>
                      <td className="py-3 pr-4 font-label font-bold" style={{ color: aqiColor(row.aqiAtNotice) }}>
                        {row.aqiAtNotice}
                      </td>
                      <td className="py-3 pr-4 font-label font-bold" style={{ color: aqiColor(row.currentAqi) }}>
                        {row.currentAqi}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`material-symbols-outlined text-lg ${improving ? "text-emerald-600" : "text-error"}`}>
                          {improving ? "trending_down" : "trending_up"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className="px-2.5 py-1 rounded-md text-[10px] font-label font-bold uppercase"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Enforcement Notice Modal */}
      {(enforcementResult || enforcementLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setEnforcementResult(null); setEnforcementLoading(false); }}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest font-bold">Enforcement Notice</p>
                <h3 className="font-headline text-base text-slate-900">{enforcementWard}</h3>
              </div>
              <button
                onClick={() => { setEnforcementResult(null); setEnforcementLoading(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-lg text-slate-400">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {enforcementLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-label text-xs text-slate-400 uppercase tracking-widest">Generating notice...</p>
                  </div>
                </div>
              ) : (
                <pre className="text-xs text-slate-700 font-label whitespace-pre-wrap leading-relaxed">{enforcementResult}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
