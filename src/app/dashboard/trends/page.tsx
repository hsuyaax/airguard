"use client";

import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from "recharts";
import { getHistory, getCityTrend, getWardTrend, type AQISnapshot } from "@/lib/history";
import { aqiColor } from "@/lib/aqi";
import type { WardData } from "@/lib/types";

export default function TrendsPage() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [history, setHistory] = useState<AQISnapshot[]>([]);
  const [selectedWard1, setSelectedWard1] = useState("");
  const [selectedWard2, setSelectedWard2] = useState("");
  const [timeRange, setTimeRange] = useState<24 | 72 | 168>(168); // hours

  useEffect(() => {
    fetch("/api/wards").then((r) => r.json()).then((data) => {
      const wards = data.wardData || data.ward_data || [];
      setWardData(wards);
      if (wards.length > 0) {
        setSelectedWard1(wards[0]?.ward_name || "");
        if (wards.length > 1) setSelectedWard2(wards[Math.min(5, wards.length - 1)]?.ward_name || "");
      }
    }).catch(() => {});
    setHistory(getHistory());
  }, []);

  const cityTrend = useMemo(() => getCityTrend(timeRange), [timeRange, history]);
  const ward1Trend = useMemo(() => getWardTrend(selectedWard1, timeRange), [selectedWard1, timeRange, history]);
  const ward2Trend = useMemo(() => getWardTrend(selectedWard2, timeRange), [selectedWard2, timeRange, history]);

  // Current ward AQI distribution for the bar chart
  const categoryDistribution = useMemo(() => {
    const bins = [
      { label: "Good", lo: 0, hi: 50, count: 0, color: "#4ade80" },
      { label: "Satisfactory", lo: 51, hi: 100, count: 0, color: "#facc15" },
      { label: "Moderate", lo: 101, hi: 200, count: 0, color: "#fb923c" },
      { label: "Poor", lo: 201, hi: 300, count: 0, color: "#f87171" },
      { label: "Very Poor", lo: 301, hi: 400, count: 0, color: "#ef4444" },
      { label: "Severe", lo: 401, hi: 500, count: 0, color: "#7f1d1d" },
    ];
    wardData.forEach((w) => {
      const bin = bins.find((b) => w.aqi >= b.lo && w.aqi <= b.hi);
      if (bin) bin.count++;
    });
    return bins;
  }, [wardData]);

  const hasHistory = history.length > 2;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-headline text-4xl font-bold">Trends &amp; Historical Analysis</h2>
          <p className="text-on-surface-variant text-sm mt-2">Track air quality trends over time. History accumulates as you use the dashboard.</p>
        </div>
        <div className="flex gap-2">
          {([24, 72, 168] as const).map((h) => (
            <button
              key={h}
              onClick={() => setTimeRange(h)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === h ? "bg-primary text-white" : "bg-surface-low text-slate-500 hover:bg-surface-high"}`}
            >
              {h === 24 ? "24h" : h === 72 ? "3 Days" : "7 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Data accumulation notice */}
      {!hasHistory && (
        <div className="bg-primary/5 p-6 rounded-xl" style={{ border: "1px dashed rgba(53,37,205,0.2)" }}>
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-primary mt-1">info</span>
            <div>
              <h4 className="font-bold text-primary text-sm">History is accumulating</h4>
              <p className="text-sm text-on-surface-variant mt-1">
                Every time you visit the dashboard, a snapshot is saved. Over hours and days, trend lines will appear here showing how Delhi&apos;s air quality changes over time. Keep the dashboard open or visit regularly to build history.
              </p>
              <p className="text-xs text-slate-500 mt-2 font-label">{history.length} snapshots recorded so far</p>
            </div>
          </div>
        </div>
      )}

      {/* City-Wide Trend */}
      <section className="bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label">Delhi-Wide Trend</p>
            <h3 className="font-headline text-xl">Average AQI Over Time</h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-label text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Avg AQI</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Severe Wards</span>
          </div>
        </div>
        {cityTrend.length > 2 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cityTrend.map((d) => ({ ...d, time: new Date(d.timestamp).toLocaleString("en-IN", { day: "2-digit", hour: "2-digit", minute: "2-digit" }) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ea" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={Math.max(1, Math.floor(cityTrend.length / 8))} stroke="#c7c4d8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#c7c4d8" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e6e8ea", borderRadius: "8px", fontSize: "12px", fontFamily: "Space Grotesk" }} />
              <ReferenceLine y={200} stroke="#facc15" strokeDasharray="5 5" label={{ value: "GRAP I", fontSize: 10, fill: "#facc15" }} />
              <ReferenceLine y={300} stroke="#fb923c" strokeDasharray="5 5" label={{ value: "GRAP II", fontSize: 10, fill: "#fb923c" }} />
              <ReferenceLine y={400} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "GRAP III", fontSize: 10, fill: "#ef4444" }} />
              <Line type="monotone" dataKey="avgAqi" stroke="#3525cd" strokeWidth={2} dot={false} name="Avg AQI" />
              <Line type="monotone" dataKey="severeCount" stroke="#ba1a1a" strokeWidth={1.5} dot={false} name="Severe Wards" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-300 font-label text-sm uppercase tracking-widest">
            Trend data will appear as history accumulates
          </div>
        )}
      </section>

      {/* Ward Comparison */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label">Ward Comparison</p>
              <h3 className="font-headline text-xl">Side-by-Side AQI Trends</h3>
            </div>
          </div>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-[10px] font-label text-slate-400 uppercase tracking-widest block mb-1">Ward A (Indigo)</label>
              <select value={selectedWard1} onChange={(e) => setSelectedWard1(e.target.value)} className="w-full bg-surface-low rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary/30" style={{ border: "none" }}>
                {wardData.map((w, i) => <option key={`a-${w.ward_no}-${i}`} value={w.ward_name}>{w.ward_name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-label text-slate-400 uppercase tracking-widest block mb-1">Ward B (Orange)</label>
              <select value={selectedWard2} onChange={(e) => setSelectedWard2(e.target.value)} className="w-full bg-surface-low rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary/30" style={{ border: "none" }}>
                {wardData.map((w, i) => <option key={`b-${w.ward_no}-${i}`} value={w.ward_name}>{w.ward_name}</option>)}
              </select>
            </div>
          </div>
          {ward1Trend.length > 2 || ward2Trend.length > 2 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ea" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} stroke="#c7c4d8" tickFormatter={(v) => new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit" })} />
                <YAxis tick={{ fontSize: 10 }} stroke="#c7c4d8" />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e6e8ea", borderRadius: "8px", fontSize: "12px" }} />
                {ward1Trend.length > 0 && <Line data={ward1Trend} type="monotone" dataKey="aqi" stroke="#3525cd" strokeWidth={2} dot={false} name={selectedWard1} />}
                {ward2Trend.length > 0 && <Line data={ward2Trend} type="monotone" dataKey="aqi" stroke="#fb923c" strokeWidth={2} dot={false} name={selectedWard2} />}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-300 font-label text-sm uppercase tracking-widest">
              Ward trend data accumulating...
            </div>
          )}
        </div>

        {/* Current Distribution */}
        <div className="lg:col-span-4 bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label mb-1">Current Snapshot</p>
          <h3 className="font-headline text-xl mb-6">Ward Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryDistribution} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#c7c4d8" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={80} stroke="#c7c4d8" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e6e8ea", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {categoryDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e6e8ea" }}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Wards</span>
              <span className="font-label font-bold">{wardData.length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-500">Snapshots Recorded</span>
              <span className="font-label font-bold">{history.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Movers */}
      {wardData.length > 0 && (
        <section className="bg-surface-highest p-8 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label mb-1">Current Reading</p>
          <h3 className="font-headline text-xl mb-6">Most Polluted Wards Right Now</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...wardData]
              .sort((a, b) => b.aqi - a.aqi)
              .slice(0, 5)
              .map((w, i) => (
                <div key={`top-${i}`} className="bg-white p-5 rounded-xl" style={{ borderLeft: `4px solid ${aqiColor(w.aqi)}` }}>
                  <div className="flex justify-between items-start">
                    <span className="font-label text-[10px] text-slate-400">#{i + 1}</span>
                    <span className="font-label text-2xl font-bold" style={{ color: aqiColor(w.aqi) }}>{w.aqi}</span>
                  </div>
                  <p className="font-headline text-sm font-bold mt-2">{w.ward_name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">PM2.5: {w.pm25} &micro;g/m&sup3;</p>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
