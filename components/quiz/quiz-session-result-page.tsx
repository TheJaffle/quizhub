import type { QuizSessionData } from "@/lib/quiz-sessions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Trophy } from "lucide-react";

type QuizSessionResultPageProps = {
  data: QuizSessionData | null;
  error?: string;
};

const difficultyLabels = {
  Easy: "Facile",
  Medium: "Moyen",
  Hard: "Difficile",
};

export function QuizSessionResultPage({ data, error }: QuizSessionResultPageProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Résultat introuvable</AlertTitle>
        <AlertDescription>Ce résultat est invalide ou n'est pas encore terminé.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Badge variant="success" className="mb-3">
          Résultat
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Votre résultat</h1>
        <p className="text-muted-foreground">
          {data.topic.name} - {difficultyLabels[data.session.difficulty]}
        </p>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">{data.topic.name}</CardTitle>
              <CardDescription>
                {data.topic.categoryName} - {difficultyLabels[data.session.difficulty]}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="mt-2 text-3xl font-bold">
                {data.session.score ?? 0}
                <span className="text-base font-medium text-muted-foreground"> / {data.session.totalQuestions}</span>
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Pourcentage</p>
              <p className="mt-2 text-3xl font-bold">{data.session.percentage ?? 0}%</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="mt-2 text-3xl font-bold">{data.session.totalQuestions}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {data.questions.map((question) => {
              const selectedAnswer = question.answers.find((answer) => answer.id === question.userAnswerId);
              const correctAnswer = question.answers.find((answer) => answer.id === question.correctAnswerId);
              const isCorrect = question.userAnswerId !== null && question.userAnswerId === question.correctAnswerId;

              return (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {question.position}. {question.text}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">Votre réponse : {selectedAnswer?.text ?? "Aucune réponse"}</p>
                      {!isCorrect ? <p className="text-sm text-muted-foreground">Bonne réponse : {correctAnswer?.text ?? "Indisponible"}</p> : null}
                    </div>
                    <Badge variant={isCorrect ? "success" : "destructive"}>{isCorrect ? "Correct" : "Incorrect"}</Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Résultat enregistré depuis une session de quiz générée aléatoirement.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
