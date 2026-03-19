import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Loan from "@/models/Loan";
import PaymentSchedule from "@/models/PaymentSchedule";

export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  const loans = await Loan.find({ status: "active" })
    .populate("clientId", "name mobile")
    .sort({ createdAt: -1 })
    .lean();

  const result = await Promise.all(
    loans.map(async (loan) => {
      const schedules = await PaymentSchedule.find({ loanId: loan._id }).sort({ dueDate: 1 }).lean();
      const unpaid = schedules.filter((s) => s.status !== "paid");
      const remaining = unpaid.reduce(
        (sum, s) => sum + (s.amount || 0) + (s.carryForwardAmount || 0),
        0
      );
      const nextRow = unpaid[0];
      const nextPaymentDate = nextRow ? nextRow.dueDate : null;
      const nextPaymentAmount = nextRow ? (nextRow.amount || 0) + (nextRow.carryForwardAmount || 0) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let paymentStatus = "upcoming";
      if (nextRow) {
        const due = new Date(nextRow.dueDate);
        due.setHours(0, 0, 0, 0);
        paymentStatus = due < today ? "overdue" : "upcoming";
      }
      return {
        ...loan,
        remainingAmount: remaining,
        nextPaymentDate,
        nextPaymentAmount,
        paymentStatus,
      };
    })
  );

  return NextResponse.json({ loans: result });
}
