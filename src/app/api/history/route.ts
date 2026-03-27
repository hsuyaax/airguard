import { NextResponse } from "next/server";
import { getAqiHistory } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get("hours") || "168");

  try {
    const history = await getAqiHistory(hours);
    return NextResponse.json({ history, source: "supabase" });
  } catch {
    return NextResponse.json({ history: [], source: "empty" });
  }
}
