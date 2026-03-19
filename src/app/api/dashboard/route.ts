import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import PaymentSchedule from "@/models/PaymentSchedule";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const range = req.nextUrl.searchParams.get("range") || "today"; // today | yesterday | last7 | lastMonth | tillDate
  const today = new Date();
  let rangeStart: Date;
  let rangeEnd: Date;
  switch (range) {
    case "yesterday": {
      const yesterday = subDays(today, 1);
      rangeStart = startOfDay(yesterday);
      rangeEnd = endOfDay(yesterday);
      break;
    }
    case "last7":
      rangeStart = startOfDay(subDays(today, 6));
      rangeEnd = endOfDay(today);
      break;
    case "lastMonth":
      rangeStart = startOfMonth(today);
      rangeEnd = endOfDay(today);
      break;
    case "tillDate":
      rangeStart = new Date(0);
      rangeEnd = endOfDay(today);
      break;
    default:
      rangeStart = startOfDay(today);
      rangeEnd = endOfDay(today);
  }

  const startToday = startOfDay(today);
  const [totalReceivedAll, pendingSchedules, missedSchedules, collectionInRange, byLoanTypeInRange, byModeInRange, byLoanTypeAll] = await Promise.all([
    Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).then((r) => r[0]?.total ?? 0),
    PaymentSchedule.aggregate([
      { $match: { status: "upcoming" } },
      { $addFields: { effective: { $add: ["$amount", { $ifNull: ["$carryForwardAmount", 0] }] } } },
      { $group: { _id: null, total: { $sum: "$effective" }, count: { $sum: 1 } } },
    ]).then((r) => r[0] ?? { total: 0, count: 0 }),
    PaymentSchedule.aggregate([
      { $match: { status: "upcoming", dueDate: { $lt: startToday } } },
      { $addFields: { effective: { $add: ["$amount", { $ifNull: ["$carryForwardAmount", 0] }] } } },
      { $group: { _id: null, total: { $sum: "$effective" }, count: { $sum: 1 } } },
    ]).then((r) => r[0] ?? { total: 0, count: 0 }),
    Payment.aggregate([
      { $match: { paidAt: { $gte: rangeStart, $lte: rangeEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).then((r) => r[0]?.total ?? 0),
    Payment.aggregate([
      { $match: { paidAt: { $gte: rangeStart, $lte: rangeEnd } } },
      { $lookup: { from: "loans", localField: "loanId", foreignField: "_id", as: "loan" } },
      { $unwind: "$loan" },
      { $group: { _id: "$loan.loanType", total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { paidAt: { $gte: rangeStart, $lte: rangeEnd } } },
      { $group: { _id: "$method", total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $lookup: { from: "loans", localField: "loanId", foreignField: "_id", as: "loan" } },
      { $unwind: "$loan" },
      { $group: { _id: "$loan.loanType", total: { $sum: "$amount" } } },
    ]),
  ]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return { date: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) };
  });
  const dailyTrend = await Promise.all(
    last7Days.map(async (d) => {
      const s = startOfDay(new Date(d.date));
      const e = endOfDay(new Date(d.date));
      const r = await Payment.aggregate([{ $match: { paidAt: { $gte: s, $lte: e } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
      return { ...d, total: r[0]?.total ?? 0 };
    })
  );

  return NextResponse.json({
    totalPaymentsReceived: totalReceivedAll,
    pendingPayments: pendingSchedules.total,
    pendingCount: pendingSchedules.count,
    latePaymentsAmount: missedSchedules.total,
    latePaymentsCount: missedSchedules.count,
    todayCollection: collectionInRange,
    range,
    byLoanType: (range === "tillDate" ? byLoanTypeAll : byLoanTypeInRange).reduce((acc: Record<string, number>, x: { _id: string; total: number }) => ({ ...acc, [x._id]: x.total }), {}),
    byPaymentMode: byModeInRange.reduce((acc: Record<string, number>, x: { _id: string; total: number }) => ({ ...acc, [x._id]: x.total }), {}),
    dailyTrend,
  });
}
