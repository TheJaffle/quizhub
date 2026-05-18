import { IqSpeedIntroPage } from "@/components/iq/iq-speed-intro-page";
import { getIqSpeedIntroByAttemptToken } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getIqSpeedIntroByAttemptToken(token);

  if (!data) {
    return {
      title: "Rapidite indisponible | QuizHub",
      description: "L'introduction de la phase rapidite est indisponible.",
    };
  }

  return {
    title: `Rapidite | ${data.attempt.testTitle} | QuizHub`,
    description: "Introduction de la phase rapidite du test de logique.",
  };
}

export default async function IqSpeedIntroRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqSpeedIntroByAttemptToken(token);

  return <IqSpeedIntroPage data={data} error={error} />;
}
