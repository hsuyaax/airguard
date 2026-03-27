"use client";

export function MetricCard({
  label, value, subtitle, color, icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="bg-surface-lowest p-6 rounded-xl group hover:bg-surface-low transition-colors duration-300" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
      <div className="flex items-center justify-between mb-3">
        {icon && <span className="material-symbols-outlined text-primary">{icon}</span>}
        <span className="font-label text-[10px] text-slate-400 tracking-[0.15em] uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-label text-3xl font-bold" style={color ? { color } : undefined}>{value}</span>
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );
}
