"use client";

import type { IqAttemptPhase } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { ResultEmailForm } from "@/components/results/result-email-form";
import { AlertTriangle, Brain, Loader2, Pause, Play, TimerReset, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqSpeedPhasePageProps = {
  data: IqAttemptPhase | null;
  error?: string;
};

type CompletionState = {
  userAttached: boolean;
  redirectUrl: string | null;
  guestResultReady: boolean;
};

function TimeProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-label="Temps restant">
      <div className="h-full rounded-full bg-amber-500 transition-all duration-300 ease-linear" style={{ width: `${value}%` }} />
    </div>
  );
}

function PauseToggleButton({ isPaused, onClick }: { isPaused: boolean; onClick: () => void }) {
  const Icon = isPaused ? Play : Pause;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      aria-label={isPaused ? "Reprendre le test" : "Mettre le test en pause"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function IqSpeedPhasePage({ data, error }: IqSpeedPhasePageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionState, setCompletionState] = useState<CompletionState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(data?.phaseTimeLimitSeconds ?? 120);
  const [isPaused, setIsPaused] = useState(false);
  const [isPauseCompletePending, setIsPauseCompletePending] = useState(false);
  const displayedAtRef = useRef<Date>(new Date());
  const hasCompletionStartedRef = useRef(false);

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const totalQuestions = questions.length;
  const timeTotal = Math.max(data?.phaseTimeLimitSeconds ?? 120, 1);
  const timeProgress = Math.max(0, Math.min(100, (timeRemaining / timeTotal) * 100));

  useEffect(() => {
    setSelectedOptionId(null);
    setSaveError(null);
    setIsPaused(false);
    setIsPauseCompletePending(false);
    displayedAtRef.current = new Date();
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!data || completionState || isCompleting) return;
    if (timeRemaining <= 0) {
      if (isPaused) {
        setIsPauseCompletePending(true);
        return;
      }

      void handleComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [completionState, data, isCompleting, timeRemaining, isPaused]);

  useEffect(() => {
    if (!data || completionState || isCompleting) return;
    if (questions.length === 0) {
      if (data.nextUrl) {
        router.push(data.nextUrl);
        return;
      }

      void handleComplete();
    }
  }, [completionState, data, isCompleting, questions.length, router]);

  const templateQuestion = useMemo(() => {
    if (!currentQuestion) return null;

    return {
      id: String(currentQuestion.id),
      text: currentQuestion.questionText || "Question rapidite",
      correctOptionId: "",
      options: currentQuestion.options.map((option) => ({
        id: String(option.id),
        label: option.key,
        text: option.text || "Option",
      })),
    };
  }, [currentQuestion]);

  const handleComplete = async () => {
    if (!data || hasCompletionStartedRef.current) return;

    hasCompletionStartedRef.current = true;
    setIsCompleting(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/iq/attempts/${data.attempt.token}/complete`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de finaliser le test.");
      }

      const completion = payload.completion as CompletionState;
      if (completion.userAttached && completion.redirectUrl) {
        router.push(completion.redirectUrl);
        return;
      }

      setCompletionState(completion);
    } catch (completionError) {
      hasCompletionStartedRef.current = false;
      setSaveError(completionError instanceof Error ? completionError.message : "Impossible de finaliser le test.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (!data || !currentQuestion || isSaving || isCompleting || completionState || isPaused) return;

    const numericQuestionId = Number(questionId);
    const numericOptionId = Number(optionId);
    const answeredAt = new Date();
    const responseTimeMs = Math.max(answeredAt.getTime() - displayedAtRef.current.getTime(), 0);

    setSelectedOptionId(numericOptionId);
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/iq/attempts/${data.attempt.token}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: numericQuestionId,
          selectedOptionId: numericOptionId,
          responseTimeMs,
          displayedAt: displayedAtRef.current.toISOString(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la réponse.");
      }

      if (currentQuestionIndex >= questions.length - 1 || timeRemaining <= 0) {
        if (data.nextUrl) {
          router.push(data.nextUrl);
          return;
        }

        await handleComplete();
        return;
      }

      setCurrentQuestionIndex((current) => current + 1);
    } catch (answerError) {
      setSelectedOptionId(null);
      setSaveError(answerError instanceof Error ? answerError.message : "Impossible d'enregistrer la réponse.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseToggle = () => {
    if (!currentQuestion || isSaving || isCompleting || completionState) return;

    if (isPaused && isPauseCompletePending) {
      setIsPaused(false);
      setIsPauseCompletePending(false);
      void handleComplete();
      return;
    }

    setIsPaused((current) => !current);
  };

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Phase rapidite indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (completionState?.guestResultReady) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Zap className="h-9 w-9" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Votre resultat est pret</h2>
          <p className="mb-6 text-muted-foreground">Recevez un lien sécurisé par email pour consulter votre score indicatif de raisonnement.</p>
          <ResultEmailForm resultType="iq" resultToken={data.attempt.token} />
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="hidden md:block md:mb-8">
        <Badge className="mb-3 w-fit bg-amber-500 text-white hover:bg-amber-600">
          <Brain className="mr-1 h-3.5 w-3.5" />
          Test de rapidite
        </Badge>
        <h1 className="text-2xl font-bold md:text-3xl">{data.attempt.testTitle}</h1>
        <p className="mt-2 text-muted-foreground">Repondez vite, chaque reponse est enregistree immediatement et le timer est global.</p>
      </div>

      <div className="mb-6">
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
          <div className="text-sm font-medium">
            Question {totalQuestions > 0 ? currentQuestionIndex + 1 : 0} of {totalQuestions}
          </div>
          <div className="flex items-center gap-2">
            <TimeProgressBar value={timeProgress} />
            <PauseToggleButton isPaused={isPaused} onClick={handlePauseToggle} />
          </div>
        </div>
      </div>

      {!currentQuestion ? (
        <Card className="p-8 text-center">
          <div className="mb-3 flex justify-center text-amber-500">
            <TimerReset className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Finalisation du test</h2>
          <p className="text-muted-foreground">Nous enregistrons votre derniere progression.</p>
          {isCompleting ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalisation...
            </div>
          ) : null}
        </Card>
      ) : (
        <div className="relative">
          {isPaused ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Pause className="h-6 w-6" />
                </div>
                <p className="font-semibold">{isPauseCompletePending ? "Temps termine" : "Test en pause"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isPauseCompletePending ? "Appuyez sur lecture pour finaliser le test." : "Le temps continue de defiler pendant la pause."}
                </p>
              </div>
            </div>
          ) : null}
          <Card className="overflow-hidden">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 p-6"
          >
            {templateQuestion ? (
              <QuizQuestion
                question={templateQuestion}
                selectedOptionId={selectedOptionId ? String(selectedOptionId) : null}
                onSelectOption={handleSelectOption}
                isReviewMode={isSaving || isCompleting || isPaused}
              />
            ) : null}

            {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
            {isSaving ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement de la reponse...
              </div>
            ) : null}
            {isCompleting ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finalisation du test...
              </div>
            ) : null}
          </motion.div>
          </Card>
        </div>
      )}
    </div>
  );
}
