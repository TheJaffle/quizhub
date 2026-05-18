import { QuizFirstQuestionPage } from "@/components/quiz/quiz-first-question-page";
import { getQuizFirstQuestionBySlug } from "@/lib/quizzes";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await getQuizFirstQuestionBySlug(slug);

  if (!data?.quiz) {
    return {
      title: "Quiz Not Found | QuizHub",
      description: "The requested quiz could not be found.",
    };
  }

  return {
    title: `Play ${data.quiz.title} | QuizHub`,
    description: `Start ${data.quiz.title} on QuizHub.`,
  };
}

export default async function QuizPlaySlugRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await getQuizFirstQuestionBySlug(slug);

  return <QuizFirstQuestionPage data={data} error={error} />;
}
