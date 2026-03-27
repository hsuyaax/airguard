"use client";

import { useMemo, useState, useCallback } from "react";
import type { WardData } from "@/lib/types";
import { aqiColor, aqiCategory } from "@/lib/aqi";

/*
 * Isometric pillar map of Delhi ward AQI.
 * Each ward → a 3-face extruded box (front, right, top).
 * Painted back-to-front via depth sort so overlap is correct.
 */

// ── Isometric math ──────────────────────────────────────────

const ISO_COS = Math.cos(Math.PI / 6); // 30° iso angle
const ISO_SIN = Math.sin(Math.PI / 6);

// Delhi geo bounds
const LAT_MIN = 28.40, LAT_MAX = 28.88;
const LON_MIN = 76.84, LON_MAX = 77.35;

// Projection tuning
const SCALE = 620;
const MAX_H = 140; // max pillar height in SVG units
const CELL = 5;    // half-width of pillar base

function geoToIso(lat: number, lon: number): [number, number] {
  const nx = (lon - LON_MIN) / (LON_MAX - LON_MIN);
  const ny = (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
  return [
    (nx - ny) * ISO_COS * SCALE,
    (nx + ny) * ISO_SIN * SCALE,
  ];
}

// Darken / lighten a hex colour
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

// ── Component ───────────────────────────────────────────────

export function Aqi3DView({ wardData }: { wardData: WardData[] }) {
  const [hovered, setHovered] = useState<WardData | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Filter, project, depth-sort (back-to-front = ascending iso-y)
  const pillars = useMemo(() => {
    const items = wardData
      .filter((w) => w.aqi > 0 && w.centroid_lat && w.centroid_lon)
      .map((w) => {
        const [ix, iy] = geoToIso(w.centroid_lat, w.centroid_lon);
        const h = Math.max(3, (w.aqi / 500) * MAX_H);
        return { ...w, ix, iy, h, color: aqiColor(w.aqi) };
      });
    // ascending iy = back row first
    items.sort((a, b) => a.iy - b.iy || a.ix - b.ix);
    return items;
  }, [wardData]);

  // Top-5 worst for labels
  const worst5 = useMemo(
    () => [...pillars].sort((a, b) => b.aqi - a.aqi).slice(0, 5),
    [pillars]
  );
  const worst5Set = useMemo(() => new Set(worst5.map((w) => w.ward_name)), [worst5]);

  // Viewbox derived from projected extent (add padding)
  const vb = useMemo(() => {
    if (!pillars.length) return { x: 0, y: 0, w: 800, h: 500 };
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const p of pillars) {
      xMin = Math.min(xMin, p.ix - CELL);
      xMax = Math.max(xMax, p.ix + CELL);
      yMin = Math.min(yMin, p.iy - p.h - 20);
      yMax = Math.max(yMax, p.iy + CELL);
    }
    const pad = 40;
    return {
      x: xMin - pad,
      y: yMin - pad,
      w: xMax - xMin + pad * 2,
      h: yMax - yMin + pad * 2,
    };
  }, [pillars]);

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  if (!pillars.length) {
    return (
      <div className="rounded-xl bg-surface-low flex items-center justify-center" style={{ height: 500 }}>
        <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest opacity-50">No ward data</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-surface-low" style={{ height: 520 }}>
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Ground grid */}
        <g opacity="0.35" stroke="#c7c4d8" strokeWidth="0.5" fill="none">
          {Array.from({ length: 9 }, (_, i) => {
            const t = i / 8;
            const lat = LAT_MIN + t * (LAT_MAX - LAT_MIN);
            const [x1, y1] = geoToIso(lat, LON_MIN);
            const [x2, y2] = geoToIso(lat, LON_MAX);
            return <line key={`lat${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const t = i / 8;
            const lon = LON_MIN + t * (LON_MAX - LON_MIN);
            const [x1, y1] = geoToIso(LAT_MIN, lon);
            const [x2, y2] = geoToIso(LAT_MAX, lon);
            return <line key={`lon${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>

        {/* Pillars (back → front) */}
        {pillars.map((p, i) => {
          const { ix: cx, iy: cy, h, color } = p;
          const isHovered = hovered?.ward_name === p.ward_name;
          const isLabeled = worst5Set.has(p.ward_name);
          const o = isHovered ? 1 : 0.88;

          // Three isometric faces
          // Top face (parallelogram)
          const topPts = `${cx},${cy - h - CELL * ISO_SIN} ${cx + CELL * ISO_COS},${cy - h} ${cx},${cy - h + CELL * ISO_SIN} ${cx - CELL * ISO_COS},${cy - h}`;
          // Front-left face
          const frontPts = `${cx - CELL * ISO_COS},${cy} ${cx},${cy + CELL * ISO_SIN} ${cx},${cy - h + CELL * ISO_SIN} ${cx - CELL * ISO_COS},${cy - h}`;
          // Front-right face
          const rightPts = `${cx},${cy + CELL * ISO_SIN} ${cx + CELL * ISO_COS},${cy} ${cx + CELL * ISO_COS},${cy - h} ${cx},${cy - h + CELL * ISO_SIN}`;

          return (
            <g
              key={i}
              opacity={o}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Left face — base colour */}
              <polygon points={frontPts} fill={color} />
              {/* Right face — darker */}
              <polygon points={rightPts} fill={shade(color, -35)} />
              {/* Top face — lighter */}
              <polygon points={topPts} fill={shade(color, 50)} />

              {/* Hover highlight ring on top face */}
              {isHovered && (
                <polygon points={topPts} fill="none" stroke="#3525cd" strokeWidth="1.2" />
              )}

              {/* Label for worst 5 */}
              {isLabeled && (
                <g>
                  <line
                    x1={cx}
                    y1={cy - h - CELL * ISO_SIN}
                    x2={cx}
                    y2={cy - h - CELL * ISO_SIN - 12}
                    stroke={color}
                    strokeWidth="0.6"
                  />
                  <rect
                    x={cx - 16}
                    y={cy - h - CELL * ISO_SIN - 24}
                    width="32"
                    height="13"
                    rx="2"
                    fill="white"
                    fillOpacity="0.92"
                  />
                  <text
                    x={cx}
                    y={cy - h - CELL * ISO_SIN - 15}
                    textAnchor="middle"
                    fill={color}
                    fontSize="8"
                    fontWeight="700"
                    fontFamily="Space Grotesk, monospace"
                  >
                    {p.aqi}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip (HTML, positioned by mouse) */}
      {hovered && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: Math.min(mouse.x + 16, (typeof window !== "undefined" ? window.innerWidth * 0.6 : 500)),
            top: Math.max(mouse.y - 80, 8),
            transition: "left 0.08s, top 0.08s",
          }}
        >
          <div
            className="bg-surface-lowest rounded-lg px-4 py-3"
            style={{ boxShadow: "0 6px 20px rgba(25,28,30,0.12)", border: "1px solid #eceef0", minWidth: 150 }}
          >
            <p className="font-label text-[10px] text-primary uppercase tracking-[0.12em]">{hovered.ward_name}</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-label text-xl font-bold" style={{ color: aqiColor(hovered.aqi) }}>{hovered.aqi}</span>
              <span className="text-[11px] text-on-surface-variant">{aqiCategory(hovered.aqi)}</span>
            </div>
            <p className="font-label text-[10px] text-on-surface-variant mt-1">PM2.5: {hovered.pm25} &micro;g/m&sup3;</p>
          </div>
        </div>
      )}

      {/* Legend — bottom-right */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2.5 bg-surface-lowest/90 rounded px-3 py-1.5" style={{ backdropFilter: "blur(6px)" }}>
        {[
          { l: "Good", c: "#009966" },
          { l: "Moderate", c: "#ffde33" },
          { l: "Poor", c: "#ff9933" },
          { l: "V.Poor", c: "#cc0033" },
          { l: "Severe", c: "#7e0023" },
        ].map((x) => (
          <span key={x.l} className="flex items-center gap-1">
            <span className="block w-[7px] h-[7px] rounded-[1px]" style={{ background: x.c }} />
            <span className="font-label text-[8px] text-on-surface-variant tracking-wide">{x.l}</span>
          </span>
        ))}
      </div>

      {/* Ward count — top-left */}
      <div className="absolute top-3 left-4">
        <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.15em]">{pillars.length} wards &middot; height = AQI</span>
      </div>
    </div>
  );
}
