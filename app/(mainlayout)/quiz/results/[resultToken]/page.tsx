import { getQuizSessionResultByToken } from "@/lib/quiz-sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ resultToken: string }> }) {
  const { resultToken } = await params;
  const { data } = await getQuizSessionResultByToken(resultToken);

  if (!data) {
    return {
      title: "Résultat introuvable | QuizHub",
      description: "Le résultat demandé est introuvable.",
    };
  }

  return {
    title: `Résultat ${data.topic.name} | QuizHub`,
    description: `Score obtenu : ${data.session.score ?? 0}/${data.session.totalQuestions}.`,
  };
}

export default async function QuizSessionResultRoute({ params }: { params: Promise<{ resultToken: string }> }) {
  const { resultToken } = await params;

  redirect(`/results/${encodeURIComponent(resultToken)}`);
}
