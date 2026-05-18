import { IqPhasePage } from "@/components/iq/iq-phase-page";
import { getIqAttemptPhase } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getIqAttemptPhase(token, "main");

  if (!data) {
    return {
      title: "Phase de logique indisponible | QuizHub",
      description: "La phase principale du test de logique est indisponible.",
    };
  }

  return {
    title: `${data.attempt.testTitle} | Phase principale | QuizHub`,
    description: "Phase principale du test de logique QI-FREE.",
  };
}

export default async function IqMainPhaseRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqAttemptPhase(token, "main");

  return <IqPhasePage data={data} error={error} />;
}
