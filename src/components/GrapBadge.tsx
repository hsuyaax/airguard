"use client";

export function GrapBadge({ stage, label }: { stage: number; label: string }) {
  const isActive = stage > 0;
  return (
    <div className={`p-6 rounded-xl flex flex-col ${isActive ? "bg-primary/5" : "bg-surface-lowest"}`} style={isActive ? { border: "1px dashed rgba(53,37,205,0.2)" } : undefined}>
      <p className={`text-xs font-bold tracking-[0.15em] font-label ${isActive ? "text-primary" : "text-slate-400"}`}>GRAP ENFORCEMENT</p>
      <div className="flex flex-col gap-1 mt-2">
        <p className={`text-3xl font-headline font-bold ${isActive ? "text-primary" : "text-slate-900"}`}>
          {stage > 0 ? `Stage ${stage === 1 ? "I" : stage === 2 ? "II" : stage === 3 ? "III" : "IV"}` : "Normal"}
        </p>
        <p className={`text-xs ${isActive ? "text-primary/70" : "text-slate-400"}`}>{label}</p>
      </div>
    </div>
  );
}
