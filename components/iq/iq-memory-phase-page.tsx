"use client";

import type { IqAttemptPhase } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { AlertTriangle, Brain, CheckCircle, Loader2, Pause, Play, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type IqMemoryPhasePageProps = {
  data: IqAttemptPhase | null;
  error?: string;
};

type SavedAnswer = {
  isCorrect: boolean;
  correctOptionId: number | null;
  pointsEarned: number;
};

const DEFAULT_DISPLAY_SECONDS = 10;
const ANSWER_SECONDS = 15;
const FEEDBACK_DELAY_MS = 1100;

function TimeProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-label="Temps restant">
      <div className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-linear" style={{ width: `${value}%` }} />
    </div>
  );
}

function PauseToggleButton({ isPaused, onClick }: { isPaused: boolean; onClick: () => void }) {
  const Icon = isPaused ? Play : Pause;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={isPaused ? "Reprendre le test" : "Mettre le test en pause"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function IqMemoryPhasePage({ data, error }: IqMemoryPhasePageProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mode, setMode] = useState<"memorize" | "answer">("memorize");
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_DISPLAY_SECONDS);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [savedAnswer, setSavedAnswer] = useState<SavedAnswer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTransition, setPausedTransition] = useState<"memorize-complete" | "answer-timeout" | null>(null);
  const answerDisplayedAtRef = useRef<Date>(new Date());
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const displaySeconds = currentQuestion?.displayTimeSeconds ?? DEFAULT_DISPLAY_SECONDS;
  const timeTotal = Math.max(mode === "memorize" ? displaySeconds : ANSWER_SECONDS, 1);
  const timeProgress = Math.max(0, Math.min(100, (timeRemaining / timeTotal) * 100));
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const stimulusText = currentQuestion?.stimulusText || currentQuestion?.questionText || "";

  useEffect(() => {
    if (!data || questions.length > 0) return;

    router.push(`/iq/attempt/${data.attempt.token}/speed-intro`);
  }, [data, questions.length, router]);

  useEffect(() => {
    if (!currentQuestion) return;

    setMode("memorize");
    isSubmittingRef.current = false;
    setTimeRemaining(Math.max(displaySeconds, 1));
    setSelectedOptionId(null);
    setSavedAnswer(null);
    setSaveError(null);
    setIsPaused(false);
    setPausedTransition(null);
  }, [currentQuestion?.id, currentQuestion, displaySeconds]);

  useEffect(() => {
    if (!currentQuestion || mode !== "memorize") return;

    if (timeRemaining <= 0) {
      if (isPaused) {
        setPausedTransition("memorize-complete");
        return;
      }

      answerDisplayedAtRef.current = new Date();
      setTimeRemaining(ANSWER_SECONDS);
      setMode("answer");
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, mode, timeRemaining, isPaused]);

  useEffect(() => {
    if (!currentQuestion || mode !== "answer" || isSaving || savedAnswer) return;

    if (timeRemaining <= 0) {
      if (isPaused) {
        setPausedTransition("answer-timeout");
        return;
      }

      void saveAnswer({ questionId: currentQuestion.id, responseTimeMs: ANSWER_SECONDS * 1000 });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, mode, timeRemaining, isSaving, savedAnswer, isPaused]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const correctOptionText = useMemo(() => {
    if (!currentQuestion || !savedAnswer?.correctOptionId) return null;

    const correctOption = currentQuestion.options.find((option) => option.id === savedAnswer.correctOptionId);

    return correctOption?.text || correctOption?.key || null;
  }, [currentQuestion, savedAnswer]);

  const templateQuestion = currentQuestion
    ? {
        id: String(currentQuestion.id),
        text: currentQuestion.questionText || "Question memoire",
        correctOptionId: savedAnswer?.correctOptionId ? String(savedAnswer.correctOptionId) : "",
        options: currentQuestion.options.map((option) => ({
          id: String(option.id),
          label: option.key,
          text: option.text || "Option",
        })),
      }
    : null;

  const saveAnswer = async (
    body: { questionId: number; selectedOptionId?: number | null; responseTimeMs?: number },
    options?: { feedbackDelayMs?: number }
  ) => {
    if (!data || !currentQuestion || mode !== "answer" || isSaving || savedAnswer || isSubmittingRef.current) return;

    const answeredAt = new Date();
    const responseTimeMs = body.responseTimeMs ?? Math.max(answeredAt.getTime() - answerDisplayedAtRef.current.getTime(), 0);

    isSubmittingRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/iq/attempts/${data.attempt.token}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          responseTimeMs,
          displayedAt: answerDisplayedAtRef.current.toISOString(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la réponse.");
      }

      setSavedAnswer(payload.answer);

      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      feedbackTimeoutRef.current = setTimeout(() => {
        if (isLastQuestion) {
          router.push(`/iq/attempt/${data.attempt.token}/speed-intro`);
          return;
        }

        setDirection(1);
        setCurrentQuestionIndex((current) => current + 1);
      }, options?.feedbackDelayMs ?? FEEDBACK_DELAY_MS);
    } catch (answerError) {
      isSubmittingRef.current = false;
      setSelectedOptionId(null);
      setSaveError(answerError instanceof Error ? answerError.message : "Impossible d'enregistrer la réponse.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (!data || !currentQuestion || mode !== "answer" || isSaving || savedAnswer || isPaused) return;

    const numericQuestionId = Number(questionId);
    const numericOptionId = Number(optionId);

    setSelectedOptionId(numericOptionId);
    void saveAnswer({ questionId: numericQuestionId, selectedOptionId: numericOptionId });
  };

  const handlePauseToggle = () => {
    if (!currentQuestion || isSaving || savedAnswer) return;

    if (isPaused && pausedTransition === "memorize-complete") {
      setIsPaused(false);
      setPausedTransition(null);
      answerDisplayedAtRef.current = new Date();
      setTimeRemaining(ANSWER_SECONDS);
      setMode("answer");
      return;
    }

    if (isPaused && pausedTransition === "answer-timeout") {
      setIsPaused(false);
      setPausedTransition(null);
      void saveAnswer({ questionId: currentQuestion.id, responseTimeMs: ANSWER_SECONDS * 1000 }, { feedbackDelayMs: 0 });
      return;
    }

    setIsPaused((current) => !current);
  };

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Phase memoire indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="hidden md:block md:mb-8">
        <Badge className="mb-3 w-fit bg-emerald-500 text-white hover:bg-emerald-600">
          <Brain className="mr-1 h-3.5 w-3.5" />
          Test de memoire
        </Badge>
        <h1 className="text-2xl font-bold md:text-3xl">{data.attempt.testTitle}</h1>
        <p className="mt-2 text-muted-foreground">Memorisez le stimulus, puis choisissez la reponse correspondante.</p>
      </div>

      <div className="mb-6">
        <div className="mb-2 grid grid-cols-2 items-center gap-3">
          <div className="text-sm font-medium">
            Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
          </div>
          {currentQuestion ? (
            <div className="flex items-center gap-2">
              <TimeProgressBar value={timeProgress} />
              <PauseToggleButton isPaused={isPaused} onClick={handlePauseToggle} />
            </div>
          ) : null}
        </div>
      </div>

      {!currentQuestion ? (
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Phase memoire terminee</h2>
          <p className="text-muted-foreground">Redirection vers l'introduction rapidite...</p>
        </Card>
      ) : (
        <div className="relative">
          {isPaused && !savedAnswer ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Pause className="h-6 w-6" />
                </div>
                <p className="font-semibold">{pausedTransition ? "Temps termine" : "Test en pause"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pausedTransition ? "Appuyez sur lecture pour continuer." : "Le temps continue de defiler pendant la pause."}
                </p>
              </div>
            </div>
          ) : null}
          {savedAnswer ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
              <div className={`rounded-lg p-6 text-center ${savedAnswer.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <div className={`mb-2 flex justify-center ${savedAnswer.isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {savedAnswer.isCorrect ? <CheckCircle className="h-14 w-14" /> : <XCircle className="h-14 w-14" />}
                </div>
                <h3 className="mb-1 text-xl font-bold">{savedAnswer.isCorrect ? "Correct !" : "Incorrect"}</h3>
                <p>{savedAnswer.isCorrect ? "Reponse enregistree." : `Bonne reponse : ${correctOptionText ?? "indisponible"}`}</p>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden">
            <motion.div
              key={`${currentQuestion.id}-${mode}`}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6"
            >
              {mode === "memorize" ? (
                <div className="space-y-5 text-center">
                  <div className="rounded-lg border bg-muted/40 px-3 py-5 sm:px-5 md:p-8">
                    <p className="mb-3 text-sm font-medium text-muted-foreground">Memorisez ce contenu</p>
                    <p className="mx-auto max-w-full whitespace-nowrap text-[clamp(1.45rem,7vw,2.25rem)] font-bold tracking-normal sm:tracking-wide md:text-5xl">{stimulusText}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Le contenu disparaitra automatiquement avant l'affichage des reponses.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {templateQuestion ? (
                    <QuizQuestion
                      question={templateQuestion}
                      selectedOptionId={selectedOptionId ? String(selectedOptionId) : null}
                      onSelectOption={handleSelectOption}
                      isReviewMode={Boolean(savedAnswer) || isSaving || isPaused}
                    />
                  ) : null}

                  {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
                  {isSaving ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement de la reponse...
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </Card>
        </div>
      )}
    </div>
  );
}
