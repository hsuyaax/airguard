"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useSettings } from "@/lib/settings-context";
import type { ForecastPoint } from "@/lib/types";

export function ForecastChart({ basePm25 }: { basePm25: number }) {
  const [data, setData] = useState<ForecastPoint[]>([]);
  const [modelUsed, setModelUsed] = useState("");
  const { modelTier } = useSettings();

  useEffect(() => {
    fetch(`/api/forecast?pm25=${basePm25}&hours=48&tier=${modelTier}`)
      .then((r) => r.json())
      .then((res) => {
        const arr = Array.isArray(res) ? res : (res.forecast || []);
        setData(arr);
        setModelUsed(res.model_used || modelTier);
      })
      .catch(() => {});
  }, [basePm25, modelTier]);

  if (!data.length) {
    return <div className="h-[220px] flex items-center justify-center text-slate-400 font-label text-xs uppercase tracking-widest">Loading forecast...</div>;
  }

  const chartData = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", hour12: true }),
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="pmGradLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3525cd" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3525cd" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ea" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={5} stroke="#c7c4d8" />
          <YAxis tick={{ fontSize: 10 }} domain={[0, "auto"]} stroke="#c7c4d8" />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e6e8ea", borderRadius: "8px", fontSize: "12px", fontFamily: "Space Grotesk, monospace", boxShadow: "0 20px 40px rgba(25,28,30,0.06)" }}
            labelStyle={{ color: "#464555" }}
          />
          <ReferenceLine y={60} stroke="#4ade80" strokeDasharray="5 5" />
          <ReferenceLine y={90} stroke="#facc15" strokeDasharray="5 5" />
          <ReferenceLine y={120} stroke="#fb923c" strokeDasharray="5 5" />
          <Area type="monotone" dataKey="pm25_upper" stroke="none" fill="rgba(53,37,205,0.06)" />
          <Area type="monotone" dataKey="pm25_lower" stroke="none" fill="#ffffff" />
          <Area type="monotone" dataKey="pm25_predicted" stroke="#3525cd" strokeWidth={2} fill="url(#pmGradLight)" dot={false} activeDot={{ r: 4, fill: "#3525cd" }} />
        </AreaChart>
      </ResponsiveContainer>
      {modelUsed && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="material-symbols-outlined text-xs text-slate-400">info</span>
          <span className="font-label text-[9px] text-slate-400 uppercase tracking-widest">
            Model: {modelUsed === "ts_linear" ? "Linear Extrapolation" : modelUsed === "prophet" ? "Prophet" : modelUsed === "lstm" ? "LSTM Neural Net" : modelUsed}
          </span>
        </div>
      )}
    </div>
  );
}
