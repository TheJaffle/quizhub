import { CategoryDetailPage } from "@/components/categories/category-detail-page";
import { CategoryTopicsPage } from "@/components/categories/category-topics-page";
import { getCategoryQuizzesBySlug } from "@/lib/quizzes";
import { getCategoryTopicsBySlug } from "@/lib/quiz-topics";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topicsResult = await getCategoryTopicsBySlug(slug);
  const legacyResult = topicsResult.category ? null : await getCategoryQuizzesBySlug(slug);
  const category = topicsResult.category ?? legacyResult?.category ?? null;

  if (!category) {
    return {
      title: "Catégorie introuvable | QuizHub",
      description: "La catégorie demandée est introuvable.",
    };
  }

  return {
    title: `Quiz ${category.name} | QuizHub`,
    description: `Parcourez et lancez les quiz ${category.name.toLowerCase()}.`,
  };
}

export default async function CategoryRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topicsResult = await getCategoryTopicsBySlug(slug);

  if (topicsResult.category && topicsResult.topics.length > 0) {
    return <CategoryTopicsPage category={topicsResult.category} topics={topicsResult.topics} error={topicsResult.error} />;
  }

  const { category, quizzes, error } = await getCategoryQuizzesBySlug(slug);

  return <CategoryDetailPage category={category} quizzes={quizzes} error={error} />;
}
