import Link from "next/link";
import { NavAuthButton, HeroAuthButtons, CtaAuthButtons } from "@/components/AuthButtons";

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface overflow-x-hidden">
      {/* ═══ Sensor Ribbon ═══ */}
      <div className="bg-surface-highest flex items-center h-8 px-8 overflow-hidden">
        <div className="flex items-center gap-8 whitespace-nowrap font-label text-[10px] text-on-surface-variant uppercase tracking-wider opacity-70">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />DLCPCB001: 142&micro;g</span>
          <span>DLCPCB004: 312&micro;g</span>
          <span>DLCPCB009: 88&micro;g</span>
          <span className="text-error">DLCPCB033: 452&micro;g CRITICAL</span>
          <span>WIND: NW 4.2km/h</span>
          <span>TEMP: 27.1&deg;C</span>
          <span>SYNC: 42s AGO</span>
        </div>
      </div>

      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 w-full z-50" style={{ background: "rgba(247,249,251,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="flex justify-between items-center px-8 py-5 max-w-[1320px] mx-auto">
          <div className="flex items-center gap-14">
            <span className="font-headline text-xl tracking-tight text-on-surface">AirGuard</span>
            <div className="hidden md:flex items-center gap-8 font-label text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
              <a href="#proof" className="hover:text-primary transition-colors">Evidence</a>
              <a href="#pipeline" className="hover:text-primary transition-colors">Architecture</a>
              <a href="#capabilities" className="hover:text-primary transition-colors">Capabilities</a>
              <a href="#team" className="hover:text-primary transition-colors">Team</a>
            </div>
          </div>
          <NavAuthButton />
        </div>
      </nav>

      <main>
        {/* ═══ HERO — Asymmetric Editorial Spread ═══ */}
        <section className="min-h-[92vh] relative">
          <div className="max-w-[1320px] mx-auto px-8 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-0 items-start">
            {/* Left: 7 cols — The Statement */}
            <div className="lg:col-span-7 lg:pr-20 pt-8">
              <p className="font-label text-[11px] text-primary uppercase tracking-[0.25em] mb-10">India Innovates 2026 &mdash; Municipal Corporation of Delhi</p>

              <h1 className="font-headline text-on-surface leading-[1.08] mb-10" style={{ fontSize: "clamp(2.8rem, 5.5vw, 5rem)" }}>
                Know what<br />you&apos;re breathing.<br />
                <em className="text-primary" style={{ fontStyle: "italic" }}>Ward by ward.</em>
              </h1>

              <p className="text-on-surface-variant text-lg leading-relaxed max-w-[520px] mb-14">
                Delhi&apos;s air quality varies wildly across its 1,484&nbsp;km&sup2;. A &ldquo;Moderate&rdquo; city average can hide &ldquo;Severe&rdquo; pockets in your ward. AirGuard maps pollution to your street using live CPCB data, satellite imagery, and predictive AI&mdash;then tells your government exactly what to do about it.
              </p>

              <HeroAuthButtons />

              {/* Proof strip inline */}
              <div className="mt-20 flex gap-12">
                {[
                  { n: "28", u: "live stations", sub: "CPCB via WAQI" },
                  { n: "250", u: "wards mapped", sub: "IDW + Kriging" },
                  { n: "0.847", u: "R\u00b2 accuracy", sub: "LOSO validated" },
                ].map((d) => (
                  <div key={d.n}>
                    <span className="font-label text-3xl font-bold text-on-surface">{d.n}</span>
                    <span className="font-label text-sm text-on-surface-variant ml-1.5">{d.u}</span>
                    <p className="font-label text-[10px] text-outline uppercase tracking-wider mt-1">{d.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 5 cols — Data Artifact */}
            <div className="lg:col-span-5 relative mt-12 lg:mt-0 hidden lg:block">
              {/* Vertical data column — the "command screen" aesthetic */}
              <div className="bg-surface-low rounded-2xl p-8 space-y-6 relative" style={{ minHeight: "580px" }}>
                {/* Title chip */}
                <div className="flex justify-between items-center">
                  <span className="font-label text-[10px] text-primary uppercase tracking-[0.2em]">Live Telemetry</span>
                  <span className="flex items-center gap-1.5 font-label text-[10px] text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Streaming</span>
                </div>

                {/* Worst station readout */}
                <div className="bg-surface-lowest rounded-xl p-6">
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">Highest Reading — Anand Vihar</p>
                  <div className="flex items-baseline gap-3">
                    <span className="font-label text-6xl font-bold text-error leading-none">482</span>
                    <div>
                      <span className="font-label text-sm text-error block">AQI</span>
                      <span className="font-label text-[10px] text-on-surface-variant">PM2.5: 342 &micro;g/m&sup3;</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[100,100,100,80,60,30].map((o,i) => <div key={i} className="h-1 flex-1 rounded-full bg-error" style={{ opacity: o/100 }} />)}
                  </div>
                </div>

                {/* Station list */}
                <div className="space-y-0">
                  {[
                    { name: "Siri Fort", aqi: 334, trend: "up" },
                    { name: "IGI Airport T3", aqi: 209, trend: "down" },
                    { name: "Mandir Marg", aqi: 158, trend: "up" },
                    { name: "Burari Crossing", aqi: 149, trend: "flat" },
                    { name: "Mundka", aqi: 126, trend: "down" },
                    { name: "DTU", aqi: 107, trend: "flat" },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #eceef0" }}>
                      <span className="text-sm text-on-surface">{s.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-sm" style={{ color: s.trend === "up" ? "#ba1a1a" : s.trend === "down" ? "#009966" : "#777587" }}>
                          {s.trend === "up" ? "trending_up" : s.trend === "down" ? "trending_down" : "trending_flat"}
                        </span>
                        <span className="font-label text-sm font-bold" style={{ color: s.aqi > 300 ? "#ba1a1a" : s.aqi > 200 ? "#ff9933" : s.aqi > 100 ? "#ffde33" : "#009966" }}>{s.aqi}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* GRAP tag */}
                <div className="flex items-center gap-3 bg-error/5 rounded-lg px-4 py-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
                  <div>
                    <span className="font-label text-[10px] text-error uppercase tracking-widest font-bold">GRAP Stage III Active</span>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Construction ban, vehicle restrictions in effect</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ THE PROBLEM — Three Indictments ═══ */}
        <section className="bg-surface-low py-28 px-8">
          <div className="max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-y-16 md:gap-x-20">
            {[
              { col: "md:col-span-4", title: "City averages lie.", body: "A \u201CModerate\u201D rating for Delhi can mask \u201CSevere\u201D levels in Anand Vihar while Siri Fort breathes clean. One number for 1,484\u00a0km\u00b2 is not governance\u2014it\u2019s negligence." },
              { col: "md:col-span-4", title: "You can\u2019t fix what you can\u2019t see.", body: "MCD officers need ward-level evidence to issue enforcement notices. Without source apportionment\u2014road dust vs construction vs biomass vs traffic\u2014policy is guesswork." },
              { col: "md:col-span-4", title: "Alerts arrive too late.", body: "By the time GRAP Stage IV is declared, lungs are already damaged. Our 48-hour PM2.5 forecasts alert schools and hospitals before spikes reach hazardous levels." },
            ].map((item, i) => (
              <div key={i} className={item.col}>
                <div className="w-10 h-[3px] mb-8" style={{ background: "#3525cd" }} />
                <h3 className="font-headline text-2xl font-bold mb-5 leading-snug">{item.title}</h3>
                <p className="text-on-surface-variant leading-relaxed text-[15px]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ LIVE PROOF — Evidence Panel ═══ */}
        <section id="proof" className="py-32 px-8">
          <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em] mb-6">Validated Performance</p>
              <h2 className="font-headline text-4xl font-bold leading-tight mb-6">Not a prototype.<br />Validated science.</h2>
              <p className="text-on-surface-variant leading-relaxed mb-10">
                Every prediction is cross-validated using Leave-One-Station-Out methodology across 39 CPCB monitoring stations. These aren&apos;t demo numbers&mdash;they&apos;re reproducible metrics.
              </p>
              <div className="space-y-6">
                {[
                  { label: "RMSE", value: "22.4", unit: "\u00b5g/m\u00b3", note: "Root Mean Square Error" },
                  { label: "MAE", value: "17.8", unit: "\u00b5g/m\u00b3", note: "Mean Absolute Error" },
                  { label: "R\u00b2", value: "0.847", unit: "", note: "Coefficient of Determination" },
                  { label: "CV Folds", value: "39", unit: "stations", note: "Leave-One-Station-Out" },
                ].map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between py-4" style={{ borderBottom: "1px solid #eceef0" }}>
                    <div>
                      <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest">{m.label}</span>
                      <p className="text-[10px] text-outline mt-0.5">{m.note}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-label text-2xl font-bold text-on-surface">{m.value}</span>
                      {m.unit && <span className="font-label text-xs text-on-surface-variant ml-1">{m.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-8">
              {/* Forecast visualization */}
              <div className="bg-surface-lowest rounded-2xl p-10 mb-8">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">48-Hour Forecast</p>
                    <h3 className="font-headline text-xl">Central Delhi PM2.5 Trajectory</h3>
                  </div>
                  <span className="font-label text-xs text-primary">Prophet + LSTM</span>
                </div>
                <div className="relative h-52">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[40,80,120].map((y) => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#eceef0" strokeWidth="1" />)}
                    {/* Threshold markers */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#ba1a1a" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                    <text x="505" y="53" fill="#ba1a1a" fontSize="8" fontFamily="Space Grotesk" opacity="0.6">Severe</text>
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#ff9933" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                    {/* Confidence band */}
                    <path d="M0 85 Q60 65 120 90 Q180 115 240 75 Q300 40 360 65 Q420 95 500 55 L500 110 Q420 130 360 100 Q300 75 240 110 Q180 145 120 120 Q60 100 0 115Z" fill="#3525cd" fillOpacity="0.06" />
                    {/* Prediction line */}
                    <path d="M0 100 Q60 82 120 105 Q180 130 240 92 Q300 55 360 82 Q420 112 500 80" fill="none" stroke="#3525cd" strokeWidth="2.5" />
                    {/* Data point */}
                    <circle cx="240" cy="92" r="4" fill="#3525cd" />
                    <text x="252" y="88" fill="#3525cd" fontSize="10" fontFamily="Space Grotesk" fontWeight="bold">142 &micro;g/m&sup3;</text>
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between font-label text-[9px] text-outline uppercase pt-3">
                    <span>Now</span><span>+12h</span><span>+24h</span><span>+36h</span><span>+48h</span>
                  </div>
                </div>
              </div>

              {/* Source stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: "hub", n: "28", label: "Live Stations" },
                  { icon: "schedule", n: "48h", label: "Forecast Window" },
                  { icon: "science", n: "8", label: "Source Types" },
                ].map((s) => (
                  <div key={s.label} className="bg-surface-low rounded-xl p-5">
                    <span className="material-symbols-outlined text-primary text-lg mb-3 block">{s.icon}</span>
                    <span className="font-label text-2xl font-bold text-on-surface block">{s.n}</span>
                    <span className="text-[11px] text-on-surface-variant">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ ARCHITECTURE — The Pipeline ═══ */}
        <section id="pipeline" className="bg-surface-low py-32 px-8">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-baseline gap-6 mb-16">
              <h2 className="font-headline text-3xl font-bold">Architecture</h2>
              <div className="h-px flex-1 bg-surface-high" />
              <span className="font-label text-xs text-primary uppercase tracking-[0.15em]">4-Stage Pipeline</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
              {[
                { n: "01", tag: "Ingest", title: "Multi-Source Fusion", items: ["WAQI live feed (28 stations)", "OpenWeatherMap meteorology", "SAFAR source profiles", "Sentinel-5P satellite AOD"], accent: false },
                { n: "02", tag: "Spatial", title: "Ward Interpolation", items: ["IDW (Inverse Distance Weighting)", "Ordinary Kriging + variogram", "250 ward centroids from GeoJSON", "LOSO cross-validation"], accent: false },
                { n: "03", tag: "Intelligence", title: "ML Inference", items: ["XGBoost (8 source classes)", "Prophet + LSTM forecasting", "Ratio-based fingerprinting", "Confidence interval estimation"], accent: false },
                { n: "04", tag: "Governance", title: "Action Layer", items: ["Enforcement notice generator", "What-if policy simulator", "GRAP compliance tracker", "Equity-first school/hospital alerts"], accent: true },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className={`p-8 relative ${step.accent ? "bg-primary text-white rounded-r-2xl" : ""}`}
                  style={!step.accent ? { borderRight: i < 3 ? "1px solid #e0e3e5" : undefined } : undefined}
                >
                  <span className={`font-label text-[10px] uppercase tracking-[0.2em] block mb-6 ${step.accent ? "text-white/50" : "text-primary"}`}>{step.tag}</span>
                  <p className={`font-headline text-lg font-bold mb-6 ${step.accent ? "text-white" : "text-on-surface"}`}>{step.title}</p>
                  <ul className="space-y-3">
                    {step.items.map((item) => (
                      <li key={item} className={`text-[13px] leading-relaxed flex items-start gap-2 ${step.accent ? "text-white/75" : "text-on-surface-variant"}`}>
                        <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${step.accent ? "bg-white/40" : "bg-primary/40"}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {!step.accent && (
                    <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-surface-high text-xl z-10 hidden md:block">&rarr;</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CAPABILITIES — Staggered Grid ═══ */}
        <section id="capabilities" className="py-32 px-8">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-baseline gap-6 mb-16">
              <h2 className="font-headline text-3xl font-bold">Capabilities</h2>
              <div className="h-px flex-1 bg-surface-high" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Large feature */}
              <div className="md:col-span-7 bg-surface-lowest p-10 rounded-2xl" style={{ borderBottom: "3px solid #3525cd" }}>
                <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-4">Core</p>
                <h3 className="font-headline text-2xl font-bold mb-4">250-Ward Real-Time Heatmap</h3>
                <p className="text-on-surface-variant leading-relaxed max-w-lg">
                  Interactive choropleth of every Delhi ward, colored by live AQI. IDW/Kriging interpolation from 28 CPCB stations. Available as 2D map and dramatic 3D pillar visualization. Each ward gets its own AQI, source profile, forecast, and health advisory.
                </p>
              </div>

              <div className="md:col-span-5 bg-surface-low p-8 rounded-2xl">
                <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-4">ML</p>
                <h3 className="font-headline text-xl font-bold mb-3">8-Type Source Analysis</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">XGBoost classifier + ratio fingerprinting identifies road dust, construction, biomass, traffic, industrial, secondary aerosols, waste burning, and diesel generators per ward.</p>
              </div>

              <div className="md:col-span-4 bg-surface-low p-8 rounded-2xl">
                <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-4">Forecast</p>
                <h3 className="font-headline text-xl font-bold mb-3">48-Hour Prediction</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">Prophet + LSTM neural network with expanding confidence intervals. Linear extrapolation as bulletproof fallback.</p>
              </div>

              <div className="md:col-span-4 bg-surface-low p-8 rounded-2xl">
                <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-4">AI</p>
                <h3 className="font-headline text-xl font-bold mb-3">LLM Enforcement Notices</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">Auto-generated MCD notices citing Air Act 1981 &sect;5. Groq Llama-3.3 AI or instant templates. Hindi, English, bilingual.</p>
              </div>

              <div className="md:col-span-4 bg-surface-low p-8 rounded-2xl">
                <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-4">Governance</p>
                <h3 className="font-headline text-xl font-bold mb-3">Command Center</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">Decision queue, what-if simulator (9 interventions), compliance tracker, AI copilot chat, PDF briefing generator, citizen complaint portal.</p>
              </div>

              {/* Dark accent block */}
              <div className="md:col-span-6 rounded-2xl p-10 text-white" style={{ backgroundColor: "#2d3133" }}>
                <p className="font-label text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: "#b6b4ff" }}>Equity-First Design</p>
                <h3 className="font-headline text-2xl font-bold mb-4">Schools and hospitals<br />get alerts first.</h3>
                <p className="text-white/65 leading-relaxed">
                  When a ward crosses AQI&nbsp;300, schools and hospitals in that zone are prioritized for notification before general advisories go out. GRAP stage auto-detection with mandatory action checklists. Browser push notifications for crossing thresholds.
                </p>
              </div>

              <div className="md:col-span-6 bg-surface-lowest p-10 rounded-2xl">
                <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-4">Bidirectional</p>
                <h3 className="font-headline text-2xl font-bold mb-4">Citizens report back.</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Complaint portal lets citizens report visible pollution&mdash;construction dust, waste burning, industrial smoke&mdash;by ward and source type. Creates a ground-truth feedback loop that validates sensor data and gives MCD actionable field intelligence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CITIZEN vs OFFICER ═══ */}
        <section className="py-28 px-8 bg-surface-low">
          <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Citizen */}
            <div className="bg-surface-lowest p-12 rounded-2xl">
              <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-8">For Citizens</p>
              <h3 className="font-headline text-3xl font-bold mb-8">Your ward.<br />Your air.</h3>
              <ul className="space-y-5 mb-10">
                {[
                  "Hyper-local AQI for your exact ward, not a city average",
                  "Health advisories by age group and respiratory conditions",
                  "48-hour forecast to plan outdoor activities",
                  "Source breakdown\u2014know what\u2019s polluting your air",
                  "Hindi + English throughout",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[15px]">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                    <span className="text-on-surface-variant">{t}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="inline-block px-8 py-4 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-sm" style={{ border: "2px solid #3525cd" }}>
                Check Your Ward
              </Link>
            </div>

            {/* Officer */}
            <div className="rounded-2xl p-12 text-white" style={{ backgroundColor: "#2d3133" }}>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] mb-8" style={{ color: "#b6b4ff" }}>For MCD Officers</p>
              <h3 className="font-headline text-3xl font-bold mb-8">Evidence-backed<br />enforcement.</h3>
              <ul className="space-y-5 mb-10">
                {[
                  "Source apportionment to target enforcement precisely",
                  "What-if simulator\u2014test policy impact before deploying",
                  "Auto-generated notices with Air Act legal citations",
                  "GRAP compliance tracker with mandatory actions",
                  "LOSO-validated accuracy metrics for judicial credibility",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[15px]">
                    <span className="material-symbols-outlined text-lg mt-0.5" style={{ color: "#b6b4ff" }}>verified</span>
                    <span className="text-white/75">{t}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-in" className="inline-block px-8 py-4 text-white font-bold rounded-xl hover:opacity-90 transition-all text-sm" style={{ background: "linear-gradient(135deg, #3525cd, #4f46e5)" }}>
                Officer Login
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ TECH STACK — Minimal ═══ */}
        <section className="py-20 px-8">
          <div className="max-w-[1320px] mx-auto">
            <div className="bg-surface-lowest rounded-xl px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-10 font-label text-xs text-on-surface-variant uppercase tracking-widest">
                {["WAQI", "OpenWeatherMap", "SAFAR", "Sentinel-5P", "Groq"].map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="font-label text-[10px] text-outline uppercase tracking-widest text-right">
                Next.js 16 &bull; FastAPI &bull; XGBoost &bull; Prophet &bull; Kriging &bull; Clerk &bull; Recharts
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TEAM ═══ */}
        <section id="team" className="py-28 px-8 bg-surface-low">
          <div className="max-w-[900px] mx-auto">
            <p className="font-label text-[11px] text-primary uppercase tracking-[0.25em] mb-4">India Innovates 2026</p>
            <h2 className="font-headline text-4xl font-bold mb-4">Team AKX</h2>
            <p className="text-on-surface-variant mb-14 max-w-md">Built for the Municipal Corporation of Delhi. Designed to make invisible pollution visible and actionable.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Aayush Kumar", role: "Lead System Architect", init: "AK" },
                { name: "Shourya Singh", role: "Data Intelligence", init: "SS" },
                { name: "Divyansh Aggarwal", role: "Geospatial Engineering", init: "DA" },
              ].map((m) => (
                <div key={m.name} className="bg-surface-lowest p-8 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/8 flex items-center justify-center mb-5">
                    <span className="font-label text-sm font-bold text-primary">{m.init}</span>
                  </div>
                  <p className="font-bold text-on-surface text-[15px]">{m.name}</p>
                  <p className="font-label text-[11px] text-on-surface-variant mt-1 uppercase tracking-wider">{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-36 px-8 bg-surface-lowest">
          <div className="max-w-[800px] mx-auto">
            <h2 className="font-headline font-bold text-on-surface leading-tight mb-8" style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}>
              Decipher the air<br />you breathe.
            </h2>
            <p className="text-on-surface-variant text-lg mb-14 max-w-md">
              Real-time. Ward-level. Source-identified.<br />
              Forecast-enabled. Enforcement-ready.
            </p>
            <CtaAuthButtons />
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-surface-low py-16 px-8">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <span className="font-headline text-lg text-on-surface block mb-4">AirGuard</span>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-2">Hyper-local air quality intelligence for the Municipal Corporation of Delhi.</p>
            <p className="text-xs text-outline">Built by Team AKX for India Innovates 2026</p>
          </div>
          <div className="md:col-span-2 md:col-start-7">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">Platform</p>
            <div className="flex flex-col gap-3 text-sm text-on-surface-variant">
              <Link href="/sign-up" className="hover:text-primary transition-colors">Citizen Dashboard</Link>
              <Link href="/sign-in" className="hover:text-primary transition-colors">Admin Portal</Link>
              <span>API Documentation</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">Models</p>
            <div className="flex flex-col gap-3 text-sm text-on-surface-variant">
              <span>XGBoost Classifier</span>
              <span>Prophet Forecaster</span>
              <span>IDW / Kriging</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">Legal</p>
            <div className="flex flex-col gap-3 text-sm text-on-surface-variant">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Data Governance</span>
            </div>
          </div>
        </div>
        <div className="max-w-[1320px] mx-auto flex justify-between items-center pt-8" style={{ borderTop: "1px solid #e0e3e5" }}>
          <div className="font-label text-[10px] text-outline uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />All Systems Operational
          </div>
          <span className="font-label text-[10px] text-outline uppercase tracking-widest">&copy; 2026 Team AKX &bull; India Innovates</span>
        </div>
      </footer>
    </div>
  );
}
