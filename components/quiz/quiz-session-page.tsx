"use client";

import type { QuizSessionData } from "@/lib/quiz-sessions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type QuizSessionPageProps = {
  data: QuizSessionData | null;
  error?: string;
};

const difficultyLabels = {
  Easy: "Facile",
  Medium: "Moyen",
  Hard: "Difficile",
};

export function QuizSessionPage({ data, error }: QuizSessionPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [lastSelectedAnswerId, setLastSelectedAnswerId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<{ correctAnswers: number; totalQuestions: number; percent: number; resultToken: string } | null>(
    data?.session.status === "finished" && data.session.resultToken
      ? {
          correctAnswers: data.session.score ?? 0,
          totalQuestions: data.session.totalQuestions,
          percent: data.session.percentage ?? 0,
          resultToken: data.session.resultToken,
        }
      : null
  );
  const [scoreError, setScoreError] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quizStartedAtRef = useRef<number | null>(null);

  const submitScore = useCallback(
    async (answersSnapshot: Record<number, number>) => {
      if (!data?.session || isSubmitting || score) return;

      setIsSubmitting(true);
      setScoreError(null);

      try {
        const durationSeconds =
          quizStartedAtRef.current === null
            ? null
            : Math.max(0, Math.round((performance.now() - quizStartedAtRef.current) / 1000));

        const response = await fetch(`/api/quiz-sessions/${encodeURIComponent(data.session.token)}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: Object.entries(answersSnapshot).map(([questionId, answerId]) => ({
              questionId: Number(questionId),
              answerId,
            })),
            durationSeconds,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Impossible de calculer le score.");
        }

        setScore(payload.score);
      } catch (submitError) {
        setScoreError(submitError instanceof Error ? submitError.message : "Impossible de calculer le score.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [data?.session, isSubmitting, score]
  );

  useEffect(() => {
    if (!data?.session || score) return;
    quizStartedAtRef.current = performance.now();
  }, [data?.session, score]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

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
      <Card className="p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Session introuvable</h1>
        <p className="text-muted-foreground">Cette session de quiz n'existe pas ou n'est plus disponible.</p>
      </Card>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex] ?? null;
  const progress = data.questions.length > 0 ? ((currentQuestionIndex + 1) / data.questions.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === data.questions.length - 1;
  const correctAnswerText = currentQuestion?.answers.find((answer) => answer.id === currentQuestion.correctAnswerId)?.text;

  const handleSelectAnswer = (questionId: number, answerId: number) => {
    if (!currentQuestion || showFeedback || isSubmitting || score) return;

    const nextAnswers = {
      ...selectedAnswers,
      [questionId]: answerId,
    };
    const isCorrect = currentQuestion.correctAnswerId === answerId;

    setSelectedAnswers(nextAnswers);
    setLastSelectedAnswerId(answerId);
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
      setLastAnswerCorrect(null);
      setLastSelectedAnswerId(null);

      if (!isLastQuestion) {
        setCurrentQuestionIndex((current) => current + 1);
      } else {
        void submitScore(nextAnswers);
      }
    }, 1000);
  };

  const templateQuestion = currentQuestion
    ? {
        id: String(currentQuestion.id),
        text: currentQuestion.text,
        correctOptionId: String(currentQuestion.correctAnswerId ?? ""),
        options: currentQuestion.answers.map((answer) => ({
          id: String(answer.id),
          label: answer.label,
          text: answer.text,
        })),
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="mb-8">
        <h1 className="mb-3 text-2xl font-bold md:text-3xl">{data.topic.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{data.topic.categoryName}</Badge>
          <Badge>{difficultyLabels[data.session.difficulty]}</Badge>
          <Badge variant="secondary">{data.questions.length} questions</Badge>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">
            Question {data.questions.length > 0 ? currentQuestionIndex + 1 : 0} sur {data.questions.length}
          </div>
        </div>
        <Progress value={score ? 100 : progress} className="h-2" />
      </div>

      {score ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Votre résultat est prêt</h2>
          <p className="mb-6 text-muted-foreground">
            Score : {score.correctAnswers}/{score.totalQuestions} ({score.percent}%)
          </p>
          <Button asChild>
            <Link href={`/quiz/results/${score.resultToken}`}>Voir mon résultat</Link>
          </Button>
        </Card>
      ) : !currentQuestion ? (
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Aucune question trouvée</h2>
          <p className="text-muted-foreground">Cette session ne contient pas encore de questions.</p>
        </Card>
      ) : (
        <div className="relative">
          {showFeedback ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
              <div className={`rounded-lg p-6 text-center ${lastAnswerCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <div className={`mb-2 flex justify-center ${lastAnswerCorrect ? "text-green-500" : "text-red-500"}`}>
                  {lastAnswerCorrect ? <CheckCircle className="h-14 w-14" /> : <XCircle className="h-14 w-14" />}
                </div>
                <h3 className="mb-1 text-xl font-bold">{lastAnswerCorrect ? "Correct !" : "Incorrect"}</h3>
                <p>{lastAnswerCorrect ? "Question suivante..." : `La bonne réponse était : ${correctAnswerText ?? "indisponible"}`}</p>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              {currentQuestion.imageUrl ? (
                <div className="overflow-hidden rounded-lg">
                  <Image width={800} height={500} src={currentQuestion.imageUrl} alt="Question illustration" className="size-full object-cover object-center" />
                </div>
              ) : null}

              <div className={currentQuestion.imageUrl ? "space-y-6" : "space-y-6 md:col-span-2"}>
                {templateQuestion ? (
                  <QuizQuestion
                    question={templateQuestion}
                    selectedOptionId={lastSelectedAnswerId ? String(lastSelectedAnswerId) : null}
                    onSelectOption={(questionId, answerId) => handleSelectAnswer(Number(questionId), Number(answerId))}
                    isReviewMode={showFeedback || isSubmitting}
                  />
                ) : null}

                {scoreError ? <p className="text-sm text-destructive">{scoreError}</p> : null}
                {isSubmitting ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calcul du résultat...
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
