import { TopicLevelPage } from "@/components/topics/topic-level-page";
import { getQuizTopicBySlug } from "@/lib/quiz-topics";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { topic } = await getQuizTopicBySlug(slug);

  if (!topic) {
    return {
      title: "Thème introuvable | QuizHub",
      description: "Le thème demandé est introuvable.",
    };
  }

  return {
    title: `${topic.name} | QuizHub`,
    description: topic.description || `Choisissez un niveau pour le quiz ${topic.name}.`,
  };
}

export default async function TopicRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { topic, error } = await getQuizTopicBySlug(slug);

  if (!topic && !error) {
    notFound();
  }

  return <TopicLevelPage topic={topic} error={error} />;
}
