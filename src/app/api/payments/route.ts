import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import PaymentSchedule from "@/models/PaymentSchedule";
import Loan from "@/models/Loan";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const loanId = req.nextUrl.searchParams.get("loanId");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const q: Record<string, unknown> = {};
  if (loanId) q.loanId = loanId;
  if (from) q.paidAt = { ...(q.paidAt as object), $gte: new Date(from) };
  if (to) q.paidAt = { ...(q.paidAt as object), $lte: new Date(to) };
  const payments = await Payment.find(q)
    .populate({ path: "loanId", populate: { path: "clientId", select: "name" } })
    .populate("bankAccountId")
    .sort({ paidAt: -1 })
    .lean();
  return NextResponse.json({ payments });
}

const createSchema = z.object({
  loanId: z.string(),
  scheduleIds: z.array(z.string()),
  amount: z.number().positive(),
  paidAt: z.string(),
  method: z.enum(["cash", "upi"]),
  bankAccountId: z.string().optional(),
  bankName: z.string().optional(),
  transactionTime: z.string().optional(),
  referenceNote: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    await connectDB();
    const payment = await Payment.create({
      ...data,
      paidAt: new Date(data.paidAt),
      transactionTime: data.transactionTime ? new Date(data.transactionTime) : undefined,
    });
    const schedules = await PaymentSchedule.find({ _id: { $in: data.scheduleIds } });
    for (const s of schedules) {
      const effectiveDue = (s.amount || 0) + (s.carryForwardAmount || 0);
      await PaymentSchedule.updateOne(
        { _id: s._id },
        { $set: { status: "paid", paidAmount: effectiveDue, paidAt: new Date(data.paidAt), paymentId: payment._id } }
      );
    }
    const updated = await Payment.findById(payment._id).populate("loanId").populate("bankAccountId").lean();
    return NextResponse.json({ payment: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
