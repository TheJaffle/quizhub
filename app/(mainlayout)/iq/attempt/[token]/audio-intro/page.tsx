import { IqAudioIntroPage } from "@/components/iq/iq-audio-intro-page";
import { getIqAudioIntroByAttemptToken } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getIqAudioIntroByAttemptToken(token);

  if (!data) {
    return {
      title: "Sonore indisponible | QuizHub",
      description: "L'introduction de la phase sonore est indisponible.",
    };
  }

  return {
    title: `Sonore | ${data.attempt.testTitle} | QuizHub`,
    description: "Introduction de la phase sonore du test de logique.",
  };
}

export default async function IqAudioIntroRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqAudioIntroByAttemptToken(token);

  return (
    <IqAudioIntroPage
      data={
        data
          ? {
              title: data.section.title,
              description:
                data.section.description ||
                "Vous allez ecouter une courte sequence sonore, la memoriser, puis retrouver la bonne proposition parmi quatre lectures candidates.",
              questionCount: data.section.questionCount,
              maxStimulusPlays: data.section.maxStimulusPlays,
              nextUrl: data.nextUrl,
            }
          : null
      }
      error={error}
    />
  );
}
