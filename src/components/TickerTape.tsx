"use client";

const TICKER_ITEMS = [
  { status: "live", text: "SENSOR 04-CK: 398 AQI (LIVE)" },
  { status: "live", text: "WIND: 4.2 KM/H NW" },
  { status: "live", text: "PM2.5: 245 \u00b5G/M\u00b3" },
  { status: "live", text: "NO2: 54 PPB" },
  { status: "live", text: "UPTIME: 99.9%" },
  { status: "live", text: "MODEL_X: V4.1.2 STABLE" },
  { status: "live", text: "SAT PASS: INSAT-3DR @ 13:45" },
  { status: "live", text: "LAST SYNC: 42s AGO" },
];

export function TickerTape() {
  return (
    <footer className="fixed bottom-0 right-0 left-64 h-8 bg-surface-highest flex items-center px-6 z-20 overflow-hidden" style={{ borderTop: "1px solid #e2e8f0" }}>
      <div className="flex items-center gap-8 whitespace-nowrap animate-ticker">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-2 font-label text-[10px] text-slate-500 uppercase tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {item.text}
          </div>
        ))}
      </div>
    </footer>
  );
}
