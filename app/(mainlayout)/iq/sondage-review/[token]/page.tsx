import { IqSondageReviewPage } from "@/components/iq/iq-sondage-review-page";
import { getUserById } from "@/lib/auth";
import { getIqSondageReviewByToken } from "@/lib/iq-tests";
import { canAccessResultWithEmailToken } from "@/lib/result-email-links";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type IqSondageReviewByTokenRouteProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    email_token?: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Correction sondage | brainspark",
    description: "Correction question par question du sondage IQ.",
  };
}

export default async function IqSondageReviewByTokenRoute({ params, searchParams }: IqSondageReviewByTokenRouteProps) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const emailToken = resolvedSearchParams?.email_token ?? null;
  const hasEmailAccess = await canAccessResultWithEmailToken({
    resultType: "iq",
    resultToken: token,
    emailToken,
  });
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if ((!Number.isInteger(userId) || userId <= 0) && !hasEmailAccess) {
    redirect(`/login?attempt_token=${encodeURIComponent(token)}`);
  }

  const user = Number.isInteger(userId) && userId > 0 ? await getUserById(userId) : null;

  if (!user && !hasEmailAccess) {
    redirect(`/login?attempt_token=${encodeURIComponent(token)}`);
  }

  const { review, error } = await getIqSondageReviewByToken(token);

  return <IqSondageReviewPage initialEmail="" review={review} error={error} hideLookupForm />;
}
