import { findOrCreateUserFromVerifiedEmail } from "@/lib/auth";
import { completeIqAttempt } from "@/lib/iq-tests";
import { getResultEmailLink } from "@/lib/result-email-links";
import { NextResponse } from "next/server";

type ResultAccessApiRouteProps = {
  params: Promise<{
    emailToken: string;
  }>;
};

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(_request: Request, { params }: ResultAccessApiRouteProps) {
  const { emailToken } = await params;
  const link = await getResultEmailLink(emailToken);

  if (!link) {
    return NextResponse.json({ error: "Lien de resultat introuvable ou expire." }, { status: 404 });
  }

  if (link.resultType === "iq") {
    const completion = await completeIqAttempt(link.resultToken);

    if (completion.error) {
      return NextResponse.json({ error: completion.error }, { status: 400 });
    }
  }

  const account = await findOrCreateUserFromVerifiedEmail(link.email, link.resultType, link.resultToken);

  if (!account.user) {
    return NextResponse.json({ error: account.error ?? "Impossible de creer ou connecter le compte." }, { status: 400 });
  }

  const redirectUrl =
    link.resultType === "iq"
      ? `/iq/results/${encodeURIComponent(link.resultToken)}`
      : `/results/${encodeURIComponent(link.resultToken)}`;
  const response = NextResponse.json({
    ok: true,
    redirectUrl,
    resultType: link.resultType,
    resultToken: link.resultToken,
  });

  response.cookies.set("quizhub_user_id", String(account.user.id), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });

  if (link.resultType === "iq") {
    response.cookies.set("brainspark_iq_completed_token", link.resultToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return response;
}
