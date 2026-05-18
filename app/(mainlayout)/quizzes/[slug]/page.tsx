import { QuizDetailPage } from "@/components/quiz/quiz-detail-page";
import { getQuizBySlug } from "@/lib/quizzes";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { quiz } = await getQuizBySlug(slug);

  if (!quiz) {
    return {
      title: "Quiz Not Found | QuizHub",
      description: "The requested quiz could not be found.",
    };
  }

  return {
    title: `${quiz.title} | QuizHub`,
    description: `Play ${quiz.title} on QuizHub.`,
  };
}

export default async function QuizSlugRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { quiz, error } = await getQuizBySlug(slug);

  return <QuizDetailPage quiz={quiz} error={error} />;
}
