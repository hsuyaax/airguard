"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Citizen Dashboard", icon: "dashboard" },
  { href: "/dashboard/admin", label: "Admin Dashboard", icon: "admin_panel_settings" },
  { href: "/dashboard/command", label: "Command Center", icon: "crisis_alert" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "notifications_active" },
  { href: "/dashboard/trends", label: "Trends & History", icon: "trending_up" },
  { href: "/dashboard/weather", label: "Weather & Satellite", icon: "wb_sunny" },
  { href: "/dashboard/report", label: "Reports", icon: "summarize" },
  { href: "/dashboard/complaints", label: "Citizen Reports", icon: "campaign" },
  { href: "/dashboard/api-docs", label: "API Docs", icon: "integration_instructions" },
  { href: "/dashboard/about", label: "About", icon: "info" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelTier, setModelTier] = useState("standard");
  const [interpolation, setInterpolation] = useState("idw");

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-50 flex flex-col z-40" style={{ borderRight: "1px solid #e2e8f0" }}>
      <div className="p-6 flex flex-col gap-1">
        <h1 className="text-xl font-headline font-bold text-slate-900">AirGuard</h1>
        <p className="text-xs text-slate-500 uppercase tracking-[0.15em]">Delhi Monitoring System</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 ${
                active
                  ? "text-indigo-700 font-bold border-r-4 border-indigo-600 bg-slate-100"
                  : "text-slate-500 hover:text-indigo-500 hover:bg-slate-100 rounded-lg"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 space-y-3" style={{ borderTop: "1px solid #e2e8f0" }}>
        {/* Advanced Settings (matches original Streamlit sidebar expander) */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full bg-primary-container text-on-primary-container py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">{settingsOpen ? "expand_less" : "tune"}</span>
          Advanced Settings
        </button>

        {settingsOpen && (
          <div className="bg-white rounded-xl p-3 space-y-3" style={{ border: "1px solid #eceef0" }}>
            <div>
              <label className="text-[10px] font-label text-slate-400 uppercase tracking-widest block mb-1.5">Model Tier</label>
              <select
                value={modelTier}
                onChange={(e) => setModelTier(e.target.value)}
                className="w-full bg-slate-50 text-xs py-2 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                style={{ border: "none" }}
              >
                <option value="standard">Standard (XGBoost/Prophet)</option>
                <option value="advanced">Advanced (LSTM)</option>
                <option value="basic">Basic (IDW/Heuristic)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-label text-slate-400 uppercase tracking-widest block mb-1.5">Interpolation</label>
              <select
                value={interpolation}
                onChange={(e) => setInterpolation(e.target.value)}
                className="w-full bg-slate-50 text-xs py-2 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                style={{ border: "none" }}
              >
                <option value="idw">IDW (Fast)</option>
                <option value="kriging">Kriging (Accurate)</option>
              </select>
            </div>
          </div>
        )}

        {/* User profile */}
        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton
            appearance={{ elements: { avatarBox: "w-9 h-9" } }}
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">Signed In</p>
            <p className="text-[10px] text-slate-400">Environment Dept.</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-500 text-xs hover:text-indigo-500 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-sm">translate</span>
            <span>English / Hindi</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-slate-500 text-xs hover:text-indigo-500 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-sm">sensors</span>
            <span>Live Status</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
