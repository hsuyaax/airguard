export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-32">
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start animate-fade-up">
        <div className="md:col-span-7">
          <h2 className="text-5xl font-headline font-bold text-on-surface leading-tight mb-8">
            The Atmosphere, <br /><span className="text-primary italic">Decoded.</span>
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-6">
            AirGuard is a next-generation environmental intelligence platform engineered for the Municipal Corporation of Delhi (MCD). It bridges the gap between raw scientific data and actionable urban policy.
          </p>
          <p className="text-on-surface-variant leading-relaxed opacity-80">
            By integrating satellite telemetry, ground-level IoT sensors, and predictive AI, we empower officers with tactical ward-level insights while providing citizens with hyper-local health advisories.
          </p>
        </div>
        <div className="md:col-span-5 relative">
          <div className="aspect-square rounded-2xl bg-surface-low overflow-hidden relative flex items-center justify-center">
            <div className="bg-surface-lowest p-6 rounded-xl z-10" style={{ boxShadow: "0 20px 60px rgba(25,28,30,0.08)", border: "1px solid rgba(199,196,216,0.1)" }}>
              <span className="font-label text-[10px] text-primary block mb-2 tracking-widest uppercase">Current Status</span>
              <div className="text-4xl font-label font-bold">142 AQI</div>
              <div className="w-full bg-surface-high h-1 mt-4">
                <div className="bg-primary w-2/3 h-full" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-label">Central Delhi District</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="animate-fade-up delay-100">
        <div className="flex items-baseline gap-4 mb-12">
          <h3 className="text-3xl font-headline font-bold">Platform Capabilities</h3>
          <div className="h-px flex-1 bg-surface-high" />
          <span className="font-label text-sm text-primary">01 // FEATURES</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-surface-lowest p-8 rounded-xl flex flex-col justify-between" style={{ borderBottom: "2px solid #3525cd" }}>
            <span className="material-symbols-outlined text-primary mb-4 text-4xl">map</span>
            <h4 className="text-xl font-headline font-bold mb-4">Ward-Level Mapping</h4>
            <p className="text-on-surface-variant">Granular visualization of Delhi&apos;s 250 wards, enabling pinpoint interventions in high-pollution corridors.</p>
          </div>
          {[
            { icon: "view_in_ar", title: "3D Visualization", desc: "Volumetric air quality models accounting for urban canyons and building height factors." },
            { icon: "model_training", title: "What-If Simulator", desc: "Scenario modeling for policy changes\u2014predicting impact before traffic bans are implemented." },
            { icon: "warning", title: "Early Warning System", desc: "AI-triggered SMS alerts for respiratory health risks across 11 vulnerable zones." },
            { icon: "satellite_alt", title: "Sentinel Integration", desc: "Daily satellite pass-over data for regional stubble burning detection." },
          ].map((f) => (
            <div key={f.title} className="bg-surface-low p-8 rounded-xl">
              <span className="material-symbols-outlined text-slate-500 mb-4 text-3xl">{f.icon}</span>
              <h4 className="text-lg font-headline font-bold mb-2">{f.title}</h4>
              <p className="text-sm text-on-surface-variant">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {["Hyper-local Wind Vectoring", "Real-time PM2.5/PM10 Tracking", "Heavy Vehicle Heatmapping", "Public API for Health Apps", "Multi-Language Support (HI/EN)", "Automated GRAP Reports"].map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span> {f}
            </div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="animate-fade-up delay-200">
        <div className="flex items-baseline gap-4 mb-12">
          <h3 className="text-3xl font-headline font-bold">Registry of Data Sources</h3>
          <div className="h-px flex-1 bg-surface-high" />
          <span className="font-label text-sm text-primary">02 // DATASETS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: "1px solid #e6e8ea" }}>
                {["Source Entity", "Data Type", "Refresh Rate", "Current Status"].map((h, i) => (
                  <th key={h} className={`pb-4 font-label text-[10px] uppercase tracking-widest text-slate-400 font-normal ${i === 3 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-low">
              {[
                { name: "WAQI (aqicn.org)", sub: "Primary AQI Feed (28 stations)", type: "Real-time AQI, PM2.5, PM10, NO2", rate: "Live (15 min)", status: "Synchronized", ok: true },
                { name: "OpenWeatherMap", sub: "Meteorological Data", type: "Wind, Temp, Humidity, Pressure", rate: "Live", status: "Synchronized", ok: true },
                { name: "SAFAR (IITM)", sub: "Source Apportionment", type: "Published Source Profiles", rate: "Seasonal", status: "Reference", ok: true },
                { name: "Sentinel-5P / MODIS", sub: "EU Copernicus Satellite", type: "Aerosol Optical Depth (AOD)", rate: "Every 3h", status: "Synthetic", ok: false },
              ].map((row) => (
                <tr key={row.name}>
                  <td className="py-6"><div className="font-bold">{row.name}</div><div className="text-xs text-slate-500">{row.sub}</div></td>
                  <td className="py-6 font-label text-sm">{row.type}</td>
                  <td className="py-6 font-label text-sm">{row.rate}</td>
                  <td className="py-6 text-right">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight ${row.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`} style={{ border: `1px solid ${row.ok ? "#bbf7d0" : "#fde68a"}` }}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Architecture */}
      <section className="animate-fade-up delay-300">
        <div className="flex items-baseline gap-4 mb-12">
          <h3 className="text-3xl font-headline font-bold">Technical Architecture</h3>
          <div className="h-px flex-1 bg-surface-high" />
          <span className="font-label text-sm text-primary">03 // PIPELINE</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { num: "01", tag: "Ingestion", title: "Multi-source Harvesting", desc: "ETL workers pooling IoT, Satellite, and Weather JSON streams into raw buffers.", highlight: false },
            { num: "02", tag: "Processing", title: "Spatial Normalization", desc: "Mapping heterogeneous sensor formats into a unified GeoJSON grid for Delhi.", highlight: false },
            { num: "03", tag: "Intelligence", title: "Neural Forecasting", desc: "LSTMs and Random Forest models predicting next 48h pollution trajectories.", highlight: false },
            { num: "04", tag: "Dashboard", title: "Tactical Visualization", desc: "Vector-tiled maps and administrative reporting interface for MCD.", highlight: true },
          ].map((step) => (
            <div
              key={step.num}
              className={`p-8 rounded-lg relative overflow-hidden group ${step.highlight ? "bg-primary-container text-on-primary-container" : ""}`}
              style={step.highlight ? undefined : { border: "1px solid rgba(199,196,216,0.3)" }}
            >
              {!step.highlight && <div className="absolute -right-4 -top-4 font-label text-6xl text-slate-100 select-none group-hover:text-primary/5 transition-colors">{step.num}</div>}
              <h5 className={`font-label text-xs mb-6 tracking-widest uppercase ${step.highlight ? "text-on-primary-container/60" : "text-primary"}`}>{step.tag}</h5>
              <p className="font-headline text-lg font-bold mb-4">{step.title}</p>
              <p className={`text-xs ${step.highlight ? "text-on-primary-container/80" : "text-slate-500"}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Status */}
      <section>
        <div className="flex items-baseline gap-4 mb-12">
          <h3 className="text-3xl font-headline font-bold">Live Health Monitors</h3>
          <div className="h-px flex-1 bg-surface-high" />
          <span className="font-label text-sm text-primary">04 // SYSTEM_STATUS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: "hub", label: "Data Pipeline", value: "99.98%", sub: "Availability (Last 30d)", status: "OPERATIONAL", statusColor: "green" },
            { icon: "psychology", label: "ML Model Status", value: "\u03c3 0.14", sub: "RMSE Prediction Error", status: "STABLE", statusColor: "green" },
            { icon: "database", label: "Cache Freshness", value: "42ms", sub: "Mean API Latency", status: "FRESH", statusColor: "green" },
            { icon: "cloud", label: "Weather Service", value: "1.2s", sub: "Satellite Sync Delay", status: "RECONNECTING", statusColor: "amber" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-low p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary">{s.icon}</span>
                <span className={`font-label text-[10px] text-${s.statusColor}-600`}>{s.status}</span>
              </div>
              <h6 className="font-bold text-sm mb-1">{s.label}</h6>
              <div className="text-2xl font-label">{s.value}</div>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-tight">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16" style={{ borderTop: "1px solid #e6e8ea" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="font-headline text-2xl font-bold mb-6">India Innovates 2026</h4>
            <p className="text-sm text-on-surface-variant max-w-sm">
              A flagship initiative under the Digital India mission, focused on environmental sustainability through deep-tech intervention.
            </p>
          </div>
          <div className="text-right">
            <p className="font-label text-xs text-primary mb-4 uppercase tracking-widest">Core Development Team</p>
            <div className="space-y-1 text-sm">
              <p>Aayush Kumar</p>
              <p>Shourya Singh</p>
              <p>Divyansh Aggarwal</p>
            </div>
          </div>
        </div>
        <div className="mt-16 flex justify-between items-center text-[10px] font-label text-slate-400 uppercase tracking-widest pb-8">
          <span>&copy; 2026 AirGuard Project</span>
          <div className="flex gap-8">
            <span className="hover:text-primary transition-colors cursor-pointer">System Logs</span>
            <span className="hover:text-primary transition-colors cursor-pointer">API Documentation</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
