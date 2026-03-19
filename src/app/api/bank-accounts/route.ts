import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BankAccount from "@/models/BankAccount";
import { z } from "zod";

export async function GET() {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const accounts = await BankAccount.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ accounts });
}

const createSchema = z.object({
  bankName: z.string().min(1),
  upiId: z.string().min(1),
  qrCodeUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    await connectDB();
    const account = await BankAccount.create(data);
    return NextResponse.json({ account });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to add bank account" }, { status: 500 });
  }
}
