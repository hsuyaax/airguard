export interface Station {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  aqi: number | null;
  timestamp: string;
  source: string;
}

export interface WardData {
  ward_name: string;
  ward_no: number;
  centroid_lat: number;
  centroid_lon: number;
  pm25: number;
  aqi: number;
  category: string;
  color: string;
}

export interface WardGeoJSON {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    ward_name_display: string;
    aqi: number;
    pm25: number;
    category: string;
    color: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  description: string;
  source: string;
  pressure?: number;
  visibility?: number;
}

export interface ForecastPoint {
  timestamp: string;
  pm25_predicted: number;
  pm25_lower: number;
  pm25_upper: number;
}

export interface SourceBreakdown {
  [source: string]: number;
}

export interface SimulationResult {
  before: {
    pm25: number;
    aqi: number | null;
    category: string;
    color: string;
    sources: Record<string, number>;
  };
  after: {
    pm25: number;
    aqi: number | null;
    category: string;
    color: string;
    sources: Record<string, number>;
  };
  reduction_pm25: number;
  reduction_pct: number;
  applied_interventions: Array<{
    intervention: string;
    source: string;
    reduction_pct: number;
    reduction_ug: number;
  }>;
}

export interface GRAPAlert {
  stage: string;
  actions: string[];
  citizen_message: string;
}

export interface HealthAdvisory {
  general: string;
  sensitive: string;
  children: string;
  hindi: string;
}

export interface PriorityAlert {
  ward_name: string;
  ward_no: number;
  aqi: number;
  category: string;
  priority: "CRITICAL" | "HIGH";
  health_advisory: string;
  health_advisory_hindi: string;
  children_advisory: string;
  grap_stage: string;
  grap_actions: string[];
  citizen_message: string;
}

export type AQICategory = "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
export type Language = "en" | "hi";
