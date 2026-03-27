// AirGuard - Configuration

export const WAQI_API_TOKEN = process.env.WAQI_API_TOKEN || "YOUR_TOKEN_HERE";
export const OWM_API_KEY = process.env.OWM_API_KEY || "";
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export const DELHI_CENTER: [number, number] = [28.6139, 77.2090];

export const DELHI_LAT_MIN = 28.40;
export const DELHI_LAT_MAX = 28.88;
export const DELHI_LON_MIN = 76.84;
export const DELHI_LON_MAX = 77.35;

export const AQI_BREAKPOINTS_PM25 = [
  { cLo: 0, cHi: 30, iLo: 0, iHi: 50, category: "Good" as const, color: "#009966" },
  { cLo: 31, cHi: 60, iLo: 51, iHi: 100, category: "Satisfactory" as const, color: "#58bc50" },
  { cLo: 61, cHi: 90, iLo: 101, iHi: 200, category: "Moderate" as const, color: "#ffde33" },
  { cLo: 91, cHi: 120, iLo: 201, iHi: 300, category: "Poor" as const, color: "#ff9933" },
  { cLo: 121, cHi: 250, iLo: 301, iHi: 400, category: "Very Poor" as const, color: "#cc0033" },
  { cLo: 251, cHi: 500, iLo: 401, iHi: 500, category: "Severe" as const, color: "#7e0023" },
];

export const AQI_CATEGORIES = [
  { lo: 0, hi: 50, category: "Good", color: "#009966", advisory: "Air quality is satisfactory. Enjoy outdoor activities." },
  { lo: 51, hi: 100, category: "Satisfactory", color: "#58bc50", advisory: "Minor breathing discomfort to sensitive people." },
  { lo: 101, hi: 200, category: "Moderate", color: "#ffde33", advisory: "Breathing discomfort to people with lungs/heart disease." },
  { lo: 201, hi: 300, category: "Poor", color: "#ff9933", advisory: "Breathing discomfort on prolonged exposure. Avoid outdoor exertion." },
  { lo: 301, hi: 400, category: "Very Poor", color: "#cc0033", advisory: "Respiratory illness on prolonged exposure. Limit outdoor activity." },
  { lo: 401, hi: 500, category: "Severe", color: "#7e0023", advisory: "Affects healthy people. Serious impact on those with existing conditions. Avoid all outdoor activity." },
];

export const SOURCE_TYPES = [
  "road_dust", "construction_dust", "biomass_burning", "vehicular_traffic",
  "industrial", "secondary_aerosols", "waste_burning", "diesel_generators",
] as const;

export const INTERVENTIONS: Record<string, Record<string, number>> = {
  "Ban construction in ward": { road_dust: -40, construction_dust: -70 },
  "Odd-even traffic rule": { vehicular_traffic: -30 },
  "Close brick kilns (50km radius)": { industrial: -50 },
  "Ban crop burning (50km radius)": { biomass_burning: -60 },
  "Water sprinkling on roads": { road_dust: -25 },
  "Switch to electric buses": { vehicular_traffic: -15 },
  "Enforce DG set ban": { diesel_generators: -80 },
  "Ban open waste burning": { waste_burning: -70 },
  "Anti-smog guns at hotspots": { road_dust: -15, construction_dust: -20 },
};
