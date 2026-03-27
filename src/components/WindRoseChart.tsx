"use client";

import { getWindRoseData } from "@/lib/demo-data";

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function WindRoseChart() {
  const data = getWindRoseData();
  const maxVal = Math.max(...Object.values(data));

  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative w-[260px] h-[260px]">
        {/* Concentric circles */}
        {[1, 0.75, 0.5, 0.25].map((r) => (
          <div
            key={r}
            className="absolute rounded-full"
            style={{
              width: `${r * 240}px`, height: `${r * 240}px`,
              top: `${130 - (r * 240) / 2}px`, left: `${130 - (r * 240) / 2}px`,
              border: "1px solid #eceef0",
            }}
          />
        ))}
        {/* Axes */}
        <div className="absolute w-px h-full bg-surface-container left-1/2" />
        <div className="absolute h-px w-full bg-surface-container top-1/2" />
        {/* Direction labels */}
        {DIRECTIONS.map((dir, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const x = 130 + Math.cos(angle) * 125;
          const y = 130 + Math.sin(angle) * 125;
          return (
            <div key={dir} className="absolute font-label text-[10px] font-bold text-slate-400" style={{ left: `${x - 6}px`, top: `${y - 7}px` }}>
              {dir}
            </div>
          );
        })}
        {/* Petals via SVG */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
          {DIRECTIONS.map((dir, i) => {
            const val = data[dir] || 0;
            const len = (val / maxVal) * 35;
            const angle = i * 45;
            const rad = (angle * Math.PI) / 180;
            const rad2 = ((angle + 15) * Math.PI) / 180;
            const rad3 = ((angle - 15) * Math.PI) / 180;
            const x1 = 50 + Math.cos(rad) * len;
            const y1 = 50 + Math.sin(rad) * len;
            const x2 = 50 + Math.cos(rad2) * (len * 0.5);
            const y2 = 50 + Math.sin(rad2) * (len * 0.5);
            const x3 = 50 + Math.cos(rad3) * (len * 0.5);
            const y3 = 50 + Math.sin(rad3) * (len * 0.5);
            const opacity = 0.15 + (val / maxVal) * 0.4;
            return (
              <path
                key={dir}
                d={`M 50 50 L ${x2} ${y2} L ${x1} ${y1} L ${x3} ${y3} Z`}
                fill={`rgba(53, 37, 205, ${opacity})`}
                className="hover:fill-primary/60 transition-all"
              />
            );
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg" style={{ border: "1px solid #eceef0" }}>
            <span className="font-label text-sm font-bold text-primary">NW: {data["NW"]}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
