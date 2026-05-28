import { CategoryTopicsPage } from "@/components/categories/category-topics-page";
import { getCategoryTopicsBySlug } from "@/lib/quiz-topics";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topicsResult = await getCategoryTopicsBySlug(slug);
  const category = topicsResult.category;

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

  return <CategoryTopicsPage category={topicsResult.category} topics={topicsResult.topics} error={topicsResult.error} />;
}
