import type { HealthAdvisory, GRAPAlert, PriorityAlert, WardData } from "./types";

const HEALTH_ADVISORIES: Record<string, HealthAdvisory> = {
  Good: {
    general: "Air quality is satisfactory. Enjoy outdoor activities.",
    sensitive: "No special precautions needed.",
    children: "Children can play outdoors freely.",
    hindi: "\u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0938\u0902\u0924\u094b\u0937\u091c\u0928\u0915 \u0939\u0948\u0964 \u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f\u092f\u094b\u0902 \u0915\u093e \u0906\u0928\u0902\u0926 \u0932\u0947\u0902\u0964",
  },
  Satisfactory: {
    general: "Air quality is acceptable. Unusually sensitive people may experience minor issues.",
    sensitive: "People with respiratory conditions should monitor symptoms.",
    children: "Children can play outdoors but limit strenuous activity.",
    hindi: "\u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0938\u094d\u0935\u0940\u0915\u093e\u0930\u094d\u092f \u0939\u0948\u0964 \u0905\u0924\u094d\u092f\u0927\u093f\u0915 \u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932 \u0932\u094b\u0917\u094b\u0902 \u0915\u094b \u092e\u093e\u092e\u0942\u0932\u0940 \u0938\u092e\u0938\u094d\u092f\u093e \u0939\u094b \u0938\u0915\u0924\u0940 \u0939\u0948\u0964",
  },
  Moderate: {
    general: "Breathing discomfort for people with lung/heart disease. Limit prolonged outdoor exertion.",
    sensitive: "Reduce prolonged outdoor exertion. Keep rescue medications available.",
    children: "Limit outdoor play to 30 minutes. Keep windows closed during peak hours.",
    hindi: "\u092b\u0947\u092b\u0921\u093c\u0947/\u0939\u0943\u0926\u092f \u0930\u094b\u0917 \u0935\u093e\u0932\u0947 \u0932\u094b\u0917\u094b\u0902 \u0915\u094b \u0938\u093e\u0902\u0938 \u0932\u0947\u0928\u0947 \u092e\u0947\u0902 \u0924\u0915\u0932\u0940\u092b\u0964 \u0932\u0902\u092c\u0947 \u0938\u092e\u092f \u0924\u0915 \u092c\u093e\u0939\u0930\u0940 \u092a\u0930\u093f\u0936\u094d\u0930\u092e \u0938\u0940\u092e\u093f\u0924 \u0915\u0930\u0947\u0902\u0964",
  },
  Poor: {
    general: "Breathing discomfort on prolonged exposure. Avoid outdoor exertion.",
    sensitive: "Stay indoors. Use air purifier if available. Wear N95 mask if going outside.",
    children: "Schools should cancel outdoor activities. Keep children indoors.",
    hindi: "\u0932\u0902\u092c\u0947 \u0938\u092e\u092f \u0924\u0915 \u0938\u0902\u092a\u0930\u094d\u0915 \u092e\u0947\u0902 \u0930\u0939\u0928\u0947 \u092a\u0930 \u0938\u093e\u0902\u0938 \u0932\u0947\u0928\u0947 \u092e\u0947\u0902 \u0924\u0915\u0932\u0940\u092b\u0964 \u092c\u093e\u0939\u0930\u0940 \u092a\u0930\u093f\u0936\u094d\u0930\u092e \u0938\u0947 \u092c\u091a\u0947\u0902\u0964",
  },
  "Very Poor": {
    general: "Respiratory illness on prolonged exposure. Limit all outdoor activity.",
    sensitive: "Stay indoors with windows sealed. Use air purifier. Seek medical help if symptoms worsen.",
    children: "Schools should consider closure. No outdoor activity. Emergency inhalers on standby.",
    hindi: "\u0932\u0902\u092c\u0947 \u0938\u092e\u092f \u0924\u0915 \u0938\u0902\u092a\u0930\u094d\u0915 \u092e\u0947\u0902 \u0930\u0939\u0928\u0947 \u092a\u0930 \u0936\u094d\u0935\u0938\u0928 \u0930\u094b\u0917\u0964 \u0938\u092d\u0940 \u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f\u092f\u093e\u0901 \u0938\u0940\u092e\u093f\u0924 \u0915\u0930\u0947\u0902\u0964",
  },
  Severe: {
    general: "Affects healthy people. Serious impact on those with existing conditions. Stay indoors.",
    sensitive: "Medical emergency level. Stay indoors. Consider evacuation from highest AQI zones.",
    children: "Schools MUST close. No outdoor activity. Emergency medical support on standby.",
    hindi: "\u0938\u094d\u0935\u0938\u094d\u0925 \u0932\u094b\u0917\u094b\u0902 \u0915\u094b \u092d\u0940 \u092a\u094d\u0930\u092d\u093e\u0935\u093f\u0924 \u0915\u0930\u0924\u093e \u0939\u0948\u0964 \u092e\u094c\u091c\u0942\u0926\u093e \u092c\u0940\u092e\u093e\u0930\u0940 \u0935\u093e\u0932\u094b\u0902 \u092a\u0930 \u0917\u0902\u092d\u0940\u0930 \u092a\u094d\u0930\u092d\u093e\u0935\u0964 \u0918\u0930 \u0915\u0947 \u0905\u0902\u0926\u0930 \u0930\u0939\u0947\u0902\u0964",
  },
};

const GRAP_ALERTS: Record<number, GRAPAlert> = {
  0: { stage: "Normal", actions: [], citizen_message: "No GRAP restrictions currently active." },
  1: { stage: "Stage I - Poor AQI (201-300)", actions: ["Intensified road sweeping and water sprinkling", "Strict enforcement on dust control at construction sites", "Advisory to avoid open burning"], citizen_message: "GRAP Stage I active. Reduce vehicle usage. Avoid burning waste." },
  2: { stage: "Stage II - Very Poor AQI (301-400)", actions: ["Ban on coal/firewood in restaurants and open eateries", "Restriction on diesel generators", "Enhanced public transport frequency"], citizen_message: "GRAP Stage II active. Use public transport. Avoid outdoor exercise." },
  3: { stage: "Stage III - Severe AQI (401-450)", actions: ["Ban on all construction and demolition activities", "Closure of brick kilns, hot mix plants, stone crushers", "Restriction on BS-IV and below diesel vehicles"], citizen_message: "GRAP Stage III active. Work from home if possible. N95 masks mandatory outdoors." },
  4: { stage: "Stage IV - Severe+ AQI (>450)", actions: ["Ban on entry of trucks except essential services", "Ban on ALL construction activities", "Possible school closures", "50% staff work-from-home in government offices"], citizen_message: "GRAP Stage IV EMERGENCY. Stay indoors. Schools may close. Avoid all outdoor activity." },
};

export function getHealthAdvisory(aqi: number): HealthAdvisory {
  let category: string;
  if (aqi <= 50) category = "Good";
  else if (aqi <= 100) category = "Satisfactory";
  else if (aqi <= 200) category = "Moderate";
  else if (aqi <= 300) category = "Poor";
  else if (aqi <= 400) category = "Very Poor";
  else category = "Severe";
  return HEALTH_ADVISORIES[category] || HEALTH_ADVISORIES["Moderate"];
}

export function getGrapAlert(aqi: number): GRAPAlert {
  if (aqi <= 200) return GRAP_ALERTS[0];
  if (aqi <= 300) return GRAP_ALERTS[1];
  if (aqi <= 400) return GRAP_ALERTS[2];
  if (aqi <= 450) return GRAP_ALERTS[3];
  return GRAP_ALERTS[4];
}

export function generatePriorityAlerts(wardData: WardData[]): PriorityAlert[] {
  return wardData
    .filter((w) => w.aqi >= 300)
    .sort((a, b) => b.aqi - a.aqi)
    .map((ward) => {
      const advisory = getHealthAdvisory(ward.aqi);
      const grap = getGrapAlert(ward.aqi);
      return {
        ward_name: ward.ward_name,
        ward_no: ward.ward_no,
        aqi: ward.aqi,
        category: ward.category,
        priority: ward.aqi >= 400 ? "CRITICAL" : "HIGH",
        health_advisory: advisory.general,
        health_advisory_hindi: advisory.hindi,
        children_advisory: advisory.children,
        grap_stage: grap.stage,
        grap_actions: grap.actions,
        citizen_message: grap.citizen_message,
      };
    });
}
