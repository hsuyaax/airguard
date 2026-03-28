"use client";

import { useEffect, useState } from "react";

interface ModelData {
  models: {
    xgboost: { file: string; size: number; type: string; task: string; features: number; feature_names: string[]; classes: string[]; training: Record<string, string | number>; download: string };
    prophet: { count: number; type: string; task: string; models: Array<{ name: string; station_id: string; size: number }>; training: Record<string, string | number | string[]>; download_prefix: string };
    lstm: { count: number; type: string; task: string; files: Array<{ name: string; size: number }>; architecture: Record<string, string | number | string[]>; training: Record<string, string> };
    interpolation: { idw: { type: string; formula: string; power: number; stations: number; target_wards: number; validation: string; metrics: { rmse: number; mae: number; r_squared: number } }; kriging: { type: string; variogram: string; formula: string } };
    fingerprinting: { type: string; task: string; signals: Record<string, string> };
  };
  data: {
    stations: { count: number; download: string };
    wards: { count: number; download: string };
    training_scripts: Record<string, string>;
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ModelsPage() {
  const [data, setData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string>("xgboost");

  useEffect(() => {
    fetch("/api/models").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-400">Failed to load model registry</div>;

  const { models, data: dataInfo } = data;

  const toggle = (key: string) => setExpandedSection(expandedSection === key ? "" : key);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] font-label">Transparency</p>
        <h2 className="font-headline text-3xl font-bold mt-1">Model Registry &amp; Training Data</h2>
        <p className="text-on-surface-variant text-sm mt-2 max-w-2xl">
          Every model, its architecture, training data source, and validation metrics. All models and data files are downloadable for independent verification.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { n: "1", label: "XGBoost", sub: "Source Classifier", color: "#3525cd" },
          { n: String(models.prophet.count), label: "Prophet", sub: "Per-station Forecasters", color: "#58579b" },
          { n: String(models.lstm.count), label: "LSTM", sub: "Neural Forecasters", color: "#7e3000" },
          { n: "2", label: "Spatial", sub: "IDW + Kriging", color: "#009966" },
          { n: "1", label: "Heuristic", sub: "Fingerprinting Fallback", color: "#777587" },
        ].map((m) => (
          <div key={m.label} className="bg-surface-lowest p-5 rounded-xl" style={{ borderBottom: `3px solid ${m.color}` }}>
            <span className="font-label text-3xl font-bold" style={{ color: m.color }}>{m.n}</span>
            <p className="text-sm font-bold text-on-surface mt-1">{m.label}</p>
            <p className="text-[10px] text-on-surface-variant font-label">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* XGBoost */}
      <section className="bg-surface-lowest rounded-xl overflow-hidden" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <button onClick={() => toggle("xgboost")} className="w-full p-6 flex items-center justify-between hover:bg-surface-low/50 transition-colors">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-2xl">model_training</span>
            <div className="text-left">
              <h3 className="font-headline text-xl font-bold">XGBoost Source Classifier</h3>
              <p className="text-sm text-on-surface-variant">{models.xgboost.task} &bull; {formatBytes(models.xgboost.size)}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">{expandedSection === "xgboost" ? "expand_less" : "expand_more"}</span>
        </button>
        {expandedSection === "xgboost" && (
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest mb-3">16 Input Features</p>
                <div className="space-y-1.5">
                  {models.xgboost.feature_names.map((f, i) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <span className="font-label text-[10px] text-slate-400 w-5">{String(i + 1).padStart(2, "0")}</span>
                      <code className="font-label text-xs bg-surface-low px-2 py-0.5 rounded">{f}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest mb-3">8 Output Classes</p>
                <div className="space-y-2">
                  {models.xgboost.classes.map((c) => (
                    <div key={c} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded bg-primary/20" />
                      <span>{c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-2">
                  <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest">Training Config</p>
                  {Object.entries(models.xgboost.training).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="font-label font-bold text-on-surface">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <a href={models.xgboost.download} download className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-sm">download</span>
              Download Model ({formatBytes(models.xgboost.size)})
            </a>
          </div>
        )}
      </section>

      {/* Prophet */}
      <section className="bg-surface-lowest rounded-xl overflow-hidden" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <button onClick={() => toggle("prophet")} className="w-full p-6 flex items-center justify-between hover:bg-surface-low/50 transition-colors">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-secondary text-2xl">timeline</span>
            <div className="text-left">
              <h3 className="font-headline text-xl font-bold">Prophet Forecasters ({models.prophet.count} models)</h3>
              <p className="text-sm text-on-surface-variant">{models.prophet.task}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">{expandedSection === "prophet" ? "expand_less" : "expand_more"}</span>
        </button>
        {expandedSection === "prophet" && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(models.prophet.training).map(([k, v]) => (
                <div key={k} className="bg-surface-low p-3 rounded-lg">
                  <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest">{k.replace(/_/g, " ")}</p>
                  <p className="text-sm font-bold mt-1">{Array.isArray(v) ? v.join(", ") : String(v)}</p>
                </div>
              ))}
            </div>
            <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest mt-4">Per-Station Models ({models.prophet.count})</p>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[200px] overflow-y-auto">
              {models.prophet.models.map((m) => (
                <a key={m.name} href={`${models.prophet.download_prefix}${m.name}`} download className="bg-surface-low hover:bg-surface-high p-2 rounded-lg text-center transition-colors">
                  <p className="font-label text-[10px] font-bold text-primary">{m.station_id}</p>
                  <p className="text-[9px] text-slate-400">{formatBytes(m.size)}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* LSTM */}
      <section className="bg-surface-lowest rounded-xl overflow-hidden" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <button onClick={() => toggle("lstm")} className="w-full p-6 flex items-center justify-between hover:bg-surface-low/50 transition-colors">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-2xl" style={{ color: "#7e3000" }}>psychology</span>
            <div className="text-left">
              <h3 className="font-headline text-xl font-bold">LSTM Neural Forecasters ({models.lstm.count} models)</h3>
              <p className="text-sm text-on-surface-variant">{models.lstm.task}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">{expandedSection === "lstm" ? "expand_less" : "expand_more"}</span>
        </button>
        {expandedSection === "lstm" && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest mb-3">Architecture</p>
                <div className="bg-surface-low rounded-xl p-4 font-label text-xs space-y-2">
                  {Object.entries(models.lstm.architecture).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="font-bold">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest mb-3">Training</p>
                <div className="bg-surface-low rounded-xl p-4 font-label text-xs space-y-2">
                  {Object.entries(models.lstm.training).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest">Model Files</p>
                  {models.lstm.files.map((f) => (
                    <a key={f.name} href={`/data/models/${f.name}`} download className="flex items-center justify-between p-2 bg-surface-low rounded-lg hover:bg-surface-high transition-colors">
                      <span className="font-label text-xs">{f.name}</span>
                      <span className="text-[10px] text-slate-400">{formatBytes(f.size)}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* IDW / Kriging */}
      <section className="bg-surface-lowest rounded-xl overflow-hidden" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <button onClick={() => toggle("spatial")} className="w-full p-6 flex items-center justify-between hover:bg-surface-low/50 transition-colors">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-2xl" style={{ color: "#009966" }}>grid_on</span>
            <div className="text-left">
              <h3 className="font-headline text-xl font-bold">Spatial Interpolation (IDW + Kriging)</h3>
              <p className="text-sm text-on-surface-variant">{models.interpolation.idw.stations} stations &rarr; {models.interpolation.idw.target_wards} wards</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">{expandedSection === "spatial" ? "expand_less" : "expand_more"}</span>
        </button>
        {expandedSection === "spatial" && (
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-sm">IDW (Primary)</h4>
                <div className="bg-surface-low rounded-xl p-4 font-label text-xs">
                  <p className="text-slate-500 mb-2">Formula:</p>
                  <code className="block bg-white p-2 rounded text-primary text-[11px]">{models.interpolation.idw.formula}</code>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4" style={{ border: "1px solid rgba(22,163,74,0.15)" }}>
                  <p className="font-label text-[10px] text-emerald-700 uppercase tracking-widest mb-2">LOSO Validation Results</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <span className="font-label text-xl font-bold text-emerald-700">{models.interpolation.idw.metrics.rmse}</span>
                      <p className="text-[9px] text-emerald-600">RMSE &micro;g/m&sup3;</p>
                    </div>
                    <div className="text-center">
                      <span className="font-label text-xl font-bold text-emerald-700">{models.interpolation.idw.metrics.mae}</span>
                      <p className="text-[9px] text-emerald-600">MAE &micro;g/m&sup3;</p>
                    </div>
                    <div className="text-center">
                      <span className="font-label text-xl font-bold text-emerald-700">{models.interpolation.idw.metrics.r_squared}</span>
                      <p className="text-[9px] text-emerald-600">R&sup2; Score</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm">Kriging (Advanced)</h4>
                <div className="bg-surface-low rounded-xl p-4 font-label text-xs space-y-2">
                  <p className="text-slate-500">Variogram: {models.interpolation.kriging.variogram}</p>
                  <code className="block bg-white p-2 rounded text-primary text-[11px] mt-2">{models.interpolation.kriging.formula}</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Fingerprinting */}
      <section className="bg-surface-lowest rounded-xl overflow-hidden" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
        <button onClick={() => toggle("fingerprint")} className="w-full p-6 flex items-center justify-between hover:bg-surface-low/50 transition-colors">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-outline text-2xl">fingerprint</span>
            <div className="text-left">
              <h3 className="font-headline text-xl font-bold">Ratio-Based Fingerprinting (Fallback)</h3>
              <p className="text-sm text-on-surface-variant">{models.fingerprinting.task}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">{expandedSection === "fingerprint" ? "expand_less" : "expand_more"}</span>
        </button>
        {expandedSection === "fingerprint" && (
          <div className="px-6 pb-6">
            <p className="font-label text-[10px] text-slate-400 uppercase tracking-widest mb-4">Source Detection Signals</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(models.fingerprinting.signals).map(([source, signal]) => (
                <div key={source} className="bg-surface-low p-4 rounded-xl">
                  <p className="text-sm font-bold text-on-surface capitalize mb-1">{source.replace(/_/g, " ")}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{signal}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Data Downloads */}
      <section className="bg-surface-low rounded-xl p-8">
        <h3 className="font-headline text-xl font-bold mb-6">Training Data &amp; Scripts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "table_chart", label: "Station Coordinates", sub: `${dataInfo.stations.count} CPCB stations`, href: dataInfo.stations.download, file: "delhi_stations.csv" },
            { icon: "map", label: "Ward Boundaries", sub: `${dataInfo.wards.count} wards GeoJSON`, href: dataInfo.wards.download, file: "delhi_wards_2022.geojson" },
            { icon: "code", label: "XGBoost Training", sub: "train_xgb.py", href: dataInfo.training_scripts.xgboost, file: "train_xgb.py" },
            { icon: "code", label: "Prophet Training", sub: "train_prophet.py", href: dataInfo.training_scripts.prophet, file: "train_prophet.py" },
          ].map((d) => (
            <a key={d.label} href={d.href} download={d.file} className="bg-surface-lowest p-5 rounded-xl flex items-start gap-3 hover:bg-white transition-colors group">
              <span className="material-symbols-outlined text-primary mt-0.5">{d.icon}</span>
              <div>
                <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{d.label}</p>
                <p className="text-[10px] text-on-surface-variant font-label mt-0.5">{d.sub}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
