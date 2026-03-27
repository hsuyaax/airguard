"use client";

import { useEffect, useState } from "react";
import { AqiBadge } from "@/components/AqiBadge";
import { SourcePieChart, SourceBarChart } from "@/components/SourceChart";
import { getGrapStage, aqiCategory, formatSourceName } from "@/lib/aqi";
import { estimateSources } from "@/lib/demo-data";
import { INTERVENTIONS } from "@/lib/config";
import type { WardData, SourceBreakdown, SimulationResult } from "@/lib/types";

export default function AdminDashboard() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [selectedWard, setSelectedWard] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeLang, setNoticeLang] = useState<"english" | "hindi" | "both">("english");
  const [noticeMode, setNoticeMode] = useState<"template" | "llm">("template");
  const [validationResult, setValidationResult] = useState<{ rmse: number | null; mae: number | null; r2: number | null; n_stations: number; station_errors?: Array<{ station: string; actual: number; predicted: number; error: number }>; backend?: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wards").then((r) => r.json()).then((data) => {
      const wards = data.wardData || data.ward_data || [];
      setWardData(wards);
      if (wards.length > 0) setSelectedWard(wards[0].ward_name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const ward = wardData.find((w) => w.ward_name === selectedWard);
  const wardAqi = ward?.aqi || 0;
  const wardPm25 = ward?.pm25 || 100;
  const { label: grapLabel } = getGrapStage(wardAqi);
  const sources: SourceBreakdown = estimateSources(wardPm25, wardPm25 * 1.8, 40, 15, 1.5);
  const primarySource = Object.entries(sources).sort(([, a], [, b]) => b - a)[0];

  const TABS = ["Source Apportionment", "What-If Simulator", "Enforcement Notices", "Validation Metrics"];

  const handleSimulate = async () => {
    const res = await fetch("/api/simulator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPm25: wardPm25, sourceBreakdown: sources, selectedInterventions }) });
    setSimResult(await res.json());
  };

  const handleGenerateNotice = async () => {
    setNotice("Generating...");
    const res = await fetch("/api/enforcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wardName: selectedWard, wardNo: ward?.ward_no || 1, aqi: wardAqi, pm25: wardPm25, language: noticeLang, mode: noticeMode }) });
    const data = await res.json();
    setNotice(data.notice || data.error || "Failed to generate");
  };

  return (
    <div className="space-y-10">
      {/* Top: Ward Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end animate-fade-up">
        <div className="lg:col-span-4">
          <label className="text-xs font-label text-slate-400 mb-2 block tracking-[0.15em] uppercase">Jurisdiction Selector</label>
          <select
            value={selectedWard}
            onChange={(e) => { setSelectedWard(e.target.value); setSimResult(null); setNotice(""); }}
            className="w-full bg-surface-low rounded-xl font-headline text-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            style={{ border: "none", borderBottom: "2px solid #c7c4d8" }}
          >
            {wardData.map((w, i) => (<option key={`${w.ward_no}-${i}`} value={w.ward_name}>{w.ward_name}</option>))}
          </select>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <AqiBadge aqi={wardAqi} />
          <div className="bg-surface-lowest p-6 flex flex-col items-center justify-center" style={{ borderBottom: "4px solid #a44100" }}>
            <span className="text-xs font-label text-slate-400 mb-1">GRAP STAGE</span>
            <span className="text-3xl font-headline font-bold text-[#7e3000]">{grapLabel.split(" - ")[0] || "Normal"}</span>
            <span className="text-[10px] font-bold uppercase text-[#7e3000] tracking-tight mt-1">{grapLabel.split(" - ")[1] || ""}</span>
          </div>
          <div className="bg-surface-lowest p-6 flex flex-col items-center justify-center" style={{ borderBottom: "4px solid #3525cd" }}>
            <span className="text-xs font-label text-slate-400 mb-1">PM 2.5 (AVG)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-label font-bold text-primary">{wardPm25}</span>
              <span className="text-xs font-label text-slate-400">&micro;g/m&sup3;</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-6 animate-fade-up delay-100">
        <div className="flex gap-8 overflow-x-auto pb-0.5" style={{ borderBottom: "1px solid rgba(199,196,216,0.2)" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`pb-4 text-sm whitespace-nowrap transition-colors ${activeTab === i ? "font-semibold text-primary" : "font-medium text-slate-400 hover:text-on-surface"}`}
              style={activeTab === i ? { borderBottom: "2px solid #3525cd" } : undefined}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Source Apportionment */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-surface-lowest p-8 rounded-xl">
              <h3 className="font-headline text-xl mb-8">Emission Distribution</h3>
              <SourcePieChart sources={sources} />
            </div>
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-surface-lowest p-8 rounded-xl">
                <h3 className="font-headline text-xl mb-6">Localized Intensity (PM2.5 &micro;g/m&sup3;)</h3>
                <SourceBarChart sources={sources} />
              </div>
              <div className="bg-primary/5 p-6" style={{ borderLeft: "4px solid #3525cd" }}>
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary mt-1">lightbulb</span>
                  <div>
                    <h4 className="font-bold text-primary text-sm uppercase font-label">Action Priority Target</h4>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                      <strong className="text-on-surface">{formatSourceName(primarySource[0])}</strong> is contributing to <span className="font-label font-bold">{primarySource[1]}%</span> of the localized spike. This should be the priority target for AQI improvement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What-If Simulator */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-on-surface-variant">Select interventions to simulate their impact on PM2.5 and AQI.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.keys(INTERVENTIONS).map((name) => (
                <label key={name} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${selectedInterventions.includes(name) ? "bg-primary/5" : "bg-surface-lowest hover:bg-surface-low"}`} style={selectedInterventions.includes(name) ? { border: "2px solid rgba(53,37,205,0.3)" } : { border: "1px solid rgba(199,196,216,0.15)" }}>
                  <input type="checkbox" checked={selectedInterventions.includes(name)} onChange={(e) => setSelectedInterventions(e.target.checked ? [...selectedInterventions, name] : selectedInterventions.filter((i) => i !== name))} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
            </div>
            {selectedInterventions.length > 0 && (
              <button onClick={handleSimulate} className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">play_arrow</span> Simulate Impact
              </button>
            )}
            {simResult && (
              <div className="grid grid-cols-3 gap-6 items-center bg-surface-lowest p-8 rounded-xl">
                <div className="text-center">
                  <p className="text-[10px] font-label text-slate-400 uppercase mb-3 tracking-widest">Before</p>
                  <AqiBadge aqi={simResult.before.aqi} />
                  <p className="text-sm mt-2 font-label">PM2.5: <strong>{simResult.before.pm25}</strong></p>
                </div>
                <div className="text-center">
                  <div className="text-4xl text-primary font-bold">&rarr;</div>
                  <div className="text-lg text-primary font-bold font-label">-{simResult.reduction_pct}%</div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-label text-slate-400 uppercase mb-3 tracking-widest">After</p>
                  <AqiBadge aqi={simResult.after.aqi} />
                  <p className="text-sm mt-2 font-label">PM2.5: <strong>{simResult.after.pm25}</strong></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enforcement Notices */}
        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-surface-lowest p-8 rounded-xl h-fit">
              <h3 className="font-headline text-xl mb-6">Notice Engine</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-label text-slate-400 mb-2 block uppercase tracking-tight">Target Language</label>
                  <div className="flex gap-2">
                    {(["english", "hindi", "both"] as const).map((lang) => (
                      <button key={lang} onClick={() => setNoticeLang(lang)} className={`px-3 py-2 text-xs rounded-xl capitalize ${noticeLang === lang ? "font-bold bg-primary/5 text-primary" : "font-medium text-slate-400"}`} style={noticeLang === lang ? { border: "2px solid rgba(53,37,205,0.3)" } : { border: "1px solid #c7c4d8" }}>
                        {lang === "both" ? "Bilingual" : lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-label text-slate-400 mb-2 block uppercase tracking-tight">Generation Mode</label>
                  <div className="flex gap-2">
                    <button onClick={() => setNoticeMode("template")} className={`px-3 py-2 text-xs rounded-xl ${noticeMode === "template" ? "font-bold bg-primary/5 text-primary" : "font-medium text-slate-400"}`} style={noticeMode === "template" ? { border: "2px solid rgba(53,37,205,0.3)" } : { border: "1px solid #c7c4d8" }}>
                      Template (Instant)
                    </button>
                    <button onClick={() => setNoticeMode("llm")} className={`px-3 py-2 text-xs rounded-xl flex items-center gap-1 ${noticeMode === "llm" ? "font-bold bg-primary/5 text-primary" : "font-medium text-slate-400"}`} style={noticeMode === "llm" ? { border: "2px solid rgba(53,37,205,0.3)" } : { border: "1px solid #c7c4d8" }}>
                      <span className="material-symbols-outlined text-sm">auto_awesome</span> LLM (Groq AI)
                    </button>
                  </div>
                </div>
                <button onClick={handleGenerateNotice} className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95">
                  <span className="material-symbols-outlined">description</span> Generate Enforcement Notice
                </button>
              </div>
            </div>
            <div className="lg:col-span-8 bg-surface-lowest p-1" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
              {notice ? (
                <div className="bg-white p-10 min-h-[500px] font-label text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap overflow-auto max-h-[600px]">
                  {notice}
                </div>
              ) : (
                <div className="bg-white p-10 min-h-[500px] flex items-center justify-center text-slate-300 font-label text-sm uppercase tracking-widest">
                  Notice will appear here
                </div>
              )}
              {notice && (
                <div className="p-4 flex justify-end">
                  <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(notice)}`} download={`MCD_Notice_${selectedWard.replace(/ /g, "_")}.txt`} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all">
                    <span className="material-symbols-outlined text-sm">download</span> Download Notice
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validation Metrics */}
        {activeTab === 3 && (
          <div className="bg-surface-lowest p-8 rounded-xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="font-headline text-2xl">Model Reliability Analytics</h3>
                <p className="text-sm text-on-surface-variant">Leave-One-Station-Out cross-validation against CPCB reference stations</p>
              </div>
              <button
                onClick={async () => {
                  setValidating(true);
                  try {
                    const res = await fetch("/api/validate?method=idw");
                    setValidationResult(await res.json());
                  } catch { setValidationResult(null); }
                  setValidating(false);
                }}
                disabled={validating}
                className="bg-primary/10 text-primary font-label font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all flex items-center gap-2 hover:bg-primary/20 disabled:opacity-50" style={{ border: "2px solid rgba(53,37,205,0.2)" }}
              >
                <span className="material-symbols-outlined text-sm">{validating ? "hourglass_top" : "refresh"}</span>
                {validating ? "Running LOSO CV..." : "Run Cross-Validation"}
              </button>
            </div>
            {validationResult?.backend === "ml-api" && (
              <div className="mb-4 flex items-center gap-2 text-xs font-label text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ML Backend Active — Real model inference
              </div>
            )}
            {validationResult?.backend === "fallback" && validationResult?.rmse === null && (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl text-sm text-amber-800" style={{ border: "1px solid #fde68a" }}>
                <strong>ML Backend Offline.</strong> Start the FastAPI server to run real LOSO cross-validation:
                <pre className="mt-2 font-label text-xs bg-white p-3 rounded-lg">cd ml-api &amp;&amp; pip install -r requirements.txt &amp;&amp; uvicorn server:app --port 8000</pre>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-surface-low rounded-xl text-center space-y-2">
                <span className="text-[10px] font-label text-slate-400 uppercase tracking-widest">Root Mean Square Error</span>
                <div className="text-3xl font-label font-bold text-secondary">{validationResult?.rmse ?? "—"}</div>
                {validationResult?.rmse != null && <span className="text-[10px] font-bold text-on-secondary-container bg-secondary-container/30 px-2 py-0.5 rounded-full">{validationResult.rmse < 30 ? "OPTIMAL" : "NEEDS TUNING"}</span>}
              </div>
              <div className="p-6 bg-surface-low rounded-xl text-center space-y-2">
                <span className="text-[10px] font-label text-slate-400 uppercase tracking-widest">Mean Absolute Error</span>
                <div className="text-3xl font-label font-bold text-secondary">{validationResult?.mae ?? "—"}</div>
                {validationResult?.mae != null && <span className="text-[10px] font-bold text-on-secondary-container bg-secondary-container/30 px-2 py-0.5 rounded-full">{validationResult.mae < 25 ? "STABLE" : "HIGH VARIANCE"}</span>}
              </div>
              <div className="p-6 bg-surface-low rounded-xl text-center space-y-2">
                <span className="text-[10px] font-label text-slate-400 uppercase tracking-widest">R-Squared Score</span>
                <div className="text-3xl font-label font-bold text-primary">{validationResult?.r2 ?? "—"}</div>
                {validationResult?.r2 != null && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{validationResult.r2 > 0.8 ? "HIGH CONFIDENCE" : "MODERATE"}</span>}
              </div>
            </div>
            {validationResult?.n_stations ? (
              <p className="text-xs text-slate-500 mb-6">Validated across <strong>{validationResult.n_stations}</strong> CPCB stations using {validationResult.backend === "ml-api" ? "real IDW interpolation (scipy)" : "TypeScript heuristics"}</p>
            ) : null}
            {validationResult?.station_errors && validationResult.station_errors.length > 0 && (
              <div className="mb-8">
                <h4 className="font-headline text-lg mb-4">Per-Station Prediction Errors</h4>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface-lowest">
                      <tr className="text-[10px] font-label text-slate-400 uppercase tracking-widest" style={{ borderBottom: "1px solid #c7c4d8" }}>
                        <th className="py-3 font-normal">Station</th>
                        <th className="py-3 font-normal text-right">Actual PM2.5</th>
                        <th className="py-3 font-normal text-right">Predicted</th>
                        <th className="py-3 font-normal text-right">Abs Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResult.station_errors.map((row) => (
                        <tr key={row.station} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 font-medium">{row.station}</td>
                          <td className="py-3 text-right font-label text-xs">{row.actual}</td>
                          <td className="py-3 text-right font-label text-xs">{row.predicted}</td>
                          <td className="py-3 text-right font-label text-xs" style={{ color: row.error > 50 ? "#ba1a1a" : row.error > 25 ? "#ff9933" : "#009966" }}>{row.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-label text-slate-400 uppercase tracking-widest" style={{ borderBottom: "1px solid #c7c4d8" }}>
                  <th className="py-4 font-normal">Reference Station</th>
                  <th className="py-4 font-normal text-right">Fallback Status</th>
                  <th className="py-4 font-normal text-right">Last Drift</th>
                  <th className="py-4 font-normal text-right">Error Margin</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {[
                  { name: "Bawana (CPCB-004)", status: "BYPASS ACTIVE", statusColor: "error", drift: "+1.2%", error: "2.44%" },
                  { name: "Lodhi Road (DPCC-012)", status: "NOMINAL", statusColor: "green", drift: "-0.4%", error: "1.12%" },
                  { name: "NSIT Dwarka (CPCB-009)", status: "NOMINAL", statusColor: "green", drift: "+0.1%", error: "0.85%" },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-medium">{row.name}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.statusColor === "green" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{row.status}</span>
                    </td>
                    <td className="py-4 text-right font-label text-xs">{row.drift}</td>
                    <td className="py-4 text-right font-label text-xs">{row.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
