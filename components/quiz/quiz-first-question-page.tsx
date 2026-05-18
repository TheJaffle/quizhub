"use client";

import type { QuizFirstQuestion } from "@/lib/quizzes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { QuizTimer } from "@/components/quiz/quiz-timer";
import { ResultEmailForm } from "@/components/results/result-email-form";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type QuizFirstQuestionPageProps = {
  data: QuizFirstQuestion | null;
  error?: string;
};

export function QuizFirstQuestionPage({ data, error }: QuizFirstQuestionPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [lastSelectedAnswerId, setLastSelectedAnswerId] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<{ totalQuestions: number; correctAnswers: number; percent: number; resultSaved: boolean; resultId: number | null; resultToken: string | null; userAttached: boolean } | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quizStartedAtRef = useRef<number | null>(null);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const submitScore = useCallback(
    async (answersSnapshot: Record<number, number>) => {
      if (!data?.quiz || isSubmitting || score) return;

      setIsSubmitting(true);
      setScoreError(null);

      try {
        const durationSeconds =
          quizStartedAtRef.current === null
            ? null
            : Math.max(0, Math.round((performance.now() - quizStartedAtRef.current) / 1000));

        const response = await fetch(`/api/quizzes/${data.quiz.slug}/score`, {
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
          throw new Error(payload.error || "Unable to calculate score.");
        }

        setScore(payload.score);
      } catch (submitError) {
        setScoreError(submitError instanceof Error ? submitError.message : "Unable to calculate score.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [data?.quiz, isSubmitting, score]
  );

  useEffect(() => {
    if (!data?.quiz || score) return;

    quizStartedAtRef.current = performance.now();
    setTimeRemaining(Math.max((data.quiz.timeLimit || 0) * 60, 0));
  }, [data?.quiz, score]);

  useEffect(() => {
    if (timeRemaining === null || score || isSubmitting) return;

    if (timeRemaining <= 0) {
      void submitScore(selectedAnswers);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => (current === null ? current : Math.max(current - 1, 0)));
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitting, score, selectedAnswers, submitScore, timeRemaining]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data?.quiz) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Quiz Not Found</h1>
          <p className="text-muted-foreground">The requested quiz could not be found.</p>
        </Card>
      </div>
    );
  }

  const { quiz, questions } = data;
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

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

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
      setLastAnswerCorrect(null);
      setLastSelectedAnswerId(null);

      if (!isLastQuestion) {
        setDirection(1);
        setCurrentQuestionIndex((current) => current + 1);
      } else {
        void submitScore(nextAnswers);
      }
    }, 1500);
  };

  const handleTemplateAnswerSelect = (questionId: string, answerId: string) => {
    handleSelectAnswer(Number(questionId), Number(answerId));
  };

  const correctAnswerText = currentQuestion?.answers.find((answer) => answer.id === currentQuestion.correctAnswerId)?.text;
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
    <div className="container mx-auto py-4 px-4 md:py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{quiz.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            {quiz.category}
          </Badge>
          <Badge variant={getDifficultyVariant(quiz.difficulty)} className="px-3 py-1 text-sm">
            {quiz.difficulty}
          </Badge>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
          </div>
          {timeRemaining !== null && !score ? <QuizTimer timeRemaining={timeRemaining} formatTime={formatTime} /> : null}
        </div>
        <Progress value={score ? 100 : progress} className="h-2" />
      </div>

      {score ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Votre résultat est prêt</h2>
          {score.userAttached ? (
            <>
              <p className="text-muted-foreground mb-6">Votre score a été enregistré sur votre compte.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {score.resultToken ? (
                  <Button asChild>
                    <Link href={`/results/${score.resultToken}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Voir mon résultat
                    </Link>
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">Votre résultat est prêt. Recevez un lien sécurisé par email pour le consulter.</p>
              {score.resultSaved ? <p className="text-sm text-muted-foreground mb-6">Votre résultat est conservé temporairement et pourra être rattaché à votre compte plus tard.</p> : null}
              {score.resultToken ? <ResultEmailForm resultType="quiz" resultToken={score.resultToken} /> : null}
            </>
          )}
        </Card>
      ) : !currentQuestion ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No question found</h2>
          <p className="text-muted-foreground">This quiz does not have an active question yet.</p>
        </Card>
      ) : (
        <div className="relative">
          {showFeedback ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
              <div className={`text-center p-6 rounded-lg ${lastAnswerCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <div className={`mb-2 flex justify-center ${lastAnswerCorrect ? "text-green-500" : "text-red-500"}`}>
                  {lastAnswerCorrect ? <CheckCircle className="h-14 w-14" /> : <XCircle className="h-14 w-14" />}
                </div>
                <h3 className="text-xl font-bold mb-1">{lastAnswerCorrect ? "Correct!" : "Incorrect!"}</h3>
                <p>{lastAnswerCorrect ? "Great job! Moving to next question..." : `The correct answer was: ${correctAnswerText ?? "Unavailable"}`}</p>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden">
            <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: direction * 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentQuestion.imageUrl ? (
                <div className="rounded-lg overflow-hidden">
                  <Image width={800} height={500} src={currentQuestion.imageUrl} alt="Question illustration" className="size-full object-center object-cover" />
                </div>
              ) : null}

              <div className={currentQuestion.imageUrl ? "space-y-6" : "space-y-6 md:col-span-2"}>
                {templateQuestion ? (
                  <QuizQuestion
                    question={templateQuestion}
                    selectedOptionId={lastSelectedAnswerId ? String(lastSelectedAnswerId) : null}
                    onSelectOption={handleTemplateAnswerSelect}
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
            </motion.div>
          </Card>
        </div>
      )}
    </div>
  );
}
