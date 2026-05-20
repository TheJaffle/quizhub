"use client";

import type { IqAttemptPhase } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { AlertTriangle, Brain, CheckCircle, Loader2, Pause, Play, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

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
const DEFAULT_ANSWER_SECONDS = 15;
const FEEDBACK_DELAY_MS = 1100;

function TimeProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-label="Temps restant">
      <div className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-linear" style={{ width: `${value}%` }} />
    </div>
  );
}

function PauseToggleButton({
  isPaused,
  pauseRequested,
  onClick,
}: {
  isPaused: boolean;
  pauseRequested: boolean;
  onClick: () => void;
}) {
  const Icon = isPaused ? Play : Pause;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        pauseRequested && !isPaused ? "border-emerald-300 text-emerald-600" : ""
      }`}
      aria-label={isPaused ? "Reprendre le test" : "Demander une pause en fin de question"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function IqMemoryPhasePage({ data, error }: IqMemoryPhasePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useBlockTestBackNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mode, setMode] = useState<"memorize" | "answer">("memorize");
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_DISPLAY_SECONDS);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [savedAnswer, setSavedAnswer] = useState<SavedAnswer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const answerDisplayedAtRef = useRef<Date>(new Date());
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const displaySeconds = currentQuestion?.displayTimeSeconds ?? DEFAULT_DISPLAY_SECONDS;
  const answerSeconds = currentQuestion?.timeLimitSeconds ?? DEFAULT_ANSWER_SECONDS;
  const timeTotal = Math.max(mode === "memorize" ? displaySeconds : answerSeconds, 1);
  const timeProgress = Math.max(0, Math.min(100, (timeRemaining / timeTotal) * 100));
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const stimulusText = currentQuestion?.stimulusText || currentQuestion?.questionText || "";

  useEffect(() => {
    if (!data || questions.length > 0 || !data.nextUrl) return;

    router.push(data.nextUrl);
  }, [data, questions.length, router]);

  useEffect(() => {
    if (!currentQuestion) return;

    setMode("memorize");
    isSubmittingRef.current = false;
    setTimeRemaining(Math.max(displaySeconds, 1));
    setSelectedOptionId(null);
    setSavedAnswer(null);
    setSaveError(null);
    setPauseRequested(false);
    setIsPaused(false);
  }, [currentQuestion?.id, currentQuestion, displaySeconds]);

  useEffect(() => {
    if (!currentQuestion || mode !== "memorize") return;

    if (timeRemaining <= 0) {
      answerDisplayedAtRef.current = new Date();
      setTimeRemaining(answerSeconds);
      setMode("answer");
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, mode, timeRemaining, answerSeconds]);

  useEffect(() => {
    if (!currentQuestion || mode !== "answer" || isSaving || savedAnswer) return;

    if (timeRemaining <= 0) {
      void saveAnswer({ questionId: currentQuestion.id, responseTimeMs: answerSeconds * 1000 });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, mode, timeRemaining, isSaving, savedAnswer, answerSeconds]);

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

  const currentResumeUrl = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  const continueAfterSave = async () => {
    if (!data) return;

    if (pauseRequested) {
      setPauseRequested(false);
      setIsPaused(true);
      return;
    }

    const isSpeedTransition = Boolean(data.nextUrl?.includes("/speed-intro"));
    const longMemoryPayload = isLastQuestion
      ? {
          resumeUrl: data.nextUrl ?? currentResumeUrl,
          force: true,
          afterCurrentAnswerAction: data.nextUrl ? (isSpeedTransition ? "return" : "advance") : "complete",
        }
      : {
          resumeUrl: currentResumeUrl,
        };

    try {
      const response = await fetch(`/api/iq/attempts/${data.attempt.token}/long-memory/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(longMemoryPayload),
      });
      const payload = (await response.json().catch(() => null)) as { nextUrl?: string | null } | null;

      if (response.ok && payload?.nextUrl) {
        router.push(payload.nextUrl);
        return;
      }
    } catch {
      // If the long-memory check fails, continue with the normal memory flow.
    }

    if (isLastQuestion) {
      if (data.nextUrl) {
        router.push(data.nextUrl);
      }
      return;
    }

    setDirection(1);
    setCurrentQuestionIndex((current) => current + 1);
  };

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
        void continueAfterSave();
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
    if (!data || !currentQuestion || mode !== "answer" || isSaving || savedAnswer) return;

    const numericQuestionId = Number(questionId);
    const numericOptionId = Number(optionId);

    setSelectedOptionId(numericOptionId);
    void saveAnswer({ questionId: numericQuestionId, selectedOptionId: numericOptionId });
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      setIsPaused(false);
      void continueAfterSave();
      return;
    }

    if (!currentQuestion || isSaving || savedAnswer) return;

    setPauseRequested((current) => !current);
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
      <div className="mb-6 flex items-center justify-between gap-3">
        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
          <Brain className="mr-1 h-3.5 w-3.5" />
          Memoire
        </Badge>
        {currentQuestion ? (
          <div className="ml-auto flex items-center gap-2">
            {mode === "answer" ? (
              <div className="w-[110px] md:w-[140px]">
                <TimeProgressBar value={timeProgress} />
              </div>
            ) : (
              <span className="min-w-[5.75rem] whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-center text-sm font-medium tabular-nums text-emerald-700">
                {timeRemaining} sec
              </span>
            )}
            <PauseToggleButton isPaused={isPaused} pauseRequested={pauseRequested} onClick={handlePauseToggle} />
          </div>
        ) : null}
      </div>

      {pauseRequested && !isPaused && !savedAnswer ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Pause demandee : elle prendra effet a la fin de la question en cours.
        </div>
      ) : null}

      {!currentQuestion ? (
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Phase memoire terminee</h2>
          <p className="text-muted-foreground">Redirection vers l'etape suivante...</p>
        </Card>
      ) : (
        <div className="relative">
          {isPaused ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Pause className="h-6 w-6" />
                </div>
                <p className="font-semibold">Pause active</p>
                <p className="mt-1 text-sm text-muted-foreground">La pause a pris effet a la fin de la question courante. Appuyez sur lecture pour reprendre.</p>
              </div>
            </div>
          ) : null}
          {savedAnswer && !isPaused ? (
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
