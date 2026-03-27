"use client";

import { useMemo } from "react";
import type { WardData } from "@/lib/types";

const BINS = [
  { lo: 0, hi: 50, label: "Good", color: "#4ade80" },
  { lo: 51, hi: 100, label: "Satisfactory", color: "#facc15" },
  { lo: 101, hi: 200, label: "Moderate", color: "#fb923c" },
  { lo: 201, hi: 300, label: "Poor", color: "#f87171" },
  { lo: 301, hi: 400, label: "Very Poor", color: "#ef4444" },
  { lo: 401, hi: 500, label: "Severe", color: "#7f1d1d" },
];

export function AqiHistogram({ wardData }: { wardData: WardData[] }) {
  const data = useMemo(() => {
    const counts = BINS.map((bin) => ({
      ...bin,
      count: wardData.filter((w) => w.aqi >= bin.lo && w.aqi <= bin.hi).length,
    }));
    const max = Math.max(...counts.map((d) => d.count), 1);
    return counts.map((d) => ({ ...d, pct: (d.count / max) * 100 }));
  }, [wardData]);

  return (
    <div>
      <div className="flex items-end gap-1 h-32 w-full">
        {data.map((bin) => (
          <div
            key={bin.label}
            className="flex-1 rounded-t group relative transition-all duration-300 hover:opacity-80"
            style={{ height: `${bin.pct}%`, backgroundColor: `${bin.color}30`, borderTop: `2px solid ${bin.color}` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold font-label hidden group-hover:block">
              {bin.count}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 pt-2" style={{ borderTop: "1px solid #e0e3e5" }}>
        {BINS.map((bin) => (
          <span key={bin.label} className="text-[10px] font-bold text-slate-400 uppercase font-label">{bin.label}</span>
        ))}
      </div>
    </div>
  );
}
