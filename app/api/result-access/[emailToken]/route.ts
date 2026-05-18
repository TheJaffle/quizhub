import { findOrCreateUserFromVerifiedEmail } from "@/lib/auth";
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
    return NextResponse.json({ error: "Lien de résultat introuvable ou expiré." }, { status: 404 });
  }

  const account = await findOrCreateUserFromVerifiedEmail(link.email, link.resultType, link.resultToken);

  if (!account.user) {
    return NextResponse.json({ error: account.error ?? "Impossible de créer ou connecter le compte." }, { status: 400 });
  }

  const redirectUrl =
    link.resultType === "iq"
      ? `/iq/results/${encodeURIComponent(link.resultToken)}`
      : `/results/${encodeURIComponent(link.resultToken)}`;
  const response = NextResponse.json({
    ok: true,
    redirectUrl,
  });

  response.cookies.set("quizhub_user_id", String(account.user.id), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
