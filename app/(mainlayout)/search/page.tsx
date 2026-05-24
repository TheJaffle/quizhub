import { SearchResults } from "@/components/search/search-results";

export const metadata = {
  title: "Recherche | brainspark",
  description: "Recherchez des quiz, catégories, créateurs et pages sur brainspark.",
};

export default function SearchPage({ searchParams }: { searchParams: { q: string } }) {
  const query = searchParams.q || "";

  return <SearchResults query={query} />;
}
