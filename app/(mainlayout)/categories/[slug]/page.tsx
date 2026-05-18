import { CategoryDetailPage } from "@/components/categories/category-detail-page";
import { getCategoryQuizzesBySlug } from "@/lib/quizzes";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { category } = await getCategoryQuizzesBySlug(slug);

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
  const { category, quizzes, error } = await getCategoryQuizzesBySlug(slug);

  return <CategoryDetailPage category={category} quizzes={quizzes} error={error} />;
}
