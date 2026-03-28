import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ complaints: [] });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ complaints: [], error: error.message });
    return NextResponse.json({ complaints: data || [] });
  } catch {
    return NextResponse.json({ complaints: [] });
  }
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("complaints")
      .insert({
        user_id: body.user_id || null,
        ward_name: body.ward_name,
        ward_no: body.ward_no || null,
        pollution_type: body.pollution_type,
        severity: body.severity,
        description: body.description || "",
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, complaint: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
