import type { WardData } from "./types";

const notifiedWards = new Set<string>();

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export function checkThresholds(wardData: WardData[]): WardData[] {
  return wardData.filter((w) => w.aqi >= 300);
}

export function sendNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: `airguard-${Date.now()}`,
    });
  } catch {
    // Notification API not available in this context
  }
}

export function setupAQIPolling(intervalMs = 300000): () => void {
  const poll = async () => {
    try {
      const res = await fetch("/api/wards");
      const data = await res.json();
      const wards: WardData[] = data.wardData || data.ward_data || [];
      const critical = checkThresholds(wards);

      for (const ward of critical) {
        const key = `${ward.ward_name}-${ward.aqi >= 400 ? "severe" : "critical"}`;
        if (!notifiedWards.has(key)) {
          notifiedWards.add(key);
          const severity = ward.aqi >= 400 ? "SEVERE" : "CRITICAL";
          sendNotification(
            `${severity}: ${ward.ward_name}`,
            `AQI has reached ${ward.aqi} (${ward.category}). Immediate action required.`
          );
        }
      }
    } catch {
      // Silently fail on network errors
    }
  };

  poll();
  const id = setInterval(poll, intervalMs);
  return () => clearInterval(id);
}
