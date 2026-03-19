import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const type = req.nextUrl.searchParams.get("type"); // daily | weekly | monthly | loanType | paymentMode | bankWise
  const date = req.nextUrl.searchParams.get("date");
  const base = date ? new Date(date) : new Date();

  if (type === "daily") {
    const start = startOfDay(base);
    const end = endOfDay(base);
    const payments = await Payment.find({ paidAt: { $gte: start, $lte: end } })
      .populate({ path: "loanId", populate: { path: "clientId", select: "name" } })
      .populate("bankAccountId")
      .lean();
    const total = payments.reduce((s, p) => s + p.amount, 0);
    return NextResponse.json({ type: "daily", date: base.toISOString().slice(0, 10), total, payments });
  }

  if (type === "weekly") {
    const start = startOfWeek(base, { weekStartsOn: 1 });
    const end = endOfWeek(base, { weekStartsOn: 1 });
    const payments = await Payment.find({ paidAt: { $gte: start, $lte: end } })
      .populate({ path: "loanId", populate: { path: "clientId", select: "name" } })
      .populate("bankAccountId")
      .lean();
    const total = payments.reduce((s, p) => s + p.amount, 0);
    return NextResponse.json({ type: "weekly", start: start.toISOString(), end: end.toISOString(), total, payments });
  }

  if (type === "monthly") {
    const start = startOfMonth(base);
    const end = endOfMonth(base);
    const payments = await Payment.find({ paidAt: { $gte: start, $lte: end } })
      .populate({ path: "loanId", populate: { path: "clientId", select: "name" } })
      .populate("bankAccountId")
      .lean();
    const total = payments.reduce((s, p) => s + p.amount, 0);
    return NextResponse.json({ type: "monthly", month: base.getMonth(), year: base.getFullYear(), total, payments });
  }

  if (type === "loanType") {
    const agg = await Payment.aggregate([
      { $lookup: { from: "loans", localField: "loanId", foreignField: "_id", as: "loan" } },
      { $unwind: "$loan" },
      { $group: { _id: "$loan.loanType", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    return NextResponse.json({ type: "loanType", breakdown: agg });
  }

  if (type === "paymentMode") {
    const agg = await Payment.aggregate([{ $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } }]);
    return NextResponse.json({ type: "paymentMode", breakdown: agg });
  }

  if (type === "bankWise") {
    const agg = await Payment.aggregate([
      { $match: { method: "upi", bankAccountId: { $ne: null } } },
      { $lookup: { from: "bankaccounts", localField: "bankAccountId", foreignField: "_id", as: "bank" } },
      { $unwind: "$bank" },
      { $group: { _id: "$bank.bankName", upiId: { $first: "$bank.upiId" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    return NextResponse.json({ type: "bankWise", breakdown: agg });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
