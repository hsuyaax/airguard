"use client";

import { useEffect, useState, useRef } from "react";
import { SOURCE_TYPES } from "@/lib/config";
import { formatSourceName } from "@/lib/aqi";
import type { WardData } from "@/lib/types";

interface Complaint {
  id: string;
  ward_name: string;
  pollution_type: string;
  severity: "low" | "medium" | "high";
  description: string;
  photo?: string; // base64 data URL
  latitude?: number;
  longitude?: number;
  location_text?: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  timestamp: string;
}

const STORAGE_KEY = "airguard_complaints";

function loadComplaints(): Complaint[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveComplaints(c: Complaint[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

const SEV = {
  low: { label: "Low", color: "#009966", bg: "#00996612" },
  medium: { label: "Medium", color: "#ff9933", bg: "#ff993312" },
  high: { label: "High", color: "#cc0033", bg: "#cc003312" },
} as const;

const STATUS = {
  pending: { label: "Pending", color: "#ff9933", icon: "schedule" },
  investigating: { label: "Investigating", color: "#3525cd", icon: "search" },
  resolved: { label: "Resolved", color: "#009966", icon: "check_circle" },
  dismissed: { label: "Dismissed", color: "#777587", icon: "cancel" },
} as const;

export default function ComplaintsPage() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWard, setSelectedWard] = useState("");
  const [pollutionType, setPollutionType] = useState<string>(SOURCE_TYPES[0]);
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/wards").then((r) => r.json()).then((data) => {
      const wards = data.wardData || data.ward_data || [];
      setWardData(wards);
      if (wards.length > 0) setSelectedWard(wards[0].ward_name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { setComplaints(loadComplaints()); }, []);

  // Get GPS location
  const getLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle photo
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedWard || !description.trim()) return;

    const newComplaint: Complaint = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ward_name: selectedWard,
      pollution_type: pollutionType,
      severity,
      description: description.trim(),
      photo: photo || undefined,
      latitude: gpsLocation?.lat,
      longitude: gpsLocation?.lon,
      location_text: gpsLocation ? `${gpsLocation.lat.toFixed(5)}, ${gpsLocation.lon.toFixed(5)}` : undefined,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    // Save locally
    const updated = [newComplaint, ...complaints];
    setComplaints(updated);
    saveComplaints(updated);

    // Also try Supabase
    try {
      await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ward_name: selectedWard,
          pollution_type: pollutionType,
          severity,
          description: description.trim(),
        }),
      });
    } catch { /* Supabase optional */ }

    setDescription("");
    setPhoto(null);
    setGpsLocation(null);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const filteredComplaints = filterStatus === "all" ? complaints : complaints.filter((c) => c.status === filterStatus);

  const sourceCounts: Record<string, number> = {};
  for (const c of complaints) { sourceCounts[c.pollution_type] = (sourceCounts[c.pollution_type] || 0) + 1; }
  const maxCount = Math.max(...Object.values(sourceCounts), 1);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Community Engagement</p>
        <h2 className="font-headline text-2xl text-slate-900 mt-1">Citizen Complaint Portal</h2>
        <p className="text-sm text-on-surface-variant mt-2">Report pollution with photo evidence and GPS location. Your reports enable targeted MCD enforcement.</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Submit Form */}
        <div className="lg:col-span-5 bg-surface-lowest p-8 rounded-xl" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
          <h3 className="font-headline text-xl text-slate-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Submit Report
          </h3>

          <div className="space-y-5">
            {/* Ward */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Ward</label>
              <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} className="w-full bg-surface-low rounded-xl text-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20" style={{ border: "none" }}>
                {wardData.map((w, i) => <option key={`${w.ward_no}-${i}`} value={w.ward_name}>{w.ward_name}</option>)}
              </select>
            </div>

            {/* Pollution Type */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Pollution Source</label>
              <select value={pollutionType} onChange={(e) => setPollutionType(e.target.value)} className="w-full bg-surface-low rounded-xl text-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20" style={{ border: "none" }}>
                {SOURCE_TYPES.map((st) => <option key={st} value={st}>{formatSourceName(st)}</option>)}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Severity</label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((s) => (
                  <button key={s} onClick={() => setSeverity(s)} className={`flex-1 py-2.5 text-xs rounded-xl capitalize transition-all ${severity === s ? "font-bold" : "font-medium text-slate-400"}`} style={severity === s ? { border: `2px solid ${SEV[s].color}`, color: SEV[s].color, backgroundColor: SEV[s].bg } : { border: "1px solid #c7c4d8" }}>
                    {SEV[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Photo Evidence (Optional)</label>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
              {photo ? (
                <div className="relative">
                  <img src={photo} alt="Evidence" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => { setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white transition-all" style={{ backdropFilter: "blur(8px)" }}>
                    <span className="material-symbols-outlined text-sm text-slate-600">close</span>
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1" style={{ backdropFilter: "blur(8px)" }}>
                    <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
                    <span className="text-[10px] font-label text-emerald-700">Photo attached</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 rounded-xl bg-surface-low hover:bg-surface-high transition-colors flex flex-col items-center gap-2 cursor-pointer" style={{ border: "2px dashed #c7c4d8" }}>
                  <span className="material-symbols-outlined text-2xl text-slate-400">add_a_photo</span>
                  <span className="text-xs text-slate-400">Tap to take photo or upload</span>
                  <span className="text-[10px] text-slate-300">JPG, PNG up to 5MB</span>
                </button>
              )}
            </div>

            {/* GPS Location */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">GPS Location (Optional)</label>
              {gpsLocation ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50" style={{ border: "1px solid rgba(22,163,74,0.2)" }}>
                  <span className="material-symbols-outlined text-emerald-600 text-sm">my_location</span>
                  <span className="text-xs text-emerald-700 font-label">{gpsLocation.lat.toFixed(5)}, {gpsLocation.lon.toFixed(5)}</span>
                  <button onClick={() => setGpsLocation(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <button onClick={getLocation} disabled={gpsLoading} className="w-full py-3 rounded-xl bg-surface-low hover:bg-surface-high transition-colors flex items-center justify-center gap-2 text-sm text-slate-500 disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">{gpsLoading ? "hourglass_top" : "my_location"}</span>
                  {gpsLoading ? "Getting location..." : "Pin my location"}
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label block mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you see — type of pollution, approximate location, time of day..." rows={3} className="w-full bg-surface-low rounded-xl text-sm py-3 px-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" style={{ border: "none" }} />
            </div>

            <button onClick={handleSubmit} disabled={!description.trim()} className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined text-sm">send</span>
              Submit Report {photo ? "with Photo" : ""}
            </button>

            {submitted && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm" style={{ border: "1px solid rgba(22,163,74,0.2)" }}>
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Report submitted successfully. MCD will investigate.
              </div>
            )}
          </div>
        </div>

        {/* Right: Reports List */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {(["all", "pending", "investigating", "resolved"] as const).map((s) => {
              const count = s === "all" ? complaints.length : complaints.filter((c) => c.status === s).length;
              const isActive = filterStatus === s;
              return (
                <button key={s} onClick={() => setFilterStatus(s)} className={`p-3 rounded-xl text-center transition-all ${isActive ? "bg-surface-lowest" : "bg-surface-low hover:bg-surface-high"}`} style={isActive ? { border: "1px solid rgba(53,37,205,0.2)" } : undefined}>
                  <span className="font-label text-xl font-bold block">{count}</span>
                  <span className="text-[10px] font-label text-slate-400 uppercase tracking-widest capitalize">{s}</span>
                </button>
              );
            })}
          </div>

          {/* Reports */}
          <div className="bg-surface-lowest rounded-xl p-6" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
            <h3 className="font-headline text-lg text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Reports ({filteredComplaints.length})
            </h3>

            {filteredComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">campaign</span>
                <p className="text-sm text-slate-400 max-w-xs">No reports {filterStatus !== "all" ? `with status "${filterStatus}"` : "yet"}. Submit the first report to help MCD identify pollution hotspots.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredComplaints.slice(0, 30).map((c) => {
                  const sev = SEV[c.severity];
                  const st = STATUS[c.status];
                  const time = new Date(c.timestamp);
                  return (
                    <div key={c.id} className="p-4 rounded-xl bg-surface-low hover:bg-surface-high/50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Photo thumbnail */}
                        {c.photo ? (
                          <img src={c.photo} alt="Evidence" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-surface-high flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-slate-300">image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <p className="text-sm font-medium text-slate-700">{c.ward_name}</p>
                              <p className="text-[10px] font-label text-slate-400">{formatSourceName(c.pollution_type)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full capitalize" style={{ color: sev.color, backgroundColor: sev.bg }}>{sev.label}</span>
                              <span className="flex items-center gap-1 text-[10px] font-label font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, backgroundColor: `${st.color}12` }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{st.icon}</span>
                                {st.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-label text-slate-300">
                              {time.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {c.location_text && (
                              <span className="flex items-center gap-1 text-[10px] font-label text-slate-300">
                                <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>location_on</span>
                                {c.location_text}
                              </span>
                            )}
                            {c.photo && <span className="flex items-center gap-1 text-[10px] font-label text-emerald-500"><span className="material-symbols-outlined" style={{ fontSize: "10px" }}>photo_camera</span>Photo</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Source distribution */}
          {Object.keys(sourceCounts).length > 0 && (
            <div className="bg-surface-lowest rounded-xl p-6" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label mb-4">Reports by Source Type</p>
              <div className="space-y-2">
                {Object.entries(sourceCounts).sort(([, a], [, b]) => b - a).map(([source, count]) => (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 truncate flex-shrink-0">{formatSourceName(source)}</span>
                    <div className="flex-1 h-2 bg-surface-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: "#3525cd", opacity: 0.5 + (count / maxCount) * 0.5 }} />
                    </div>
                    <span className="font-label text-[10px] font-bold text-slate-500 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
