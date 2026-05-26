"use client";

import type { QuizDifficulty, QuizTopicCard } from "@/lib/quiz-topics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type TopicLevelPageProps = {
  topic: QuizTopicCard | null;
  error?: string;
};

const difficultyLabels: Record<QuizDifficulty, string> = {
  Easy: "Facile",
  Medium: "Moyen",
  Hard: "Difficile",
};

const difficulties: QuizDifficulty[] = ["Easy", "Medium", "Hard"];

export function TopicLevelPage({ topic, error }: TopicLevelPageProps) {
  const [startingDifficulty, setStartingDifficulty] = useState<QuizDifficulty | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  async function startQuiz(difficulty: QuizDifficulty) {
    if (!topic) return;

    setStartingDifficulty(difficulty);
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
    } catch (startError) {
      setStartError(startError instanceof Error ? startError.message : "Impossible de lancer ce quiz.");
      setStartingDifficulty(null);
    }
  }

  if (error) {
    return <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>;
  }

  if (!topic) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Thème introuvable</h1>
        <p className="text-muted-foreground">Le thème demandé n'existe pas ou n'est pas encore actif.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/categories/${topic.category.slug}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à {topic.category.name}
        </Link>
      </Button>

      <div className="mb-8 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">
        <div className="relative min-h-[280px]">
          <Image src={topic.imageUrl || "/placeholder.svg"} alt={topic.name} fill priority sizes="100vw" className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
          <div className="relative z-10 flex min-h-[280px] flex-col justify-end p-6">
            <Badge className="mb-3 w-fit bg-[#E91663] text-white hover:bg-[#E91663]">{topic.category.name}</Badge>
            <h1 className="text-4xl font-black tracking-tight">{topic.name}</h1>
            <p className="mt-3 max-w-2xl text-white/85">{topic.description || "Choisissez un niveau pour lancer un tirage aléatoire depuis la banque de questions."}</p>
          </div>
        </div>
      </div>

      {startError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{startError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {difficulties.map((difficulty) => {
          const count = topic.questionCounts[difficulty];
          const disabled = count < 1 || startingDifficulty !== null;

          return (
            <Card key={difficulty}>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="text-2xl font-bold">{difficultyLabels[difficulty]}</h2>
                  <p className="text-sm text-muted-foreground">{count} question{count > 1 ? "s" : ""} disponible{count > 1 ? "s" : ""}</p>
                </div>
                {count > 0 && count < 20 ? (
                  <Alert>
                    <AlertDescription>Ce niveau contient actuellement {count} questions. Le quiz pourra quand même être lancé avec {count} questions.</AlertDescription>
                  </Alert>
                ) : null}
                {count < 1 ? <p className="text-sm text-muted-foreground">Ce niveau n'est pas encore disponible.</p> : null}
                <Button className="w-full" disabled={disabled} onClick={() => startQuiz(difficulty)}>
                  {startingDifficulty === difficulty ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Commencer le quiz
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
