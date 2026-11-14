import { NextRequest, NextResponse } from "next/server";
import { monthSlots } from "@/lib/store";

// Month view of the demo calendar: /api/availability?month=2026-11
export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
  }
  return NextResponse.json({ month, days: monthSlots(month), demo_data: true });
}
