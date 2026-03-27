"use client";

export function AqiLegend() {
  return (
    <section className="bg-surface-low px-6 py-3 rounded-full flex items-center justify-between gap-8">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight font-label">AQI Legend</span>
      <div className="flex-1 flex gap-2 h-2">
        <div className="flex-1 rounded-full bg-green-500" title="Good (0-50)" />
        <div className="flex-1 rounded-full bg-yellow-400" title="Satisfactory (51-100)" />
        <div className="flex-1 rounded-full bg-orange-400" title="Moderate (101-200)" />
        <div className="flex-1 rounded-full bg-red-400" title="Poor (201-300)" />
        <div className="flex-1 rounded-full bg-red-600" title="Very Poor (301-400)" />
        <div className="flex-1 rounded-full bg-red-900" title="Severe (401-500)" />
      </div>
      <div className="flex gap-4 text-[10px] font-label text-slate-500 uppercase">
        <span>Good</span>
        <span>Severe</span>
      </div>
    </section>
  );
}
