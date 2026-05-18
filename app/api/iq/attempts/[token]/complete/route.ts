import { completeIqAttempt } from "@/lib/iq-tests";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await completeIqAttempt(token);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({ completion: result.completion });

  if (result.completion?.attemptToken) {
    response.cookies.set("qifree_iq_completed_token", result.completion.attemptToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}
