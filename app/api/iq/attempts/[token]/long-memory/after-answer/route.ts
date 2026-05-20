import { advanceIqLongMemoryAfterAnswer } from "@/lib/iq-tests";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const returnToUrl = body && typeof body.returnToUrl === "string" ? body.returnToUrl : "";

  if (!returnToUrl) {
    return NextResponse.json({ error: "returnToUrl is required." }, { status: 400 });
  }

  const result = await advanceIqLongMemoryAfterAnswer(token, returnToUrl);

  return NextResponse.json(result);
}
