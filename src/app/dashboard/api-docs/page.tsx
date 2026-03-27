"use client";

import { useState } from "react";

const API_ENDPOINTS = [
  {
    method: "GET", path: "/api/wards", title: "Ward-Level AQI Data",
    desc: "Returns AQI for all 250+ Delhi wards via IDW interpolation from live CPCB stations. Includes GeoJSON for map rendering.",
    params: "?method=idw|kriging",
    response: '{ wardData: [...], geoJSON: {...}, stations: [...], source: "live (WAQI, 28 stations)" }',
  },
  {
    method: "GET", path: "/api/stations", title: "Live CPCB Stations",
    desc: "Returns real-time AQI, PM2.5, PM10, NO2, SO2, CO from 28 Delhi CPCB monitoring stations via WAQI.",
    params: "",
    response: '{ stations: [{ name, latitude, longitude, aqi, pm25, pm10, no2, so2, co, timestamp }], source }',
  },
  {
    method: "GET", path: "/api/weather", title: "Delhi Weather",
    desc: "Live meteorological data from OpenWeatherMap: temperature, humidity, wind speed/direction, conditions.",
    params: "",
    response: '{ temperature, humidity, wind_speed, wind_direction, description, source: "openweathermap" }',
  },
  {
    method: "GET", path: "/api/forecast", title: "48-Hour PM2.5 Forecast",
    desc: "PM2.5 predictions with confidence intervals. Uses Prophet/LSTM via ML backend, falls back to linear extrapolation.",
    params: "?pm25=120&hours=48&station=DLCPCB001&ward=Ward+1",
    response: '{ forecast: [{ timestamp, pm25_predicted, pm25_lower, pm25_upper }], model_used }',
  },
  {
    method: "GET", path: "/api/sources", title: "Source Apportionment",
    desc: "Identifies pollution sources using XGBoost classifier (8 types). Falls back to ratio-based fingerprinting.",
    params: "?pm25=100&pm10=180&no2=40&so2=15&co=1.5",
    response: '{ sources: { road_dust: 18.2, vehicular_traffic: 25.1, ... }, model_used: "xgboost"|"fingerprinting" }',
  },
  {
    method: "POST", path: "/api/simulator", title: "What-If Policy Simulator",
    desc: "Simulates the impact of 9 policy interventions on PM2.5/AQI with per-source reduction breakdown.",
    params: 'Body: { currentPm25, sourceBreakdown, selectedInterventions: ["Ban construction in ward"] }',
    response: '{ before: { pm25, aqi, sources }, after: { pm25, aqi, sources }, reduction_pct }',
  },
  {
    method: "POST", path: "/api/enforcement", title: "Enforcement Notice Generator",
    desc: "Generates MCD enforcement notices. Template mode (instant) or LLM mode (Groq Llama-3.3 70B AI).",
    params: 'Body: { wardName, wardNo, aqi, pm25, language: "english"|"hindi"|"both", mode: "template"|"llm" }',
    response: '{ notice: "...", sources, primary_source, model_used: "template"|"groq_llm" }',
  },
  {
    method: "POST", path: "/api/chat", title: "AI Copilot Chat",
    desc: "Natural language interface powered by Groq Llama-3.3 70B. Responses are grounded in current AQI data.",
    params: 'Body: { message: "Which wards need attention?", context?: {...} }',
    response: '{ reply: "Based on current data, ...", model: "llama-3.3-70b-versatile" }',
  },
  {
    method: "GET", path: "/api/satellite", title: "Satellite AOD Data",
    desc: "Synthetic Sentinel-5P / MODIS Aerosol Optical Depth grid with PM2.5 correlation and hotspot detection.",
    params: "",
    response: '{ aod: [...], correlation: [...], dustPlumes: 12, biomassHotspots: 5, meanAOD: 0.742 }',
  },
  {
    method: "GET", path: "/api/validate", title: "LOSO Cross-Validation",
    desc: "Runs Leave-One-Station-Out cross-validation on 39 stations. Returns RMSE, MAE, R² and per-station errors.",
    params: "?method=idw|kriging",
    response: '{ rmse: 22.4, mae: 17.8, r2: 0.847, n_stations: 39, station_errors: [...] }',
  },
  {
    method: "GET", path: "/api/vulnerability", title: "Vulnerability Index",
    desc: "Computes ward vulnerability: 0.5*AQI + 0.25*school_density + 0.25*hospital_density.",
    params: "",
    response: '{ vulnerability: [{ ward_name, aqi, vulnerability_score, vuln_category }] }',
  },
];

export default function ApiDocsPage() {
  const [testResult, setTestResult] = useState<{ path: string; data: string } | null>(null);
  const [testing, setTesting] = useState("");

  const testEndpoint = async (endpoint: typeof API_ENDPOINTS[0]) => {
    setTesting(endpoint.path);
    try {
      const isPost = endpoint.method === "POST";
      const url = endpoint.path + (endpoint.method === "GET" && endpoint.params ? endpoint.params : "");
      const res = await fetch(url, isPost ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: endpoint.path === "/api/chat"
          ? JSON.stringify({ message: "Give me a 1-sentence summary of Delhi air quality right now." })
          : endpoint.path === "/api/enforcement"
          ? JSON.stringify({ wardName: "Anand Vihar", wardNo: 1, aqi: 350, pm25: 200, language: "english", mode: "template" })
          : JSON.stringify({ currentPm25: 150, sourceBreakdown: { road_dust: 20, vehicular_traffic: 30, biomass_burning: 15, construction_dust: 15, industrial: 10, secondary_aerosols: 5, waste_burning: 3, diesel_generators: 2 }, selectedInterventions: ["Odd-even traffic rule"] }),
      } : undefined);
      const data = await res.json();
      const preview = JSON.stringify(data, null, 2).slice(0, 1500);
      setTestResult({ path: endpoint.path, data: preview + (preview.length >= 1500 ? "\n..." : "") });
    } catch (e) {
      setTestResult({ path: endpoint.path, data: `Error: ${(e as Error).message}` });
    }
    setTesting("");
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-headline text-4xl font-bold">API Documentation</h2>
        <p className="text-on-surface-variant text-sm mt-2">
          {API_ENDPOINTS.length} endpoints powering the AirGuard platform. All endpoints return JSON. POST endpoints accept JSON bodies.
        </p>
      </div>

      <div className="bg-primary/5 p-6 rounded-xl" style={{ border: "1px solid rgba(53,37,205,0.1)" }}>
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-primary mt-0.5">integration_instructions</span>
          <div>
            <h4 className="font-bold text-primary text-sm">Integration Ready</h4>
            <p className="text-sm text-on-surface-variant mt-1">
              All endpoints are accessible at <span className="font-label text-xs bg-surface-high px-2 py-0.5 rounded">http://localhost:3000/api/*</span>. When the ML backend is running on port 8000, endpoints automatically use real Python models (XGBoost, Prophet, Kriging). Otherwise they fall back to TypeScript heuristics.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {API_ENDPOINTS.map((ep) => (
          <div key={ep.path} className="bg-surface-lowest rounded-xl overflow-hidden" style={{ border: "1px solid rgba(199,196,216,0.1)" }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`font-label text-xs font-bold px-2.5 py-1 rounded ${ep.method === "GET" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                  {ep.method}
                </span>
                <code className="font-label text-sm text-on-surface">{ep.path}</code>
                <span className="flex-1" />
                <button
                  onClick={() => testEndpoint(ep)}
                  disabled={testing === ep.path}
                  className="font-label text-xs text-primary font-bold uppercase tracking-widest hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">{testing === ep.path ? "hourglass_top" : "play_arrow"}</span>
                  {testing === ep.path ? "Testing..." : "Try It"}
                </button>
              </div>
              <h3 className="font-headline text-lg font-bold mb-2">{ep.title}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{ep.desc}</p>
              {ep.params && (
                <div className="mb-3">
                  <span className="font-label text-[10px] text-slate-400 uppercase tracking-widest">Parameters</span>
                  <pre className="mt-1 font-label text-xs text-slate-600 bg-surface-low p-3 rounded-lg overflow-x-auto">{ep.params}</pre>
                </div>
              )}
              <div>
                <span className="font-label text-[10px] text-slate-400 uppercase tracking-widest">Response Shape</span>
                <pre className="mt-1 font-label text-xs text-slate-600 bg-surface-low p-3 rounded-lg overflow-x-auto">{ep.response}</pre>
              </div>
            </div>
            {testResult?.path === ep.path && (
              <div className="bg-slate-900 text-emerald-400 p-4 font-label text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                <pre>{testResult.data}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
