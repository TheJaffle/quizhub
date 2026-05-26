import { QuizSessionPage } from "@/components/quiz/quiz-session-page";
import { getQuizSessionByToken } from "@/lib/quiz-sessions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ sessionToken: string }> }) {
  const { sessionToken } = await params;
  const { data } = await getQuizSessionByToken(sessionToken);

  if (!data) {
    return {
      title: "Session introuvable | QuizHub",
      description: "La session de quiz demandée est introuvable.",
    };
  }

  return {
    title: `${data.topic.name} - Quiz en cours | QuizHub`,
    description: "Répondez aux questions de cette session de quiz.",
  };
}

export default async function QuizSessionRoute({ params }: { params: Promise<{ sessionToken: string }> }) {
  const { sessionToken } = await params;
  const { data, error } = await getQuizSessionByToken(sessionToken);

  if (!data && !error) {
    notFound();
  }

  return <QuizSessionPage data={data} error={error} />;
}
