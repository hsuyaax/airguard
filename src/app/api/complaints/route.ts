import { NextResponse } from "next/server";
import { saveComplaint, getComplaints } from "@/lib/db";

export async function GET() {
  try {
    const complaints = await getComplaints(100);
    return NextResponse.json({ complaints });
  } catch {
    return NextResponse.json({ complaints: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveComplaint({
      user_id: body.user_id || null,
      ward_name: body.ward_name,
      ward_no: body.ward_no || null,
      pollution_type: body.pollution_type,
      severity: body.severity,
      description: body.description || "",
    });
    return NextResponse.json({ success: true, complaint: result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
