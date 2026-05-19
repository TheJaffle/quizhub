import { IqLongMemoryExposurePage } from "@/components/iq/iq-long-memory-exposure-page";
import { getIqLongMemoryExposureByAttemptToken } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export default async function IqLongMemoryExposureRoute({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const returnTo = typeof resolvedSearchParams?.returnTo === "string" ? resolvedSearchParams.returnTo : `/iq/attempt/${token}/phase/main`;
  const { data, error } = await getIqLongMemoryExposureByAttemptToken(token, returnTo);

  return <IqLongMemoryExposurePage data={data} error={error} />;
}
