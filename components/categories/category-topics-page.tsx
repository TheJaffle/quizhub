"use client";

import type { QuizTopicCard, QuizTopicCategory, QuizDifficulty } from "@/lib/quiz-topics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CategoryTopicsPageProps = {
  category: QuizTopicCategory | null;
  topics: QuizTopicCard[];
  error?: string;
};

const difficultyLabels: Record<QuizDifficulty, string> = {
  Easy: "Facile",
  Medium: "Moyen",
  Hard: "Difficile",
};

export function CategoryTopicsPage({ category, topics, error }: CategoryTopicsPageProps) {
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E91663] text-white">
            <BookOpen />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{category ? `Quiz ${category.name}` : "Catégorie introuvable"}</h1>
            <p className="mt-1 text-muted-foreground">Choisissez un thème, puis un niveau.</p>
          </div>
        </div>
      </div>

      {error ? <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      {topics.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600">
              <div className="relative h-48">
                <Image width={1000} height={500} src={topic.imageUrl || "/placeholder.svg"} alt={topic.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div>
                    <p className="text-sm font-semibold text-white/80">{topic.category.name}</p>
                    <h2 className="text-2xl font-black leading-tight text-white">{topic.name}</h2>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-4 p-4">
                <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{topic.description || "Quiz généré depuis une banque de questions aléatoires."}</p>
                <div className="flex flex-wrap gap-2">
                  {topic.availableDifficulties.map((difficulty) => (
                    <Badge key={difficulty} variant="outline">
                      {difficultyLabels[difficulty]}: {topic.questionCounts[difficulty]}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-medium">{topic.totalQuestions} questions disponibles</p>
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-0">
                <Button className="w-full" asChild>
                  <Link href={`/topics/${topic.slug}`}>Choisir un niveau</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-6">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Aucun thème trouvé</h3>
          <p className="max-w-md text-muted-foreground">Aucun thème de quiz n'est encore disponible dans cette catégorie.</p>
        </div>
      )}
    </div>
  );
}
