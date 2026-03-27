"use client";

import { useEffect, useState } from "react";
import { getGrapStage, aqiCategory, aqiColor, formatSourceName } from "@/lib/aqi";
import { estimateSources } from "@/lib/demo-data";
import type { WardData, WeatherData } from "@/lib/types";

type ReportType = "daily" | "ward" | "enforcement";

export default function ReportPage() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wards").then((r) => r.json()),
      fetch("/api/weather").then((r) => r.json()),
    ])
      .then(([wardRes, weatherRes]) => {
        const wards = wardRes.wardData || wardRes.ward_data || [];
        setWardData(wards);
        setWeather(weatherRes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="font-label text-xs text-slate-400 uppercase tracking-widest">Loading data...</div>
        </div>
      </div>
    );
  }

  const avgAqi = wardData.length > 0 ? Math.round(wardData.reduce((s, w) => s + w.aqi, 0) / wardData.length) : 0;
  const { stage: grapStage, label: grapLabel } = getGrapStage(avgAqi);
  const sorted = [...wardData].sort((a, b) => b.aqi - a.aqi);
  const worst5 = sorted.slice(0, 5);
  const best5 = sorted.slice(-5).reverse();
  const top20 = sorted.slice(0, 20);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const refNo = `MCD/ENV/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}/${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const REPORT_TYPES: { value: ReportType; label: string; icon: string }[] = [
    { value: "daily", label: "Daily Briefing", icon: "today" },
    { value: "ward", label: "Ward Report", icon: "location_city" },
    { value: "enforcement", label: "Enforcement Summary", icon: "gavel" },
  ];

  // Source analysis for worst 5 wards
  const worstWardSources = worst5.map((w) => {
    const sources = estimateSources(w.pm25, w.pm25 * 1.8, 40, 15, 1.5);
    const topSources = Object.entries(sources).sort(([, a], [, b]) => b - a).slice(0, 3);
    return { ward: w.ward_name, aqi: w.aqi, sources: topSources };
  });

  // GRAP recommendations
  const getRecommendations = (stage: number): string[] => {
    if (stage === 0) return [
      "Continue routine monitoring of all wards with AQI above 100.",
      "Ensure compliance with ongoing construction dust control norms.",
      "Maintain regular water sprinkling on arterial roads.",
      "Conduct awareness drives in high-traffic corridors.",
    ];
    if (stage === 1) return [
      "Enforce strict ban on open waste burning across all wards.",
      "Increase frequency of mechanized road sweeping and water sprinkling.",
      "Issue health advisories for sensitive groups; restrict outdoor activities in schools.",
      "Deploy anti-smog guns at identified construction hotspots.",
    ];
    if (stage === 2) return [
      "Implement odd-even traffic restrictions in worst-affected wards.",
      "Shut down brick kilns and non-essential industrial units within 50km radius.",
      "Ban all construction and demolition activities until further notice.",
      "Deploy emergency response teams with mobile monitoring in critical wards.",
    ];
    return [
      "Declare public health emergency; advise citizens to stay indoors.",
      "Complete ban on all construction, industrial, and vehicular activity in critical zones.",
      "Deploy Indian Air Force anti-smog systems and cloud-seeding operations.",
      "Evacuate sensitive populations from worst-affected wards; open emergency shelters.",
    ];
  };

  const recommendations = getRecommendations(grapStage);

  return (
    <div className="space-y-8">
      {/* Controls (hidden in print) */}
      <section className="no-print animate-fade-up">
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Report Generator</p>
            <h2 className="font-headline text-2xl text-slate-900">MCD Official Reports</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-3">Report Type</label>
              <div className="flex gap-2">
                {REPORT_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    onClick={() => setReportType(rt.value)}
                    className={`px-4 py-2.5 text-xs rounded-xl flex items-center gap-2 transition-all ${
                      reportType === rt.value
                        ? "font-bold bg-primary/5 text-primary"
                        : "font-medium text-slate-400 hover:text-slate-600"
                    }`}
                    style={
                      reportType === rt.value
                        ? { border: "2px solid rgba(53,37,205,0.3)" }
                        : { border: "1px solid #c7c4d8" }
                    }
                  >
                    <span className="material-symbols-outlined text-sm">{rt.icon}</span>
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Generate &amp; Print
            </button>
          </div>
        </div>
      </section>

      {/* Report Content (visible on screen and print) */}
      <section className="bg-surface-lowest p-8 md:p-12 rounded-xl animate-fade-up delay-100 print:p-0 print:rounded-none print:bg-white" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        {/* Letterhead */}
        <div className="text-center mb-8 pb-6" style={{ borderBottom: "3px solid #3525cd" }}>
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Municipal Corporation of Delhi
          </p>
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-1">
            Environment &amp; Forest Department
          </p>
          <h1 className="font-headline text-2xl md:text-3xl text-slate-900 mt-4">
            {reportType === "daily" && "Daily Air Quality Briefing"}
            {reportType === "ward" && "Ward-wise Air Quality Report"}
            {reportType === "enforcement" && "Enforcement Summary Report"}
          </h1>
          <div className="flex justify-center gap-8 mt-4 text-xs text-slate-500 font-label">
            <span>Date: {dateStr}</span>
            <span>Ref: {refNo}</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-10">
          <h2 className="font-headline text-xl text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary no-print">summarize</span>
            Executive Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${aqiColor(avgAqi)}10`, border: `1px solid ${aqiColor(avgAqi)}20` }}>
              <p className="text-[10px] font-label text-slate-400 uppercase mb-1">Delhi Average AQI</p>
              <p className="text-3xl font-label font-bold" style={{ color: aqiColor(avgAqi) }}>{avgAqi}</p>
              <p className="text-xs font-label font-semibold mt-1" style={{ color: aqiColor(avgAqi) }}>{aqiCategory(avgAqi)}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-low">
              <p className="text-[10px] font-label text-slate-400 uppercase mb-1">GRAP Status</p>
              <p className="text-xl font-headline font-bold text-slate-900">{grapLabel}</p>
              <p className="text-xs text-slate-500 mt-1">Stage {grapStage} activated</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-low">
              <p className="text-[10px] font-label text-slate-400 uppercase mb-1">Wards Monitored</p>
              <p className="text-3xl font-label font-bold text-slate-900">{wardData.length}</p>
              <p className="text-xs text-slate-500 mt-1">{sorted.filter((w) => w.aqi > 300).length} wards above AQI 300</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-label font-bold text-red-600 uppercase tracking-widest mb-3">Worst 5 Wards</p>
              <div className="space-y-2">
                {worst5.map((w, i) => (
                  <div key={w.ward_no} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: `${aqiColor(w.aqi)}08` }}>
                    <span className="text-sm text-slate-700">
                      <span className="font-label font-bold text-slate-400 mr-2">{i + 1}.</span>
                      {w.ward_name}
                    </span>
                    <span className="font-label text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: aqiColor(w.aqi), backgroundColor: `${aqiColor(w.aqi)}15` }}>
                      {w.aqi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-label font-bold text-green-600 uppercase tracking-widest mb-3">Best 5 Wards</p>
              <div className="space-y-2">
                {best5.map((w, i) => (
                  <div key={w.ward_no} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: `${aqiColor(w.aqi)}08` }}>
                    <span className="text-sm text-slate-700">
                      <span className="font-label font-bold text-slate-400 mr-2">{i + 1}.</span>
                      {w.ward_name}
                    </span>
                    <span className="font-label text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: aqiColor(w.aqi), backgroundColor: `${aqiColor(w.aqi)}15` }}>
                      {w.aqi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ward AQI Table */}
        <div className="mb-10">
          <h2 className="font-headline text-xl text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary no-print">table_chart</span>
            Ward AQI Index — Top 20
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] font-label text-slate-400 uppercase tracking-widest" style={{ borderBottom: "1px solid #c7c4d8" }}>
                  <th className="py-3 font-normal">Rank</th>
                  <th className="py-3 font-normal">Ward</th>
                  <th className="py-3 font-normal text-right">AQI</th>
                  <th className="py-3 font-normal text-right">PM2.5</th>
                  <th className="py-3 font-normal text-right">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top20.map((w, i) => (
                  <tr key={w.ward_no} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-label text-xs text-slate-400">{i + 1}</td>
                    <td className="py-3 font-medium text-slate-700">{w.ward_name}</td>
                    <td className="py-3 text-right">
                      <span className="font-label text-xs font-bold" style={{ color: aqiColor(w.aqi) }}>{w.aqi}</span>
                    </td>
                    <td className="py-3 text-right font-label text-xs text-slate-600">{w.pm25} &#181;g/m&#179;</td>
                    <td className="py-3 text-right">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full font-label"
                        style={{ color: aqiColor(w.aqi), backgroundColor: `${aqiColor(w.aqi)}15` }}
                      >
                        {w.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source Analysis */}
        <div className="mb-10">
          <h2 className="font-headline text-xl text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary no-print">pie_chart</span>
            Source Analysis — Worst 5 Wards
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] font-label text-slate-400 uppercase tracking-widest" style={{ borderBottom: "1px solid #c7c4d8" }}>
                  <th className="py-3 font-normal">Ward</th>
                  <th className="py-3 font-normal text-right">AQI</th>
                  <th className="py-3 font-normal">Top Source #1</th>
                  <th className="py-3 font-normal">Top Source #2</th>
                  <th className="py-3 font-normal">Top Source #3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {worstWardSources.map((ws) => (
                  <tr key={ws.ward} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-medium text-slate-700">{ws.ward}</td>
                    <td className="py-3 text-right font-label text-xs font-bold" style={{ color: aqiColor(ws.aqi) }}>{ws.aqi}</td>
                    {ws.sources.map(([src, pct], idx) => (
                      <td key={idx} className="py-3 text-xs text-slate-600">
                        {formatSourceName(src)} <span className="font-label font-bold text-slate-900">{pct}%</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weather Conditions */}
        {weather && (
          <div className="mb-10">
            <h2 className="font-headline text-xl text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary no-print">cloud</span>
              Weather Conditions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface-low">
                <p className="text-[10px] font-label text-slate-400 uppercase mb-1">Temperature</p>
                <p className="text-2xl font-label font-bold text-slate-900">{weather.temperature}&#176;C</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-low">
                <p className="text-[10px] font-label text-slate-400 uppercase mb-1">Humidity</p>
                <p className="text-2xl font-label font-bold text-slate-900">{weather.humidity}%</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-low">
                <p className="text-[10px] font-label text-slate-400 uppercase mb-1">Wind Speed</p>
                <p className="text-2xl font-label font-bold text-slate-900">{weather.wind_speed} km/h</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-low">
                <p className="text-[10px] font-label text-slate-400 uppercase mb-1">Conditions</p>
                <p className="text-2xl font-label font-bold text-slate-900 capitalize">{weather.description}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-primary/5 rounded-xl" style={{ borderLeft: "4px solid #3525cd" }}>
              <p className="text-[10px] font-label font-bold text-primary uppercase mb-2">48-Hour Forecast Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {weather.wind_speed < 5
                  ? "Low wind conditions expected to persist, leading to poor pollutant dispersal. AQI levels likely to remain elevated or worsen over the next 48 hours. Calm conditions and temperature inversions may trap pollutants near the surface."
                  : weather.wind_speed < 10
                  ? "Moderate winds expected to provide partial relief. AQI may improve slightly over 24 hours but is expected to remain in the current category. Intermittent gusts may help disperse surface-level pollutants."
                  : "Strong winds forecast to significantly improve air quality over the next 24-48 hours. Expect 15-25% AQI improvement as pollutants are dispersed. Dust resuspension may temporarily spike PM10 levels."}
                {weather.humidity > 70
                  ? " High humidity levels are contributing to secondary aerosol formation, worsening fine particulate concentrations."
                  : ""}
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-10">
          <h2 className="font-headline text-xl text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary no-print">recommend</span>
            Recommendations — GRAP Stage {grapStage}
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-surface-low">
                <span className="font-label text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center" style={{ borderTop: "2px solid #3525cd" }}>
          <p className="font-label text-[10px] text-slate-400 uppercase tracking-[0.2em]">
            Generated by AirGuard | Team AKX | India Innovates 2026
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            This report is auto-generated based on real-time monitoring data. For official correspondence, verify with the Environment Department.
          </p>
        </div>
      </section>
    </div>
  );
}
