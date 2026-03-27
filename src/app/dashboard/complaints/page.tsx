"use client";

import { useEffect, useState } from "react";
import { SOURCE_TYPES } from "@/lib/config";
import { formatSourceName, aqiColor } from "@/lib/aqi";
import type { WardData } from "@/lib/types";

interface Complaint {
  id: string;
  ward_name: string;
  pollution_type: string;
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: string;
}

const STORAGE_KEY = "airguard_complaints";

function loadComplaints(): Complaint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveComplaints(complaints: Complaint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

const SEVERITY_CONFIG = {
  low: { label: "Low", color: "#009966", bg: "#00996615" },
  medium: { label: "Medium", color: "#ff9933", bg: "#ff993315" },
  high: { label: "High", color: "#cc0033", bg: "#cc003315" },
} as const;

export default function ComplaintsPage() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedWard, setSelectedWard] = useState("");
  const [pollutionType, setPollutionType] = useState<string>(SOURCE_TYPES[0]);
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/wards")
      .then((r) => r.json())
      .then((data) => {
        const wards = data.wardData || data.ward_data || [];
        setWardData(wards);
        if (wards.length > 0) setSelectedWard(wards[0].ward_name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setComplaints(loadComplaints());
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

  const handleSubmit = () => {
    if (!selectedWard || !description.trim()) return;

    const newComplaint: Complaint = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ward_name: selectedWard,
      pollution_type: pollutionType,
      severity,
      description: description.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [newComplaint, ...complaints];
    setComplaints(updated);
    saveComplaints(updated);
    setDescription("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // Count complaints per source type
  const sourceCounts: Record<string, number> = {};
  for (const c of complaints) {
    sourceCounts[c.pollution_type] = (sourceCounts[c.pollution_type] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(sourceCounts), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="animate-fade-up">
        <div className="flex flex-col gap-1 mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Community Engagement</p>
          <h2 className="font-headline text-2xl text-slate-900">Citizen Complaint Portal</h2>
        </div>
        <p className="text-sm text-on-surface-variant">Help MCD identify and address pollution sources across Delhi. Your reports contribute to targeted enforcement action.</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-up delay-100">
        {/* Left: Submit Report */}
        <div className="bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <h3 className="font-headline text-xl text-slate-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Submit Report
          </h3>

          <div className="space-y-6">
            {/* Ward Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full bg-surface-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 px-4"
                style={{ border: "none" }}
              >
                {wardData.map((w, i) => (
                  <option key={`${w.ward_no}-${i}`} value={w.ward_name}>{w.ward_name}</option>
                ))}
              </select>
            </div>

            {/* Pollution Type */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Pollution Source</label>
              <select
                value={pollutionType}
                onChange={(e) => setPollutionType(e.target.value)}
                className="w-full bg-surface-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 px-4"
                style={{ border: "none" }}
              >
                {SOURCE_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Severity</label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-2.5 text-xs rounded-xl capitalize transition-all ${
                      severity === s ? "font-bold" : "font-medium text-slate-400"
                    }`}
                    style={
                      severity === s
                        ? { border: `2px solid ${SEVERITY_CONFIG[s].color}`, color: SEVERITY_CONFIG[s].color, backgroundColor: SEVERITY_CONFIG[s].bg }
                        : { border: "1px solid #c7c4d8" }
                    }
                  >
                    {SEVERITY_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the pollution issue, location details, and approximate time..."
                rows={4}
                className="w-full bg-surface-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 px-4 resize-none"
                style={{ border: "none" }}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!description.trim()}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Submit Report
            </button>

            {/* Success message */}
            {submitted && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm" style={{ border: "1px solid rgba(22,163,74,0.2)" }}>
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Report submitted successfully. Thank you for contributing to cleaner air.
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Reports */}
        <div className="bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <h3 className="font-headline text-xl text-slate-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Recent Reports
          </h3>

          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">campaign</span>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                No complaints filed yet. Submit the first report to help MCD identify pollution hotspots.
              </p>
            </div>
          ) : (
            <>
              {/* Complaint List */}
              <div className="space-y-3 mb-8 max-h-80 overflow-y-auto">
                {complaints.slice(0, 20).map((c) => {
                  const sev = SEVERITY_CONFIG[c.severity];
                  const time = new Date(c.timestamp);
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-surface-low hover:bg-surface-high/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{c.ward_name}</p>
                          <p className="text-[10px] font-label text-slate-400">
                            {formatSourceName(c.pollution_type)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full capitalize"
                            style={{ color: sev.color, backgroundColor: sev.bg }}
                          >
                            {sev.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                      <p className="text-[10px] font-label text-slate-300 mt-2">
                        {time.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at{" "}
                        {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Source Type Distribution */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label mb-3">
                  Reports by Source Type
                </p>
                <div className="space-y-2">
                  {Object.entries(sourceCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <div key={source} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-28 truncate flex-shrink-0">
                          {formatSourceName(source)}
                        </span>
                        <div className="flex-1 h-2 bg-surface-high rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                              backgroundColor: "#3525cd",
                              opacity: 0.6 + (count / maxCount) * 0.4,
                            }}
                          />
                        </div>
                        <span className="font-label text-[10px] font-bold text-slate-500 w-6 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
