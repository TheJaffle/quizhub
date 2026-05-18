import { CategoriesPage } from "@/components/categories/categories-page";

export const metadata = {
  title: "Catégories de quiz | QuizHub",
  description: "Parcourez les catégories de quiz et trouvez ceux qui vous intéressent.",
};

export default function CategoriesRoute() {
  return <CategoriesPage />;
}
