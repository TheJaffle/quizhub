"use client";

import type { QuizTopicCard, QuizTopicCategory, QuizDifficulty } from "@/lib/quiz-topics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Loader2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

const difficulties: QuizDifficulty[] = ["Easy", "Medium", "Hard"];

export function CategoryTopicsPage({ category, topics, error }: CategoryTopicsPageProps) {
  const [startingQuiz, setStartingQuiz] = useState<{ topicSlug: string; difficulty: QuizDifficulty } | null>(null);
  const [startError, setStartError] = useState<{ topicSlug: string; message: string } | null>(null);

  async function startQuiz(topic: QuizTopicCard, difficulty: QuizDifficulty) {
    setStartingQuiz({ topicSlug: topic.slug, difficulty });
    setStartError(null);

    try {
      const response = await fetch("/api/quiz-sessions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicSlug: topic.slug,
          difficulty,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de lancer ce quiz.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setStartError({
        topicSlug: topic.slug,
        message: error instanceof Error ? error.message : "Impossible de lancer ce quiz.",
      });
      setStartingQuiz(null);
    }
  }

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

              <CardFooter className="flex flex-col gap-2 px-4 pb-4 pt-0">
                {startError?.topicSlug === topic.slug ? <p className="w-full text-sm text-destructive">{startError.message}</p> : null}
                <div className="grid w-full grid-cols-3 gap-2">
                  {difficulties.map((difficulty) => {
                    const isStarting = startingQuiz?.topicSlug === topic.slug && startingQuiz.difficulty === difficulty;
                    const disabled = topic.questionCounts[difficulty] < 1 || startingQuiz !== null;

                    return (
                      <Button key={difficulty} size="sm" disabled={disabled} onClick={() => startQuiz(topic, difficulty)} className="min-w-0 px-2">
                        {isStarting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                        {difficultyLabels[difficulty]}
                      </Button>
                    );
                  })}
                </div>
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
