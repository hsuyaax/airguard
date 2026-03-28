import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get("hours") || "168");

  if (!supabaseAdmin) {
    return NextResponse.json({ history: [], source: "supabase_not_configured" });
  }

  try {
    const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("aqi_history")
      .select("*")
      .gte("timestamp", cutoff)
      .order("timestamp", { ascending: true })
      .limit(2000);

    if (error) {
      return NextResponse.json({ history: [], source: "error", detail: error.message });
    }

    return NextResponse.json({ history: data || [], source: "supabase", count: data?.length || 0 });
  } catch (e) {
    return NextResponse.json({ history: [], source: "error", detail: (e as Error).message });
  }
}
