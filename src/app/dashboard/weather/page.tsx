"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MetricCard } from "@/components/MetricCard";
import { WindRoseChart } from "@/components/WindRoseChart";
import { SAFAR_SOURCES } from "@/lib/demo-data";
import type { WeatherData } from "@/lib/types";

const SAFAR_COLORS = ["#3525cd", "#818cf8", "#c7d2fe", "#e2e8f0"];

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch("/api/weather").then((r) => r.json()).then(setWeather).catch(() => {});
  }, []);

  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const windDir = weather?.wind_direction || 0;
  const dirName = directions[Math.floor(((windDir + 22.5) % 360) / 45)];

  const safarData = Object.entries(SAFAR_SOURCES).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="mb-4 animate-fade-up">
        <h2 className="font-headline text-4xl text-on-surface mb-2">Meteorological &amp; Satellite Context</h2>
        <p className="text-on-surface-variant font-medium text-sm tracking-tight">Real-time remote sensing integration for the National Capital Territory.</p>
      </header>

      {/* Weather Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-fade-up">
        <MetricCard label="Live Temp" value={`${weather?.temperature ?? "N/A"}`} subtitle="Feels like 31&deg;C" icon="device_thermostat" />
        <MetricCard label="Humidity" value={`${weather?.humidity ?? "N/A"}%`} subtitle="Low evaporation" icon="humidity_percentage" />
        <MetricCard label="Wind Spd" value={`${weather?.wind_speed ?? "N/A"} km/h`} subtitle="Moderate breeze" icon="air" />
        <div className="bg-surface-lowest p-6 rounded-xl group hover:bg-surface-low transition-colors duration-300" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-primary">explore</span>
            <span className="font-label text-[10px] text-slate-400 tracking-widest uppercase">Direction</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-label text-4xl font-bold text-primary">{dirName}</span>
            <span className="material-symbols-outlined text-primary -rotate-45">navigation</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">North-Westerly</p>
        </div>
        <MetricCard label="Sky Cond" value={(weather?.description ?? "N/A").replace(/\b\w/g, (c) => c.toUpperCase())} subtitle="Visual range: 3.2km" icon="cloud" />
      </section>

      {/* Wind Rose + Satellite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-fade-up delay-100">
        <section className="lg:col-span-5 bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-headline text-xl mb-1">Wind Rose Distribution</h3>
              <p className="text-xs text-slate-500 font-medium">Frequency from 8 cardinal directions</p>
            </div>
            <span className="material-symbols-outlined text-slate-300">info</span>
          </div>
          <WindRoseChart />
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-surface-low p-3 rounded-lg text-center">
              <p className="text-[10px] uppercase font-label text-slate-400 mb-1">Peak Gust</p>
              <p className="font-label font-bold text-lg">24.1 km/h</p>
            </div>
            <div className="bg-surface-low p-3 rounded-lg text-center">
              <p className="text-[10px] uppercase font-label text-slate-400 mb-1">Calm State</p>
              <p className="font-label font-bold text-lg">8.2%</p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 space-y-6">
          <div className="bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl">Satellite Remote Sensing</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-label text-[10px] text-slate-500">MODIS AQUA ACTIVE</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { label: "Avg AOD", value: "0.68", sub: "+12% vs yesterday", subColor: "#ba1a1a" },
                { label: "Dust Pixels", value: "1,402", sub: "NWP Incursion", subColor: undefined },
                { label: "Hotspots", value: "142", sub: "Open fire detections", subColor: undefined },
              ].map((m) => (
                <div key={m.label} className="pl-4" style={{ borderLeft: "2px solid #3525cd" }}>
                  <p className="text-[10px] uppercase font-label text-slate-400">{m.label}</p>
                  <p className="font-label text-2xl font-bold">{m.value}</p>
                  <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: m.subColor || "#64748b" }}>
                    {m.subColor && <span className="material-symbols-outlined text-[12px]">trending_up</span>}
                    {m.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Scatter plot mock */}
            <div className="h-48 relative bg-surface-low/30 rounded-lg p-6 flex items-end justify-between overflow-hidden">
              <div className="absolute top-4 left-4 font-label text-[10px] font-bold text-slate-400">SATELLITE AOD VS GROUND PM2.5</div>
              <div className="absolute bottom-2 right-4 font-label text-[8px] text-slate-400">PM2.5 Conc.</div>
              <div className="absolute top-1/2 left-2 -rotate-90 font-label text-[8px] text-slate-400">AOD Index</div>
              {[{l:10,b:20},{l:20,b:25},{l:35,b:45},{l:50,b:55},{l:65,b:75},{l:80,b:85}].map((p,i) => (
                <div key={i} className="absolute w-2 h-2 bg-primary/40 rounded-full" style={{ left: `${p.l}%`, bottom: `${p.b}%` }} />
              ))}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <line x1="5" y1="90" x2="95" y2="10" stroke="#3525cd" strokeWidth="0.5" strokeDasharray="2,2" />
              </svg>
              <div className="absolute top-10 right-4 bg-white/80 p-2 rounded" style={{ backdropFilter: "blur(8px)", border: "1px solid #eceef0" }}>
                <p className="font-label text-[10px] text-primary font-bold">R&sup2; = 0.84</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SAFAR Sources */}
      <section className="bg-surface-lowest p-8 rounded-xl animate-fade-up delay-200" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h4 className="font-headline text-xl mb-2">Source Apportionment Reference</h4>
            <p className="text-xs text-slate-500 font-medium mb-4">IITM SAFAR - Seasonal Benchmark Analysis</p>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6 max-w-xl">
              Official chemical mass balance and positive matrix factorization data from the Indian Institute of Tropical Meteorology.
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {safarData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SAFAR_COLORS[i % SAFAR_COLORS.length] }} />
                  <span className="font-label text-xs">{entry.name}: {entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-64 h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={safarData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {safarData.map((_, i) => (<Cell key={i} fill={SAFAR_COLORS[i % SAFAR_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e6e8ea", borderRadius: "8px", fontSize: "12px", fontFamily: "Space Grotesk" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-label text-lg font-bold text-on-surface">PM2.5</span>
              <span className="font-label text-[10px] text-slate-400">BREAKDOWN</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
