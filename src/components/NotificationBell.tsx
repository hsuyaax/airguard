"use client";

import { useEffect, useState, useRef } from "react";
import { requestNotificationPermission, checkThresholds } from "@/lib/notifications";
import { aqiColor } from "@/lib/aqi";
import type { WardData } from "@/lib/types";

export function NotificationBell() {
  const [criticalWards, setCriticalWards] = useState<WardData[]>([]);
  const [open, setOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotifEnabled(true);
    }
  }, []);

  useEffect(() => {
    fetch("/api/wards")
      .then((r) => r.json())
      .then((data) => {
        const wards: WardData[] = data.wardData || data.ward_data || [];
        setCriticalWards(checkThresholds(wards));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleToggleNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifEnabled(perm === "granted");
  };

  const count = criticalWards.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative hover:text-indigo-500 transition-all text-slate-400"
        aria-label={`Notifications: ${count} critical wards`}
      >
        <span className="material-symbols-outlined">notifications</span>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-error text-white text-[9px] font-label font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl overflow-hidden z-50"
          style={{
            boxShadow: "0 20px 60px rgba(25,28,30,0.15)",
            border: "1px solid rgba(199,196,216,0.2)",
          }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(199,196,216,0.15)" }}>
            <div>
              <p className="text-sm font-bold text-slate-900">Critical Alerts</p>
              <p className="text-[10px] font-label text-slate-400 uppercase tracking-widest">
                {count} ward{count !== 1 ? "s" : ""} above AQI 300
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-label font-bold uppercase tracking-wide transition-all ${
                notifEnabled
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-100 text-slate-500 hover:bg-primary/5 hover:text-primary"
              }`}
              style={
                notifEnabled
                  ? { border: "1px solid rgba(22,163,74,0.2)" }
                  : { border: "1px solid rgba(199,196,216,0.3)" }
              }
            >
              <span className="material-symbols-outlined text-xs">
                {notifEnabled ? "notifications_active" : "notifications_off"}
              </span>
              {notifEnabled ? "Enabled" : "Enable"}
            </button>
          </div>

          {/* Ward List */}
          <div className="max-h-72 overflow-y-auto">
            {count === 0 ? (
              <div className="p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-200 mb-2">check_circle</span>
                <p className="text-sm text-slate-400">No critical alerts</p>
                <p className="text-[10px] font-label text-slate-300 mt-1">All wards below AQI 300</p>
              </div>
            ) : (
              criticalWards
                .sort((a, b) => b.aqi - a.aqi)
                .slice(0, 15)
                .map((w) => (
                  <div
                    key={w.ward_no}
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    style={{ borderBottom: "1px solid rgba(199,196,216,0.08)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: aqiColor(w.aqi) }}
                      />
                      <div>
                        <p className="text-sm text-slate-700 font-medium">{w.ward_name}</p>
                        <p className="text-[10px] font-label text-slate-400">{w.category}</p>
                      </div>
                    </div>
                    <span
                      className="font-label text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: aqiColor(w.aqi), backgroundColor: `${aqiColor(w.aqi)}15` }}
                    >
                      {w.aqi}
                    </span>
                  </div>
                ))
            )}
          </div>

          {count > 15 && (
            <div className="p-3 text-center" style={{ borderTop: "1px solid rgba(199,196,216,0.15)" }}>
              <p className="text-[10px] font-label text-slate-400">
                +{count - 15} more critical wards
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
