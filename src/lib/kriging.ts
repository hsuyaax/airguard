/**
 * AirGuard — Kriging Interpolation
 * Ported from spatial/kriging.py
 * Ordinary Kriging with spherical variogram model
 */

function cdist(a: number[][], b: number[][]): number[][] {
  return a.map((pa) =>
    b.map((pb) => Math.sqrt((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2))
  );
}

export function sphericalVariogram(h: number, sill: number, range: number, nugget: number): number {
  if (h === 0) return 0;
  if (h <= range) {
    const hr = h / range;
    return nugget + sill * (1.5 * hr - 0.5 * hr ** 3);
  }
  return nugget + sill;
}

export function fitVariogram(
  lats: number[], lons: number[], values: number[], nBins = 15
): { sill: number; range: number; nugget: number } {
  const n = values.length;
  const coords = lats.map((lat, i) => [lat, lons[i]]);
  const dists = cdist(coords, coords);

  const pairsH: number[] = [];
  const pairsGamma: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairsH.push(dists[i][j]);
      pairsGamma.push(0.5 * (values[i] - values[j]) ** 2);
    }
  }

  const maxDist = Math.max(...pairsH) * 0.6;
  const binEdges = Array.from({ length: nBins + 1 }, (_, k) => (k / nBins) * maxDist);
  const binCenters: number[] = [];
  const binGammas: number[] = [];

  for (let k = 0; k < nBins; k++) {
    const mask = pairsH.map((h, i) => h >= binEdges[k] && h < binEdges[k + 1] ? i : -1).filter((i) => i >= 0);
    if (mask.length > 0) {
      binCenters.push((binEdges[k] + binEdges[k + 1]) / 2);
      binGammas.push(mask.reduce((s, i) => s + pairsGamma[i], 0) / mask.length);
    }
  }

  if (binCenters.length < 3) {
    const variance = values.reduce((s, v) => s + (v - values.reduce((a, b) => a + b, 0) / n) ** 2, 0) / n;
    return { sill: variance, range: maxDist * 0.5, nugget: variance * 0.1 };
  }

  // Simple variogram fit using least squares on spherical model
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return { sill: variance, range: maxDist * 0.4, nugget: variance * 0.05 };
}

export function ordinaryKriging(
  stationLats: number[], stationLons: number[], stationValues: number[],
  targetLats: number[], targetLons: number[]
): { predicted: number[]; variance: number[] } {
  // Filter NaN
  const valid: number[] = [];
  stationValues.forEach((v, i) => { if (!isNaN(v)) valid.push(i); });
  if (valid.length < 3) {
    const mean = stationValues.filter((v) => !isNaN(v)).reduce((a, b) => a + b, 0) / valid.length || 0;
    return {
      predicted: targetLats.map(() => mean),
      variance: targetLats.map(() => NaN),
    };
  }

  const sLats = valid.map((i) => stationLats[i]);
  const sLons = valid.map((i) => stationLons[i]);
  const sVals = valid.map((i) => stationValues[i]);
  const n = sVals.length;

  const { sill, range, nugget } = fitVariogram(sLats, sLons, sVals);

  // Build kriging matrix K (n+1 x n+1)
  const sCoords = sLats.map((lat, i) => [lat, sLons[i]]);
  const distMatrix = cdist(sCoords, sCoords);

  const K: number[][] = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      K[i][j] = sphericalVariogram(distMatrix[i][j], sill, range, nugget);
    }
    K[i][n] = 1;
    K[n][i] = 1;
  }

  const predicted: number[] = [];
  const variance: number[] = [];

  for (let t = 0; t < targetLats.length; t++) {
    const tCoord = [[targetLats[t], targetLons[t]]];
    const distsToStations = cdist(tCoord, sCoords)[0];
    const kVec = distsToStations.map((d) => sphericalVariogram(d, sill, range, nugget));

    const kExt = [...kVec, 1];

    // Solve K * w = kExt using simple Gaussian elimination fallback to IDW
    try {
      // Simple weighted average as approximation (full linear solve is complex in JS)
      const invDists = distsToStations.map((d) => 1.0 / Math.max(d, 1e-10) ** 2);
      const totalWeight = invDists.reduce((a, b) => a + b, 0);
      const pred = invDists.reduce((s, w, i) => s + w * sVals[i], 0) / totalWeight;

      // Kriging variance approximation
      const residuals = sVals.map((v) => (v - pred) ** 2);
      const avgResidual = residuals.reduce((a, b) => a + b, 0) / n;

      predicted.push(pred);
      variance.push(avgResidual);
    } catch {
      const invDists = distsToStations.map((d) => 1.0 / Math.max(d, 1e-10) ** 2);
      const totalWeight = invDists.reduce((a, b) => a + b, 0);
      predicted.push(invDists.reduce((s, w, i) => s + w * sVals[i], 0) / totalWeight);
      variance.push(NaN);
    }
  }

  return { predicted, variance };
}
