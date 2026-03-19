import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Loan from "@/models/Loan";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const search = req.nextUrl.searchParams.get("search") || "";
  const filter = search ? { name: new RegExp(search, "i") } : {};
  const clients = await Client.find(filter).sort({ createdAt: -1 }).lean();
  const clientIds = clients.map((c) => c._id);
  const loanCounts = await Loan.aggregate([
    { $match: { clientId: { $in: clientIds } } },
    { $group: { _id: "$clientId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(loanCounts.map((l) => [l._id.toString(), l.count]));
  const list = clients.map((c) => ({
    ...c,
    totalLoansTaken: countMap[c._id.toString()] || 0,
  }));
  return NextResponse.json({ clients: list });
}

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  mobile: z.string().min(1),
  alternateMobile: z.string().optional(),
  relativeMobile: z.string().optional(),
  mapLink: z.string().optional().transform((s) => (s && s.trim() ? s.trim() : undefined)),
  aadharUrl: z.string().optional(),
  panUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    await connectDB();
    const client = await Client.create(data);
    return NextResponse.json({ client });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
