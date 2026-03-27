"use client";

import { useEffect, useRef, useState } from "react";
import type { WardData, WardGeoJSON, Station } from "@/lib/types";
import { DELHI_CENTER } from "@/lib/config";

export function AqiMap({
  wardData,
  geoJSON,
  stations,
}: {
  wardData: WardData[];
  geoJSON: WardGeoJSON;
  stations: Station[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    // Prevent double-init from React strict mode or hot reload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((container as any)._leaflet_id) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      // Double-check after async — another mount may have initialized it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) return;

      const map = L.map(mapRef.current, {
        center: DELHI_CENTER,
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.geoJSON(geoJSON as GeoJSON.GeoJsonObject, {
        style: (feature) => ({
          fillColor: feature?.properties?.color || "#999",
          color: "#cbd5e1",
          weight: 0.5,
          fillOpacity: 0.55,
        }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindTooltip(
            `<div style="font-family:'Space Grotesk',monospace;font-size:11px;"><b>${p.ward_name_display}</b><br/>AQI: <b>${p.aqi}</b><br/>PM2.5: ${p.pm25} \u00b5g/m\u00b3<br/>${p.category}</div>`,
            { sticky: true }
          );
          layer.on("mouseover", () => { (layer as L.Path).setStyle({ weight: 2, fillOpacity: 0.8, color: "#3525cd" }); });
          layer.on("mouseout", () => { (layer as L.Path).setStyle({ weight: 0.5, fillOpacity: 0.55, color: "#cbd5e1" }); });
        },
      }).addTo(map);

      stations.forEach((s) => {
        if (!s.latitude || !s.longitude) return;
        const color = s.aqi && s.aqi <= 50 ? "#009966" : s.aqi && s.aqi <= 100 ? "#58bc50" : s.aqi && s.aqi <= 200 ? "#ffde33" : s.aqi && s.aqi <= 300 ? "#ff9933" : s.aqi && s.aqi <= 400 ? "#cc0033" : "#7e0023";
        L.circleMarker([s.latitude, s.longitude], {
          radius: 6,
          color: "#fff",
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        })
          .bindPopup(`<div style="font-family:'Inter',sans-serif;font-size:12px;min-width:160px;"><b>${s.name}</b><br/>AQI: <b>${s.aqi}</b><br/>PM2.5: ${s.pm25} \u00b5g/m\u00b3</div>`)
          .addTo(map);
      });

      mapInstance.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [geoJSON, stations, wardData]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-surface-low" style={{ minHeight: "500px" }}>
      <div ref={mapRef} className="w-full h-[500px]" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-low">
          <div className="text-slate-400 font-label text-xs uppercase tracking-widest animate-pulse">Loading map...</div>
        </div>
      )}
    </div>
  );
}
