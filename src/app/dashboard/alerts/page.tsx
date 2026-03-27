"use client";

import { useEffect, useState } from "react";
import { getHealthAdvisory, getGrapAlert, generatePriorityAlerts } from "@/lib/alerts";
import { aqiColor } from "@/lib/aqi";
import type { WardData, PriorityAlert } from "@/lib/types";

export default function AlertsPage() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [selectedWard, setSelectedWard] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wards").then((r) => r.json()).then((data) => {
      const wards = data.wardData || data.ward_data || [];
      setWardData(wards);
      if (wards.length > 0) setSelectedWard(wards[0].ward_name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const avgAqi = wardData.length > 0 ? Math.round(wardData.reduce((s, w) => s + w.aqi, 0) / wardData.length) : 0;
  const grap = getGrapAlert(avgAqi);
  const alerts: PriorityAlert[] = generatePriorityAlerts(wardData);
  const ward = wardData.find((w) => w.ward_name === selectedWard);
  const wardAdvisory = ward ? getHealthAdvisory(ward.aqi) : null;

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-up">
        <div className="lg:col-span-8">
          <h2 className="font-headline text-5xl text-on-surface mb-6 leading-tight">
            Current Air Quality &amp; <span className="text-primary">GRAP Advisories</span>
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl mb-8">
            The Graded Response Action Plan (GRAP) is currently active across the National Capital Territory. Please follow strict compliance to minimize exposure and emissions.
          </p>
          <div className="bg-surface-low p-8 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-label text-xs uppercase text-slate-500 tracking-widest">Active Status</span>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-error animate-pulse" />
                <h3 className="font-headline text-2xl font-bold">{grap.stage}</h3>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-300 mx-8" />
            <div className="flex-1">
              <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
                {grap.actions.map((action, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-error text-lg">block</span>
                    {action}
                  </li>
                ))}
              </ul>
              {grap.actions.length === 0 && <p className="text-sm text-slate-400">No GRAP restrictions currently active.</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-primary text-on-primary p-8 rounded-xl relative overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(53,37,205,0.25)" }}>
          <div className="relative z-10">
            <span className="font-label text-xs uppercase text-on-primary-container tracking-widest opacity-80">Delhi Avg AQI</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-label text-7xl font-bold tracking-tighter">{avgAqi}</span>
              <span className="font-label text-sm opacity-60">&micro;g/m&sup3;</span>
            </div>
            <div className="mt-6 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-sm italic">{grap.citizen_message}</p>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-primary-container blur-3xl opacity-50" />
        </div>
      </section>

      {/* Priority Wards */}
      <section className="animate-fade-up delay-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-headline text-3xl font-bold">Priority Wards</h3>
            <p className="text-slate-500 text-sm mt-1">Equity-first monitoring: Wards requiring immediate medical intervention and enforcement.</p>
          </div>
          <button className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-primary font-bold">
            <span className="material-symbols-outlined text-sm">sort</span> Worst-First
          </button>
        </div>

        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.slice(0, 6).map((alert, i) => {
              const borderColor = alert.priority === "CRITICAL" ? "#ba1a1a" : "#FF8C00";
              return (
                <div key={i} className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow" style={{ borderLeft: `8px solid ${borderColor}`, border: `1px solid rgba(226,232,240,0.8)`, borderLeftWidth: "8px", borderLeftColor: borderColor }}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-headline text-xl font-bold">{alert.ward_name}</h4>
                        <span className="font-label text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: `${borderColor}15`, color: borderColor }}>
                          Priority: {alert.priority === "CRITICAL" ? "High" : "Medium"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-label text-3xl font-bold" style={{ color: aqiColor(alert.aqi) }}>{alert.aqi}</span>
                        <p className="font-label text-[10px] uppercase text-slate-400">AQI Index</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-surface-low p-3 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">medical_services</span> General Advisory
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">{alert.health_advisory}</p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: `${borderColor}08`, border: `1px solid ${borderColor}15` }}>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: borderColor }}>
                          <span className="material-symbols-outlined text-sm">school</span> Kids &amp; Schools
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: borderColor }}>{alert.children_advisory}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-green-50 p-6 rounded-xl text-green-700 text-sm">No critical alerts at this time. All wards below AQI 300.</div>
        )}
      </section>

      {/* Personal Ward Lookup */}
      <section className="max-w-4xl mx-auto animate-fade-up delay-200">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(25,28,30,0.08)" }}>
          <div className="p-8 bg-surface" style={{ borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
            <div className="flex flex-col items-center text-center">
              <h3 className="font-headline text-2xl font-bold mb-2">Check Your Local Advisory</h3>
              <p className="text-slate-500 text-sm mb-6">Select your ward for hyper-local health guidelines and enforcement status.</p>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full max-w-lg bg-white rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                style={{ border: "2px solid rgba(53,37,205,0.2)" }}
              >
                {wardData.map((w, i) => (<option key={`${w.ward_no}-${i}`} value={w.ward_name}>{w.ward_name}</option>))}
              </select>
            </div>
          </div>

          {ward && wardAdvisory && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-8" style={{ borderRight: "1px solid rgba(226,232,240,0.8)" }}>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-indigo-600">language</span>
                    <span className="font-label text-xs uppercase tracking-widest font-bold text-slate-400">English Advisory</span>
                  </div>
                  <h4 className="font-headline text-2xl font-bold mb-4">{ward.ward_name} <span className="text-error">({ward.aqi})</span></h4>
                  <div className="text-sm text-slate-600 leading-relaxed space-y-4">
                    <p><strong>Health Alert:</strong> {wardAdvisory.general}</p>
                    <p><strong>For Children:</strong> {wardAdvisory.children}</p>
                    <p><strong>Sensitive Groups:</strong> {wardAdvisory.sensitive}</p>
                  </div>
                </div>
                <div className="p-8 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-6 text-indigo-600">
                    <span className="material-symbols-outlined">translate</span>
                    <span className="font-label text-xs uppercase tracking-widest font-bold text-slate-400">&#x0939;&#x093F;&#x0902;&#x0926;&#x0940; &#x092A;&#x0930;&#x093E;&#x092E;&#x0930;&#x094D;&#x0936;</span>
                  </div>
                  <h4 className="font-headline text-2xl font-bold mb-4">{ward.ward_name} <span className="text-error">({ward.aqi})</span></h4>
                  <div className="text-sm text-slate-600 leading-relaxed space-y-4">
                    <p>{wardAdvisory.hindi}</p>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 p-4 flex items-center justify-center gap-6">
                <button className="flex items-center gap-2 text-indigo-600 font-label text-xs font-bold uppercase tracking-wider hover:underline">
                  <span className="material-symbols-outlined text-sm">download</span> Download PDF Advisory
                </button>
                <button className="flex items-center gap-2 text-indigo-600 font-label text-xs font-bold uppercase tracking-wider hover:underline">
                  <span className="material-symbols-outlined text-sm">share</span> Share on WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
