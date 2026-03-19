import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import PaymentSchedule from "@/models/PaymentSchedule";
import { z } from "zod";

const bodySchema = z.object({
  scheduleId: z.string(),
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
    const data = bodySchema.parse(body);
    await connectDB();

    const schedule = await PaymentSchedule.findById(data.scheduleId);
    if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    if (schedule.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

    const effectiveDue = (schedule.amount || 0) + (schedule.carryForwardAmount || 0);
    const shortfall = Math.max(0, effectiveDue - data.amount);

    const payment = await Payment.create({
      loanId: schedule.loanId,
      scheduleIds: [schedule._id],
      amount: data.amount,
      paidAt: new Date(data.paidAt),
      method: data.method,
      bankAccountId: data.bankAccountId,
      bankName: data.bankName,
      transactionTime: data.transactionTime ? new Date(data.transactionTime) : undefined,
      referenceNote: data.referenceNote,
    });

    await PaymentSchedule.updateOne(
      { _id: schedule._id },
      {
        $set: {
          status: "paid",
          paidAmount: data.amount,
          paidAt: new Date(data.paidAt),
          paymentId: payment._id,
        },
      }
    );

    if (shortfall > 0) {
      const nextRow = await PaymentSchedule.findOne({
        loanId: schedule.loanId,
        dueDate: { $gt: schedule.dueDate },
        status: { $ne: "paid" },
      }).sort({ dueDate: 1 });
      if (nextRow) {
        await PaymentSchedule.updateOne(
          { _id: nextRow._id },
          { $inc: { carryForwardAmount: shortfall } }
        );
      }
    }

    return NextResponse.json({ success: true, payment });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
