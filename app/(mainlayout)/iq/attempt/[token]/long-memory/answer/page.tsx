import { IqLongMemoryAnswerPage } from "@/components/iq/iq-long-memory-answer-page";
import { getIqLongMemoryAnswerByAttemptToken } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export default async function IqLongMemoryAnswerRoute({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const returnTo = typeof resolvedSearchParams?.returnTo === "string" ? resolvedSearchParams.returnTo : `/iq/attempt/${token}/phase/main`;
  const { data, error } = await getIqLongMemoryAnswerByAttemptToken(token, returnTo);

  return <IqLongMemoryAnswerPage data={data} error={error} />;
}
