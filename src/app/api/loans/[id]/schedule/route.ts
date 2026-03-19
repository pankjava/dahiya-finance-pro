import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PaymentSchedule from "@/models/PaymentSchedule";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const schedule = await PaymentSchedule.find({ loanId: (await params).id }).sort({ dueDate: 1 }).lean();
  return NextResponse.json({ schedule });
}
