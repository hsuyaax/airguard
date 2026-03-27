"use client";

export function DataSourceBadge({ source }: { source: string }) {
  return (
    <div className="flex items-center gap-2 font-label text-[10px] text-slate-500 uppercase tracking-tight">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      Data: {source}
    </div>
  );
}
