import { IqSpeedPhasePage } from "@/components/iq/iq-speed-phase-page";
import { getIqAttemptPhase } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getIqAttemptPhase(token, "speed");

  if (!data) {
    return {
      title: "Phase rapidite indisponible | QuizHub",
      description: "La phase rapidite du test de logique est indisponible.",
    };
  }

  return {
    title: `Rapidite | ${data.attempt.testTitle} | QuizHub`,
    description: "Phase rapidite du test de logique Free Logic Test.",
  };
}

export default async function IqSpeedPhaseRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqAttemptPhase(token, "speed");

  return <IqSpeedPhasePage data={data} error={error} />;
}
