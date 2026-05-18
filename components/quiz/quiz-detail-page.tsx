"use client";

import type { QuizDetail } from "@/lib/quizzes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, Play, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type QuizDetailPageProps = {
  quiz: QuizDetail | null;
  error?: string;
};

export function QuizDetailPage({ quiz, error }: QuizDetailPageProps) {
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

  if (error) {
    return <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>;
  }

  if (!quiz) {
    return (
      <div className="container mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/categories" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Link>
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Quiz Not Found</h1>
            <p className="text-muted-foreground">The requested quiz could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = quiz.maxPlayers > 0 ? (quiz.players / quiz.maxPlayers) * 100 : 0;

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/categories/${quiz.categorySlug}`} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to {quiz.category}
          </Link>
        </Button>

        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
          <Image width={1200} height={600} src={quiz.image || "/placeholder.svg"} alt={quiz.title} className="w-full h-full object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 md:p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={getDifficultyVariant(quiz.difficulty)}>{quiz.difficulty}</Badge>
              <Badge variant="secondary" className="bg-blue-500/80 text-white border-0">
                {quiz.category}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">{quiz.title}</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.timeLimit} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{quiz.players} players</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>
                  {quiz.rating} ({quiz.totalRatings} ratings)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Quiz Details</h2>
                  <p className="text-muted-foreground">Review the quiz information before starting.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                    <div className="font-medium">{quiz.difficulty}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Time Limit</div>
                    <div className="font-medium">{quiz.timeLimit} min</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Rating</div>
                    <div className="font-medium">
                      {quiz.rating} ({quiz.totalRatings})
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Players</div>
                    <div className="font-medium">{quiz.players}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Spots filled</span>
                    <span className="text-sm font-medium">
                      {quiz.players}/{quiz.maxPlayers}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  {quiz.almostFull ? <p className="text-xs font-medium text-destructive">Almost full! Only {quiz.spotsLeft} spots left</p> : null}
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={quiz.creatorAvatar || "/placeholder.svg"} alt={quiz.createdBy} />
                      <AvatarFallback>{quiz.createdBy.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{quiz.createdBy}</div>
                      <div className="text-xs text-muted-foreground">Quiz Creator</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg" asChild>
                  <Link href={`/quizzes/${quiz.slug}/play`}>
                    <Play className="h-4 w-4 mr-2" />
                    Commencer le quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
