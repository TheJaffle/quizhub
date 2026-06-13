import { IqPhasePage } from "@/components/iq/iq-phase-page";
import { getIqAttemptPhase } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ block?: string }>;
}) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const blockIndex = Number(resolvedSearchParams?.block ?? "0");
  const { data } = await getIqAttemptPhase(token, "main", Number.isInteger(blockIndex) && blockIndex >= 0 ? blockIndex : 0);

  if (!data) {
    return {
      title: "Phase de logique indisponible | QuizHub",
      description: "La phase principale du test de logique est indisponible.",
    };
  }

  return {
    title: `${data.attempt.testTitle} | Phase principale | QuizHub`,
    description: "Phase principale du test de logique Free Logic Test.",
  };
}

export default async function IqMainPhaseRoute({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ block?: string }>;
}) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const blockIndex = Number(resolvedSearchParams?.block ?? "0");
  const { data, error } = await getIqAttemptPhase(token, "main", Number.isInteger(blockIndex) && blockIndex >= 0 ? blockIndex : 0);

  return <IqPhasePage data={data} error={error} />;
}
