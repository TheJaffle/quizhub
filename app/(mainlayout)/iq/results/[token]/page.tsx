import { IqResultPage } from "@/components/iq/iq-result-page";
import { getUserById } from "@/lib/auth";
import { getIqResultByTokenForEmail } from "@/lib/iq-tests";
import { cookies } from "next/headers";

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
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  const user = Number.isInteger(userId) && userId > 0 ? await getUserById(userId) : null;
  const { result, error } = await getIqResultByTokenForEmail(token);
  const normalizedError = error === "unattached" ? "not-found" : error;

  return <IqResultPage result={result} error={normalizedError} userPseudo={user?.pseudo} emailToken={emailToken} />;
}
