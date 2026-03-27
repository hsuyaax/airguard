/**
 * AirGuard — Forecaster
 * Ported from models/forecaster.py + models/lstm_forecaster.py
 * Three-tier: Prophet (N/A in JS) → Linear Extrapolation → Flat Forecast
 */

import type { ForecastPoint } from "./types";

/**
 * Linear trend extrapolation from last 24 data points.
 * Dampens slope by 0.5 to avoid extreme extrapolation.
 */
export function linearForecast(
  historicalPm25: number[],
  hours = 48
): ForecastPoint[] {
  const data = historicalPm25.slice(-24).filter((v) => !isNaN(v));
  if (data.length < 2) return flatForecast(hours, data[0] || 100);

  // Fit linear trend
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = data.reduce((a, b) => a + b, 0) / n;
  const ssXY = x.reduce((s, xi, i) => s + (xi - meanX) * (data[i] - meanY), 0);
  const ssXX = x.reduce((s, xi) => s + (xi - meanX) ** 2, 0);
  const slope = (ssXX === 0 ? 0 : ssXY / ssXX) * 0.5; // Dampen
  const intercept = meanY - slope * meanX;

  // Standard deviation for confidence bands
  const std = Math.sqrt(data.reduce((s, v) => s + (v - meanY) ** 2, 0) / Math.max(n - 1, 1));

  const now = Date.now();
  const points: ForecastPoint[] = [];

  for (let h = 0; h < hours; h++) {
    const xFuture = n + h;
    const predicted = Math.min(500, Math.max(0, slope * xFuture + intercept));
    const uncertainty = std * Math.sqrt((h + 1) / 6);

    points.push({
      timestamp: new Date(now + (h + 1) * 3600000).toISOString(),
      pm25_predicted: Math.round(predicted * 10) / 10,
      pm25_lower: Math.round(Math.max(0, predicted - uncertainty) * 10) / 10,
      pm25_upper: Math.round(Math.min(500, predicted + uncertainty) * 10) / 10,
    });
  }

  return points;
}

/** Flat forecast at a base value when no data is available */
export function flatForecast(hours = 48, baseValue = 100): ForecastPoint[] {
  const now = Date.now();
  return Array.from({ length: hours }, (_, h) => ({
    timestamp: new Date(now + (h + 1) * 3600000).toISOString(),
    pm25_predicted: baseValue,
    pm25_lower: Math.max(0, baseValue - 30),
    pm25_upper: Math.min(500, baseValue + 30),
  }));
}

/**
 * Forecast for a ward by averaging forecasts of nearest stations.
 * This mirrors forecast_ward() from forecaster.py
 */
export function forecastWard(
  wardPm25: number,
  stationPm25Values: number[],
  hours = 48
): ForecastPoint[] {
  // Use available station data for linear extrapolation
  if (stationPm25Values.length >= 2) {
    return linearForecast(stationPm25Values, hours);
  }
  // Fallback to flat forecast at the ward's current PM2.5
  return flatForecast(hours, wardPm25);
}
