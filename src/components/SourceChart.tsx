"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatSourceName } from "@/lib/aqi";
import type { SourceBreakdown } from "@/lib/types";

const COLORS = ["#3525cd", "#58579b", "#a44100", "#93000a", "#009966", "#facc15", "#c7c4d8", "#777587"];

export function SourcePieChart({ sources }: { sources: SourceBreakdown }) {
  const data = Object.entries(sources)
    .map(([name, value]) => ({ name: formatSourceName(name), value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e6e8ea", borderRadius: "8px", fontSize: "12px", fontFamily: "Space Grotesk, monospace" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 w-full">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-xs">{entry.name} ({entry.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceBarChart({ sources }: { sources: SourceBreakdown }) {
  const data = Object.entries(sources)
    .map(([name, value]) => ({ name: formatSourceName(name), value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      {data.map((entry, i) => (
        <div key={entry.name} className="space-y-1">
          <div className="flex justify-between text-xs font-label uppercase tracking-tight">
            <span>{entry.name}</span>
            <span className="font-bold">{entry.value}%</span>
          </div>
          <div className="h-2 w-full bg-surface-container overflow-hidden">
            <div className="h-full transition-all duration-500" style={{ width: `${entry.value}%`, backgroundColor: COLORS[i % COLORS.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
