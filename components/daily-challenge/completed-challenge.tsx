"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import confetti from "canvas-confetti";
import { Award, Clock, Facebook, Link, Medal, Share2, Trophy, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
type dailyQuizData = {
  title: string;
  description: string;
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
};
interface CompletedChallengeProps {
  result: {
    score: number;
    totalQuestions: number;
    timeTaken: number;
    rank: number;
    correctAnswers: number;
  };
  onReset: () => void;
  dailyQuizData: dailyQuizData;
  selectedAnswers: string[];
}

export function CompletedChallenge({ result, onReset, dailyQuizData, selectedAnswers }: CompletedChallengeProps) {
  const [activeTab, setActiveTab] = useState("summary");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent, vous maîtrisez le sujet !";
    if (score >= 70) return "Très bon résultat, vous connaissez bien le thème.";
    if (score >= 50) return "Bel effort, continuez à progresser.";
    return "Bien essayé, il reste une belle marge de progression.";
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank <= 3) return "🥈";
    if (rank <= 10) return "🥉";
    return "🏅";
  };

  const handleShare = (platform: string) => {
    const message = `J'ai obtenu ${result.score}% et je suis #${result.rank} au défi quiz du jour. Peux-tu me battre ?`;

    // In a real app, these would open share dialogs or copy to clipboard
    if (platform === "twitter") {
      console.log("Sharing to Twitter:", message);
      toast({
        title: "Partagé sur Twitter",
        description: "Vos résultats ont été partagés sur Twitter.",
      });
    } else if (platform === "facebook") {
      console.log("Sharing to Facebook:", message);
      toast({
        title: "Partagé sur Facebook",
        description: "Vos résultats ont été partagés sur Facebook.",
      });
    } else if (platform === "copy") {
      navigator.clipboard.writeText(message);
      toast({
        title: "Lien copié",
        description: "Le lien du défi a été copié.",
      });
    }
  };
  useEffect(() => {
    if (result && result.score >= 70) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [result]);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-center">Défi terminé !</CardTitle>
        <CardDescription className="text-center">{getScoreMessage(result.score)}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative">
            <CircularProgress value={result.score} size={180} strokeWidth={10} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-bold">{result.score}%</span>
              <span className="text-sm text-muted-foreground">Votre score</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
            <Trophy className="h-5 w-5 text-amber-500 mb-1" />
            <span className="text-sm text-muted-foreground">Classement</span>
            <span className="text-xl font-bold">
              {getRankEmoji(result.rank)} #{result.rank}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
            <Clock className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-sm text-muted-foreground">Temps</span>
            <span className="text-xl font-bold">{formatTime(result.timeTaken)}</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
            <Award className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-sm text-muted-foreground">Réponses justes</span>
            <span className="text-xl font-bold">
              {result.correctAnswers}/{result.totalQuestions}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
            <Medal className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-sm text-muted-foreground">Gagné</span>
            <span className="text-xl font-bold">+125 XP</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="rewards">Récompenses</TabsTrigger>
            <TabsTrigger value="answers">Réponses</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Votre performance</h3>
              <p className="text-sm text-muted-foreground">Vous avez terminé le défi du jour en {formatTime(result.timeTaken)}, plus vite que 65% des participants.</p>
              <p className="text-sm text-muted-foreground">
                Votre score de {result.score}% vous place dans le top {result.rank <= 10 ? "10%" : "30%"} des participants du jour.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">Série en cours</h3>
              <p className="text-sm text-muted-foreground">Vous avez maintenu une série de 4 jours. Continuez pour gagner des récompenses bonus.</p>
              <div className="flex space-x-1 mt-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div key={day} className={`h-2 w-full rounded-full ${day <= 4 ? "bg-green-500" : "bg-muted"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">Encore 3 jours avant le badge des 7 jours</p>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 flex items-center space-x-3">
                <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium">Participation du jour</h4>
                  <p className="text-sm text-muted-foreground">+50 pièces</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Bonus de score</h4>
                  <p className="text-sm text-muted-foreground">+{result.score} XP</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                  <Medal className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">Bonus de série</h4>
                  <p className="text-sm text-muted-foreground">+25 pièces (série de 4 jours)</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                  <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium">Top 50</h4>
                  <p className="text-sm text-muted-foreground">+50 XP</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-center">
              <p className="font-medium">Total gagné</p>
              <div className="flex justify-center space-x-4 mt-2">
                <div className="flex items-center">
                  <div className="bg-amber-100 dark:bg-amber-900 p-1 rounded-full mr-2">
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">$</span>
                  </div>
                  <span className="font-bold">+75 pièces</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded-full mr-2">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">XP</span>
                  </div>
                  <span className="font-bold">+125 XP</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="answers" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Revoyez vos réponses et consultez les bonnes solutions.</p>

            <div className="space-y-4">
              {dailyQuizData.questions.map((q, index) => {
                const userAnswer = selectedAnswers[index] || "Non répondu";
                const isCorrect = userAnswer === q.correctAnswer;

                return (
                  <div key={q.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">
                        {index + 1}. {q.question}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${isCorrect ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>{isCorrect ? "Juste" : "Incorrect"}</span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Votre réponse : </span>
                        <span className={isCorrect ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>{userAnswer}</span>
                      </p>

                      {!isCorrect && (
                        <p>
                          <span className="text-muted-foreground">Bonne réponse : </span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{q.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onReset}>
          Voir le détail du défi
        </Button>

        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Share2 className="h-4 w-4 mr-2" />
                Partager le résultat
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex items-center" onClick={() => handleShare("twitter")}>
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button size="sm" variant="outline" className="flex items-center" onClick={() => handleShare("facebook")}>
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button size="sm" variant="outline" className="flex items-center" onClick={() => handleShare("copy")}>
                  <Link className="h-4 w-4 mr-2" />
                  Copier
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardFooter>
    </Card>
  );
}
