"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface Settings {
  modelTier: "standard" | "advanced" | "basic";
  interpolation: "idw" | "kriging";
}

interface SettingsContextType extends Settings {
  setModelTier: (tier: Settings["modelTier"]) => void;
  setInterpolation: (method: Settings["interpolation"]) => void;
  modelLabel: string;
  interpolationLabel: string;
}

const SettingsContext = createContext<SettingsContextType>({
  modelTier: "standard",
  interpolation: "idw",
  setModelTier: () => {},
  setInterpolation: () => {},
  modelLabel: "Standard (XGBoost/Prophet)",
  interpolationLabel: "IDW (Fast)",
});

const MODEL_LABELS: Record<string, string> = {
  standard: "Standard (XGBoost / Prophet)",
  advanced: "Advanced (LSTM)",
  basic: "Basic (IDW / Heuristic)",
};

const INTERP_LABELS: Record<string, string> = {
  idw: "IDW (Fast)",
  kriging: "Kriging (Accurate)",
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [modelTier, setModelTierState] = useState<Settings["modelTier"]>("standard");
  const [interpolation, setInterpolationState] = useState<Settings["interpolation"]>("idw");

  useEffect(() => {
    const saved = localStorage.getItem("airguard_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.modelTier) setModelTierState(parsed.modelTier);
        if (parsed.interpolation) setInterpolationState(parsed.interpolation);
      } catch { /* ignore */ }
    }
  }, []);

  const persist = (mt: string, ip: string) => {
    localStorage.setItem("airguard_settings", JSON.stringify({ modelTier: mt, interpolation: ip }));
  };

  const setModelTier = (tier: Settings["modelTier"]) => {
    setModelTierState(tier);
    persist(tier, interpolation);
  };

  const setInterpolation = (method: Settings["interpolation"]) => {
    setInterpolationState(method);
    persist(modelTier, method);
  };

  return (
    <SettingsContext.Provider value={{
      modelTier, interpolation, setModelTier, setInterpolation,
      modelLabel: MODEL_LABELS[modelTier],
      interpolationLabel: INTERP_LABELS[interpolation],
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
