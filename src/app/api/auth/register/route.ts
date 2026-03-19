import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = bodySchema.parse(body);
    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    const user = await User.create({ email, password, name });
    return NextResponse.json({ user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    // Database connection or server error
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("ECONNREFUSED") || message.includes("MongoNetworkError") || message.includes("connect")) {
      return NextResponse.json(
        { error: "Database connection failed. Please start MongoDB and set MONGODB_URI in .env.local" },
        { status: 503 }
      );
    }
    if (process.env.NODE_ENV === "development") {
      console.error("Register error:", e);
    }
    return NextResponse.json({ error: "Registration failed. " + message }, { status: 500 });
  }
}
