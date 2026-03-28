"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";

type ViewMode = "citizen" | "admin" | "dev";

const CITIZEN_NAV = [
  { href: "/dashboard", label: "Air Quality", icon: "dashboard" },
  { href: "/dashboard/alerts", label: "Alerts & Advisories", icon: "notifications_active" },
  { href: "/dashboard/trends", label: "Trends", icon: "trending_up" },
  { href: "/dashboard/weather", label: "Weather", icon: "wb_sunny" },
  { href: "/dashboard/complaints", label: "Report Pollution", icon: "campaign" },
  { href: "/dashboard/about", label: "About", icon: "info" },
];

const ADMIN_NAV = [
  { href: "/dashboard/admin", label: "Admin Dashboard", icon: "admin_panel_settings" },
  { href: "/dashboard/command", label: "Command Center", icon: "crisis_alert" },
  { href: "/dashboard/alerts", label: "Alerts & GRAP", icon: "notifications_active" },
  { href: "/dashboard/trends", label: "Trends & History", icon: "trending_up" },
  { href: "/dashboard/weather", label: "Weather & Satellite", icon: "wb_sunny" },
  { href: "/dashboard/report", label: "Generate Reports", icon: "summarize" },
  { href: "/dashboard/complaints", label: "Citizen Reports", icon: "campaign" },
  { href: "/dashboard/models", label: "Model Registry", icon: "hub" },
  { href: "/dashboard/api-docs", label: "API Docs", icon: "integration_instructions" },
];

const DEV_NAV = [
  { href: "/dashboard", label: "Citizen Dashboard", icon: "dashboard" },
  { href: "/dashboard/admin", label: "Admin Dashboard", icon: "admin_panel_settings" },
  { href: "/dashboard/command", label: "Command Center", icon: "crisis_alert" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "notifications_active" },
  { href: "/dashboard/trends", label: "Trends & History", icon: "trending_up" },
  { href: "/dashboard/weather", label: "Weather & Satellite", icon: "wb_sunny" },
  { href: "/dashboard/report", label: "Reports", icon: "summarize" },
  { href: "/dashboard/complaints", label: "Citizen Reports", icon: "campaign" },
  { href: "/dashboard/models", label: "Model Registry", icon: "hub" },
  { href: "/dashboard/api-docs", label: "API Docs", icon: "integration_instructions" },
  { href: "/dashboard/about", label: "About", icon: "info" },
];

const MODE_CONFIG: Record<ViewMode, { label: string; icon: string; color: string; tag: string; navItems: typeof DEV_NAV }> = {
  citizen: { label: "Citizen", icon: "person", color: "#009966", tag: "Your Air Quality", navItems: CITIZEN_NAV },
  admin: { label: "MCD Officer", icon: "admin_panel_settings", color: "#3525cd", tag: "Governance Tools", navItems: ADMIN_NAV },
  dev: { label: "Developer", icon: "code", color: "#7e3000", tag: "All Pages (Dev Mode)", navItems: DEV_NAV },
};

export function Sidebar() {
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<ViewMode>("dev");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelTier, setModelTier] = useState("standard");
  const [interpolation, setInterpolation] = useState("idw");

  useEffect(() => {
    const saved = localStorage.getItem("airguard_view_mode") as ViewMode | null;
    if (saved && MODE_CONFIG[saved]) setViewMode(saved);
  }, []);

  const switchMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("airguard_view_mode", mode);
  };

  const config = MODE_CONFIG[viewMode];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-50 flex flex-col z-40" style={{ borderRight: "1px solid #e2e8f0" }}>
      <div className="p-6 flex flex-col gap-1">
        <h1 className="text-xl font-headline font-bold text-slate-900">AirGuard</h1>
        <p className="text-xs text-slate-500 uppercase tracking-[0.15em]">Delhi Monitoring System</p>
      </div>

      {/* Role Switcher */}
      <div className="px-4 mb-2">
        <div className="bg-white rounded-xl p-1 flex gap-0.5" style={{ border: "1px solid #eceef0" }}>
          {(["citizen", "admin", "dev"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => switchMode(mode)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === mode ? "text-white" : "text-slate-400 hover:text-slate-600"
              }`}
              style={viewMode === mode ? { backgroundColor: MODE_CONFIG[mode].color } : undefined}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>{MODE_CONFIG[mode].icon}</span>
              {MODE_CONFIG[mode].label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-2 mb-1">
          <span className="text-[9px] font-label uppercase tracking-[0.2em]" style={{ color: config.color }}>{config.tag}</span>
        </div>
        {config.navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 ${
                active ? "font-bold bg-slate-100" : "text-slate-500 hover:text-indigo-500 hover:bg-slate-100 rounded-lg"
              }`}
              style={active ? { color: config.color, borderRight: `4px solid ${config.color}` } : undefined}
            >
              <span className="material-symbols-outlined text-xl" style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 space-y-3" style={{ borderTop: "1px solid #e2e8f0" }}>
        {(viewMode === "admin" || viewMode === "dev") && (
          <>
            <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-full bg-primary-container text-on-primary-container py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">{settingsOpen ? "expand_less" : "tune"}</span>
              Advanced Settings
            </button>
            {settingsOpen && (
              <div className="bg-white rounded-xl p-3 space-y-3" style={{ border: "1px solid #eceef0" }}>
                <div>
                  <label className="text-[10px] font-label text-slate-400 uppercase tracking-widest block mb-1.5">Model Tier</label>
                  <select value={modelTier} onChange={(e) => setModelTier(e.target.value)} className="w-full bg-slate-50 text-xs py-2 px-2.5 rounded-lg focus:outline-none" style={{ border: "none" }}>
                    <option value="standard">Standard (XGBoost/Prophet)</option>
                    <option value="advanced">Advanced (LSTM)</option>
                    <option value="basic">Basic (IDW/Heuristic)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-label text-slate-400 uppercase tracking-widest block mb-1.5">Interpolation</label>
                  <select value={interpolation} onChange={(e) => setInterpolation(e.target.value)} className="w-full bg-slate-50 text-xs py-2 px-2.5 rounded-lg focus:outline-none" style={{ border: "none" }}>
                    <option value="idw">IDW (Fast)</option>
                    <option value="kriging">Kriging (Accurate)</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">Signed In</p>
            <p className="text-[10px] capitalize" style={{ color: config.color }}>{config.label} Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
