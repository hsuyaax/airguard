"use client";

import { useEffect, useState } from "react";
import { AqiBadge } from "@/components/AqiBadge";
import { AqiLegend } from "@/components/AqiLegend";
import { GrapBadge } from "@/components/GrapBadge";
import { AqiMap } from "@/components/AqiMap";
import { Aqi3DView } from "@/components/Aqi3DView";
import { ForecastChart } from "@/components/ForecastChart";
import { AqiHistogram } from "@/components/AqiHistogram";
import { getGrapStage, aqiCategory, aqiColor, healthAdvisory, formatSourceName } from "@/lib/aqi";
import { estimateSources } from "@/lib/demo-data";
import { useSettings } from "@/lib/settings-context";
import type { WardData, WardGeoJSON, Station } from "@/lib/types";

export default function CitizenDashboard() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [geoJSON, setGeoJSON] = useState<WardGeoJSON | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedWard, setSelectedWard] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("");
  const { modelTier, interpolation, modelLabel, interpolationLabel } = useSettings();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/wards?method=${interpolation}`)
      .then((r) => r.json())
      .then((data) => {
        const wards = data.wardData || data.ward_data || [];
        const geo = data.geoJSON || data.geojson || null;
        const stns = data.stations || [];
        setWardData(wards);
        setGeoJSON(geo);
        setStations(stns);
        if (wards.length > 0) setSelectedWard(wards[0].ward_name);
        // History snapshots are saved to Supabase automatically by /api/wards
        setDataSource(data.source || data.backend || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [interpolation]);

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
  const worstWard = wardData.length > 0 ? wardData.reduce((a, b) => (a.aqi > b.aqi ? a : b)) : null;
  const bestWard = wardData.length > 0 ? wardData.reduce((a, b) => (a.aqi < b.aqi ? a : b)) : null;
  const { stage: grapStage, label: grapLabel } = getGrapStage(avgAqi);

  const ward = wardData.find((w) => w.ward_name === selectedWard);
  const wardPm25 = ward?.pm25 || 100;
  const wardAqi = ward?.aqi || 0;
  const sources = estimateSources(wardPm25, wardPm25 * 1.8, 40, 15, 1.5);
  const topSources = Object.entries(sources).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Active Settings Indicator */}
      <div className="flex items-center justify-between bg-surface-low rounded-xl px-5 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">model_training</span>
            <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">Model:</span>
            <span className="font-label text-[10px] font-bold text-primary uppercase tracking-widest">{modelLabel}</span>
          </div>
          <div className="w-px h-4 bg-outline-variant" />
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">grid_on</span>
            <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">Interpolation:</span>
            <span className="font-label text-[10px] font-bold text-primary uppercase tracking-widest">{interpolationLabel}</span>
          </div>
          {dataSource && (
            <>
              <div className="w-px h-4 bg-outline-variant" />
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">{dataSource}</span>
              </div>
            </>
          )}
        </div>
        <span className="font-label text-[10px] text-slate-400">{wardData.length} wards &bull; {stations.length} stations</span>
      </div>

      {/* Summary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-up">
        {/* Delhi Average AQI */}
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <p className="font-label text-xs text-slate-500 font-semibold tracking-[0.15em] uppercase">Delhi Avg AQI</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-label font-bold" style={{ color: aqiColor(avgAqi) }}>{avgAqi}</span>
            <span className="text-sm font-label font-semibold" style={{ color: aqiColor(avgAqi) }}>{aqiCategory(avgAqi)}</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min((avgAqi / 500) * 100, 100)}%`, backgroundColor: aqiColor(avgAqi) }} />
          </div>
        </div>

        {/* Worst Ward */}
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <p className="font-label text-xs text-slate-500 font-semibold tracking-[0.15em] uppercase">Worst Ward</p>
          <p className="font-headline text-lg mt-2 text-slate-900">{worstWard?.ward_name || "N/A"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-label text-2xl font-bold text-slate-900">{worstWard?.aqi || 0}</span>
            <AqiBadge aqi={worstWard?.aqi || 0} size="small" />
          </div>
        </div>

        {/* Best Ward */}
        <div className="bg-surface-lowest p-6 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <p className="font-label text-xs text-slate-500 font-semibold tracking-[0.15em] uppercase">Best Ward</p>
          <p className="font-headline text-lg mt-2 text-slate-900">{bestWard?.ward_name || "N/A"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-label text-2xl font-bold text-slate-900">{bestWard?.aqi || 0}</span>
            <AqiBadge aqi={bestWard?.aqi || 0} size="small" />
          </div>
        </div>

        {/* GRAP */}
        <GrapBadge stage={grapStage} label={grapLabel} />
      </section>

      {/* AQI Legend */}
      <AqiLegend />

      {/* 3D Isometric Pillars — First */}
      <section className="animate-fade-up delay-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Isometric View</p>
            <h3 className="font-headline text-lg text-slate-900">3D AQI Pillars</h3>
          </div>
          <span className="font-label text-[10px] text-on-surface-variant">Height = AQI severity &bull; Hover for details</span>
        </div>
        <Aqi3DView wardData={wardData} />
      </section>

      {/* 2D Choropleth Map — Below pillars */}
      <section className="animate-fade-up delay-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Live Choropleth</p>
            <h3 className="font-headline text-lg text-slate-900">Ward-Level AQI Map</h3>
          </div>
          <div className="flex items-center gap-3 font-label text-[10px] text-on-surface-variant">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Live data</span>
            <span>{stations.length} stations</span>
          </div>
        </div>
        {geoJSON ? (
          <AqiMap wardData={wardData} geoJSON={geoJSON} stations={stations} />
        ) : (
          <div className="rounded-xl bg-surface-low flex items-center justify-center" style={{ height: 500 }}>
            <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest opacity-50 animate-pulse">Loading map...</span>
          </div>
        )}
      </section>

      {/* Bottom Data Analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-up delay-200">
        {/* Ward Selector & Details */}
        <div className="bg-surface-lowest p-8 rounded-xl flex flex-col" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex flex-col gap-1 mb-6">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Select Ward Context</label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="mt-1 block w-full bg-surface-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 px-4"
              style={{ border: "none" }}
            >
              {wardData.map((w, i) => (
                <option key={`${w.ward_no}-${i}`} value={w.ward_name}>{w.ward_name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 font-label">Ward AQI Index</p>
              <span className="text-6xl font-label font-bold text-slate-900">{wardAqi}</span>
              <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: `${aqiColor(wardAqi)}10`, border: `1px solid ${aqiColor(wardAqi)}20` }}>
                <p className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1" style={{ color: aqiColor(wardAqi) }}>
                  <span className="material-symbols-outlined text-xs">medical_services</span> Advisory
                </p>
                <p className="text-xs leading-relaxed" style={{ color: aqiColor(wardAqi) }}>{healthAdvisory(wardAqi)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 font-label">Pollutant: PM2.5</p>
                <p className="font-label text-2xl font-bold text-slate-900">{wardPm25} <span className="text-xs font-normal text-slate-400">&micro;g/m&sup3;</span></p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 font-label">Major Sources</p>
                <ul className="space-y-2">
                  {topSources.slice(0, 3).map(([src, pct]) => (
                    <li key={src} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{formatSourceName(src)}</span>
                      <span className="text-[10px] font-label font-bold text-slate-900">{pct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 48-Hour Forecast */}
        <div className="bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Trend Forecast</p>
              <h3 className="font-headline text-lg text-slate-900">48-Hour Prediction</h3>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 font-label">
                <span className="w-2 h-2 rounded-full bg-primary/30" /> Confidence
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-900 font-label">
                <span className="w-2 h-2 rounded-full bg-primary" /> PM2.5
              </div>
            </div>
          </div>
          <ForecastChart basePm25={wardPm25} />
        </div>
      </section>

      {/* City Distribution */}
      <section className="bg-surface-highest p-8 rounded-xl animate-fade-up delay-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">City Distribution</p>
            <h3 className="font-headline text-lg text-slate-900">Ward Breakdown by Category</h3>
          </div>
          <div className="font-label text-xs text-slate-500">Total Wards: {wardData.length}</div>
        </div>
        <AqiHistogram wardData={wardData} />
      </section>
    </div>
  );
}
