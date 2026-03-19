import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Loan from "@/models/Loan";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ clients: [], loans: [] });

  await connectDB();
  const regex = new RegExp(q, "i");
  const clients = await Client.find({
    $or: [{ name: regex }, { mobile: regex }, { alternateMobile: regex }, { relativeMobile: regex }],
  })
    .select("name mobile _id")
    .limit(10)
    .lean();
  const clientIds = clients.map((c) => c._id);
  const loans = await Loan.find(clientIds.length ? { clientId: { $in: clientIds } } : {})
    .populate("clientId", "name mobile")
    .limit(10)
    .lean();
  return NextResponse.json({ clients, loans });
}
