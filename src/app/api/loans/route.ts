import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Loan from "@/models/Loan";
import PaymentSchedule from "@/models/PaymentSchedule";
import Client from "@/models/Client";
import { calculateLoan } from "@/lib/loanCalculations";
import { addDays } from "date-fns";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const clientId = req.nextUrl.searchParams.get("clientId");
  const q = clientId ? { clientId } : {};
  const loans = await Loan.find(q).populate("clientId", "name mobile").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ loans });
}

const createSchema = z.object({
  clientId: z.string(),
  loanType: z.enum(["daily", "meter", "weekly", "monthly"]),
  principal: z.number().positive(),
  interestRatePerMonth: z.number().min(0),
  durationDays: z.number().positive(),
  startDate: z.string(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    await connectDB();
    const client = await Client.findById(data.clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const startDate = new Date(data.startDate);
    const calc = calculateLoan({
      principal: data.principal,
      durationDays: data.durationDays,
      interestRatePerMonth: data.interestRatePerMonth,
      loanType: data.loanType,
      startDate,
    });
    const endDate = addDays(startDate, data.durationDays);
    const loan = await Loan.create({
      clientId: data.clientId,
      loanType: data.loanType,
      principal: data.principal,
      interestRatePerMonth: data.interestRatePerMonth,
      durationDays: data.durationDays,
      startDate,
      endDate,
      dailyAmount: calc.dailyAmount,
      weeklyAmount: calc.weeklyAmount,
      monthlyAmount: calc.monthlyAmount,
      totalInterest: calc.totalInterest,
      totalPayable: calc.totalPayable,
      status: "active",
    });
    const scheduleDocs = calc.schedule.map((s) => ({
      loanId: loan._id,
      dueDate: s.dueDate,
      amount: s.amount,
      status: "upcoming" as const,
    }));
    await PaymentSchedule.insertMany(scheduleDocs);
    const populated = await Loan.findById(loan._id).populate("clientId", "name mobile").lean();
    return NextResponse.json({ loan: populated });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
  }
}
