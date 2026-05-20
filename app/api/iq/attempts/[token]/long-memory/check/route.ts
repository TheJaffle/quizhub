import { getIqLongMemoryInterruptUrl } from "@/lib/iq-tests";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const resumeUrl = body && typeof body.resumeUrl === "string" ? body.resumeUrl : "";
  const force = Boolean(body && typeof body === "object" && "force" in body && body.force);
  const afterCurrentAnswerAction =
    body &&
    typeof body === "object" &&
    (body.afterCurrentAnswerAction === "advance" || body.afterCurrentAnswerAction === "return" || body.afterCurrentAnswerAction === "complete")
      ? body.afterCurrentAnswerAction
      : undefined;

  if (!resumeUrl) {
    return NextResponse.json({ error: "resumeUrl is required." }, { status: 400 });
  }

  const nextUrl = await getIqLongMemoryInterruptUrl(token, resumeUrl, { force, afterCurrentAnswerAction });

  return NextResponse.json({ nextUrl });
}
