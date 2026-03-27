"use client";

import { aqiColor, aqiCategory } from "@/lib/aqi";

export function AqiBadge({ aqi, size = "large" }: { aqi: number | null; size?: "large" | "small" }) {
  const color = aqiColor(aqi);
  const cat = aqiCategory(aqi);

  if (size === "large") {
    return (
      <div className="bg-surface-lowest p-6 rounded-xl flex flex-col items-center justify-center" style={{ borderBottom: `4px solid ${color}` }}>
        <span className="font-label text-xs text-slate-400 uppercase tracking-[0.15em]">AQI Index</span>
        <span className="font-label text-5xl font-bold mt-2" style={{ color }}>{aqi ?? "N/A"}</span>
        <span className="font-label text-[10px] font-bold uppercase mt-1" style={{ color }}>{cat}</span>
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-label uppercase"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {aqi ?? "N/A"} {cat}
    </span>
  );
}
