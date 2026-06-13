import { IqMemoryPhasePage } from "@/components/iq/iq-memory-phase-page";
import { getIqAttemptPhase } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getIqAttemptPhase(token, "memory");

  if (!data) {
    return {
      title: "Phase memoire indisponible | QuizHub",
      description: "La phase memoire du test de logique est indisponible.",
    };
  }

  return {
    title: `Memoire | ${data.attempt.testTitle} | QuizHub`,
    description: "Phase memoire du test de logique Free Logic Test.",
  };
}

export default async function IqMemoryPhaseRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqAttemptPhase(token, "memory");

  return <IqMemoryPhasePage data={data} error={error} />;
}
