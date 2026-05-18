import { registerUser } from "@/lib/auth";
import { NextResponse } from "next/server";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const resultToken = body.resultToken ?? null;
  const attemptToken = body.attemptToken ?? null;
  const result = await registerUser(body.email ?? "", body.password ?? "", body.pseudo ?? "", resultToken, attemptToken);

  if (result.error || !result.user) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const nextUrl = attemptToken
    ? `/iq/results/${encodeURIComponent(attemptToken)}`
    : resultToken
      ? `/results/${encodeURIComponent(resultToken)}`
      : "/";
  const response = NextResponse.json({ user: result.user, nextUrl });
  response.cookies.set("quizhub_user_id", String(result.user.id), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
