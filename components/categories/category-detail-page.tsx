"use client";

import type { CategoryQuiz, QuizCategoryDetail } from "@/lib/quizzes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Clock, Filter, Search, SortAsc, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CategoryDetailPageProps {
  category: QuizCategoryDetail | null;
  quizzes: CategoryQuiz[];
  error?: string;
}

export function CategoryDetailPage({ category, quizzes, error }: CategoryDetailPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<CategoryQuiz[]>(quizzes);
  const [sortBy, setSortBy] = useState("popular");
  const [difficulty, setDifficulty] = useState("all");

  // Filter and sort quizzes whenever dependencies change
  useEffect(() => {
    let result = [...quizzes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((quiz) => quiz.title.toLowerCase().includes(query) || quiz.category.toLowerCase().includes(query));
    }

    // Filter by difficulty
    if (difficulty !== "all") {
      result = result.filter((quiz) => quiz.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // Sort quizzes
    result = sortQuizzes(result, sortBy);

    setFilteredQuizzes(result);
  }, [quizzes, searchQuery, difficulty, sortBy]);

  // Function to sort quizzes
  const sortQuizzes = (quizzes: CategoryQuiz[], sortMethod: string): CategoryQuiz[] => {
    return [...quizzes].sort((a, b) => {
      switch (sortMethod) {
        case "popular":
          return b.players - a.players;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return b.id - a.id;
        case "reward":
          return parseFloat(b.reward.replace("$", "")) - parseFloat(a.reward.replace("$", ""));
        case "difficulty":
          // Sort by difficulty: Hard > Medium > Easy
          const difficultyOrder = { Hard: 3, Medium: 2, Easy: 1 };
          return (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0) - (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0);
        default:
          return 0;
      }
    });
  };

  // Get difficulty badge variant
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "success";
      case "Medium":
        return "yellow";
      case "Hard":
        return "destructive";
      default:
        return "default";
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter changes
  const handleDifficultyChange = (newDifficulty: string) => {
    setDifficulty(newDifficulty);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "Facile";
      case "Medium":
        return "Moyen";
      case "Hard":
        return "Difficile";
      default:
        return difficulty;
    }
  };

  return (
    <div className="container mx-auto ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white bg-indigo-500">
                <Target />
              </div>
              <h1 className="text-3xl font-bold">{category ? `Quiz ${category.name}` : "Catégorie introuvable"}</h1>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl">{category ? "Parcourez les quiz de cette catégorie." : "La catégorie demandée est introuvable."}</p>
          </div>

        </div>
      </div>

      {error ? <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un quiz..." className="pl-10" value={searchQuery} onChange={handleSearchChange} />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SortAsc className="h-4 w-4" />
                Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSortChange("popular")}>Les plus populaires</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("newest")}>Les plus récents</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("difficulty")}>Difficulté</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Difficulté
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDifficultyChange("all")}>Toutes les difficultés</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDifficultyChange("easy")}>Facile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDifficultyChange("medium")}>Moyen</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDifficultyChange("hard")}>Difficile</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quiz grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-4">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
              {/* Image with overlay */}
              <div className="relative h-48">
                <Image width={1000} height={500} src={quiz.image || "/placeholder.svg"} alt={quiz.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant={getDifficultyVariant(quiz.difficulty)} className="font-medium">
                        {getDifficultyLabel(quiz.difficulty)}
                      </Badge>
                      <div className="flex items-center gap-1 text-white text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{quiz.timeLimit} min</span>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold line-clamp-2">{quiz.title}</h3>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 space-y-4 xl:pt-6">
                {/* Creator and category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={quiz.creatorAvatar || "/placeholder.svg"} alt={quiz.createdBy} />
                      <AvatarFallback>{quiz.createdBy.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{quiz.createdBy}</span>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
                    {quiz.category}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-0">
                <Button className="w-full" asChild>
                  <Link href={`/quizzes/${quiz.slug}/play`}>Lancer le quiz</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Aucun quiz trouvé</h3>
          <p className="text-muted-foreground max-w-md mb-6">{searchQuery ? `Aucun quiz ne correspond à la recherche "${searchQuery}". Essayez un autre terme ou un autre filtre.` : "Aucun quiz ne correspond aux filtres sélectionnés. Essayez de modifier vos filtres."}</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setDifficulty("all");
              setSortBy("popular");
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
