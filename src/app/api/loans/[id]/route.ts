import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Loan from "@/models/Loan";
import PaymentSchedule from "@/models/PaymentSchedule";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const id = (await params).id;
  const loan = await Loan.findById(id).populate("clientId").lean();
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  const schedule = await PaymentSchedule.find({ loanId: id }).sort({ dueDate: 1 }).lean();
  return NextResponse.json({ loan, schedule });
}
