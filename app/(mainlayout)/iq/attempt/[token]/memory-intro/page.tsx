import { IqMemoryIntroPage } from "@/components/iq/iq-memory-intro-page";
import { getIqMemoryIntroByAttemptToken } from "@/lib/iq-tests";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await getIqMemoryIntroByAttemptToken(token);

  if (!data) {
    return {
      title: "Memoire indisponible | QuizHub",
      description: "L'introduction de la phase memoire est indisponible.",
    };
  }

  return {
    title: `Memoire | ${data.attempt.testTitle} | QuizHub`,
    description: "Introduction de la phase memoire du test de logique.",
  };
}

export default async function IqMemoryIntroRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await getIqMemoryIntroByAttemptToken(token);

  return <IqMemoryIntroPage data={data} error={error} />;
}
