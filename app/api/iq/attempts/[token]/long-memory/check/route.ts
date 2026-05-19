import { getIqLongMemoryInterruptUrl } from "@/lib/iq-tests";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const resumeUrl = body && typeof body.resumeUrl === "string" ? body.resumeUrl : "";
  const force = Boolean(body && typeof body === "object" && "force" in body && body.force);

  if (!resumeUrl) {
    return NextResponse.json({ error: "resumeUrl is required." }, { status: 400 });
  }

  const nextUrl = await getIqLongMemoryInterruptUrl(token, resumeUrl, { force });

  return NextResponse.json({ nextUrl });
}
