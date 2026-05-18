import { getLatestQuizzes } from "@/lib/quizzes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export async function LatestQuizzes() {
  const { quizzes } = await getLatestQuizzes();

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
    <section className="space-y-6 bg-indigo-50 py-10 px-4 xl:px-8 dark:bg-slate-900">
      <h2 className="text-2xl font-bold tracking-tight">Derniers quiz ajoutés</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
            {/* Image with overlay */}
            <div className="relative h-48">
              <Image width={600} height={350} src={quiz.image || "/placeholder.svg"} alt={quiz.title} className="h-full w-full object-cover" />
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

            <CardContent className="p-4 xl:pt-6 space-y-4">
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

              <Button size="sm" className="w-full" asChild>
                <Link href={`/quizzes/${quiz.slug}/play`}>Jouer</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </section>
  );
}
