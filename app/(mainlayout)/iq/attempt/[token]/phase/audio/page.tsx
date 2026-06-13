import { IqAudioPhasePage } from "@/components/iq/iq-audio-phase-page";
import { getIqAttemptPhase } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getIqAttemptPhase(token, "audio");

  if (!data) {
    return {
      title: "Phase sonore indisponible | QuizHub",
      description: "La phase sonore du test de logique est indisponible.",
    };
  }

  return {
    title: `Sonore | ${data.attempt.testTitle} | QuizHub`,
    description: "Phase sonore du test de logique Free Logic Test.",
  };
}

export default async function IqAudioPhaseRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqAttemptPhase(token, "audio");

  return <IqAudioPhasePage data={data} error={error} />;
}
