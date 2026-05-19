import { createIqAttempt, getCompletedIqAttemptByToken, getCompletedIqAttemptForUser } from "@/lib/iq-tests";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type CreateIqAttemptRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, { params }: CreateIqAttemptRouteProps) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);
  const completedAttemptToken = cookieStore.get("qifree_iq_completed_token")?.value;
  const completedFromCookie = completedAttemptToken ? await getCompletedIqAttemptByToken(completedAttemptToken, slug) : null;

  if (completedFromCookie?.attemptToken) {
    return NextResponse.json(
      {
        error: "Vous avez déjà réalisé ce test de logique.",
        resultUrl: completedFromCookie.resultUrl,
      },
      { status: 409 }
    );
  }

  const safeUserId = Number.isInteger(userId) && userId > 0 ? userId : null;

  if (safeUserId) {
    const completedFromUser = await getCompletedIqAttemptForUser(safeUserId, slug);

    if (completedFromUser.attemptToken) {
      return NextResponse.json(
        {
          error: "Vous avez déjà réalisé ce test de logique.",
          resultUrl: completedFromUser.resultUrl,
        },
        { status: 409 }
      );
    }
  }

  const demographics =
    body && typeof body === "object"
      ? {
          birthDate: typeof (body as { birthDate?: unknown }).birthDate === "string" ? (body as { birthDate: string }).birthDate : "",
          gender: typeof (body as { gender?: unknown }).gender === "string" ? (body as { gender: string }).gender : "",
        }
      : null;
  const result = await createIqAttempt(slug, safeUserId, demographics);

  if (result.error) {
    return NextResponse.json({ error: result.error, resultUrl: result.blockedResultUrl }, { status: 400 });
  }

  return NextResponse.json({
    attemptToken: result.attemptToken,
    nextUrl: result.nextUrl,
  });
}
