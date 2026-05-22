import { IqResultPage } from "@/components/iq/iq-result-page";
import { getUserById } from "@/lib/auth";
import { getIqResultByToken, getIqResultByTokenForEmail } from "@/lib/iq-tests";
import { canAccessResultWithEmailToken } from "@/lib/result-email-links";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type IqResultRouteProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    email_token?: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: IqResultRouteProps) {
  const { token } = await params;

  return {
    title: "Résultat de logique | brainspark",
    description: `Résultat indicatif du test de logique ${token}.`,
  };
}

export default async function IqResultRoute({ params, searchParams }: IqResultRouteProps) {
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

  const { result, error } = hasEmailAccess ? await getIqResultByTokenForEmail(token) : user ? await getIqResultByToken(token, user.id) : { result: null, error: "forbidden" as const };

  if (error === "unattached") {
    redirect(`/login?attempt_token=${encodeURIComponent(token)}`);
  }

  return <IqResultPage result={result} error={error} userPseudo={user?.pseudo} />;
}
