import { NextResponse } from "next/server";
import { getWeather } from "@/lib/ingestion";
import { saveWeather } from "@/lib/db";

export async function GET() {
  try {
    const weather = await getWeather();
    saveWeather(weather).catch(() => {});
    return NextResponse.json(weather);
  } catch {
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
