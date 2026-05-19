"use client";

import type { IqAttemptPhase } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { AlertTriangle, CheckCircle, ImageIcon, Loader2, Pause, Play, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqPhasePageProps = {
  data: IqAttemptPhase | null;
  error?: string;
};

type SavedAnswer = {
  isCorrect: boolean;
  correctOptionId: number | null;
  correctPosition: number | null;
  pointsEarned: number;
};

const FEEDBACK_DELAY_MS = 1100;
const MAIN_QUESTION_SECONDS = 15;

type OverlayGrid = {
  answerCount: number;
  gridColumns: number;
  gridRows: number;
};

function normalizeOverlayGrid(questionId: number, overlay: IqAttemptPhase["questions"][number]["overlay"]): OverlayGrid | null {
  if (!overlay) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[IQ overlay] Question ${questionId} has no overlay data; visual answers cannot be displayed.`);
    }

    return null;
  }

  const answerCount = Number.isInteger(overlay.answerCount) && overlay.answerCount > 0 ? overlay.answerCount : 4;
  const gridColumns = Number.isInteger(overlay.gridColumns) && overlay.gridColumns > 0 ? overlay.gridColumns : answerCount === 6 ? 3 : 2;
  const rawGridRows = Number.isInteger(overlay.gridRows) && overlay.gridRows > 0 ? overlay.gridRows : 2;
  const gridRows = gridColumns * rawGridRows >= answerCount ? rawGridRows : Math.ceil(answerCount / gridColumns);

  if (process.env.NODE_ENV !== "production" && (answerCount !== overlay.answerCount || gridColumns !== overlay.gridColumns || gridRows !== overlay.gridRows)) {
    console.warn(`[IQ overlay] Question ${questionId} uses fallback grid values.`, {
      answerCount,
      gridColumns,
      gridRows,
      raw: overlay,
    });
  }

  return {
    answerCount,
    gridColumns,
    gridRows,
  };
}

function TimeProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-label="Temps restant">
      <div className="h-full rounded-full bg-indigo-500 transition-all duration-300 ease-linear" style={{ width: `${value}%` }} />
    </div>
  );
}

function PauseToggleButton({ isPaused, onClick }: { isPaused: boolean; onClick: () => void }) {
  const Icon = isPaused ? Play : Pause;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={isPaused ? "Reprendre le test" : "Mettre le test en pause"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function IqPhasePage({ data, error }: IqPhasePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useBlockTestBackNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [savedAnswer, setSavedAnswer] = useState<SavedAnswer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(MAIN_QUESTION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [isPauseTimeoutPending, setIsPauseTimeoutPending] = useState(false);
  const displayedAtRef = useRef<Date>(new Date());
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const isMainPhase = data?.phase === "main";
  const timeProgress = Math.max(0, Math.min(100, (timeRemaining / MAIN_QUESTION_SECONDS) * 100));
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    displayedAtRef.current = new Date();
    isSubmittingRef.current = false;
    setTimeRemaining(MAIN_QUESTION_SECONDS);
    setSelectedOptionId(null);
    setSelectedPosition(null);
    setSavedAnswer(null);
    setSaveError(null);
    setIsPaused(false);
    setIsPauseTimeoutPending(false);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion && data?.nextUrl) {
      router.push(data.nextUrl);
    }
  }, [currentQuestion, data?.nextUrl, router]);

  useEffect(() => {
    if (!isMainPhase || !currentQuestion || isSaving || savedAnswer) return;

    if (timeRemaining <= 0) {
      if (isPaused) {
        setIsPauseTimeoutPending(true);
        return;
      }

      void saveAnswer({ questionId: currentQuestion.id, responseTimeMs: MAIN_QUESTION_SECONDS * 1000 });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isMainPhase, currentQuestion, timeRemaining, isSaving, savedAnswer, isPaused]);

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

  const isOverlayQuestion = currentQuestion?.format === "visual_overlay" || currentQuestion?.format === "spatial_overlay";
  const hasVisualQuestionImage = Boolean(currentQuestion?.imageUrl);
  const overlayGrid = useMemo(() => {
    if (!currentQuestion || !isOverlayQuestion) return null;

    return normalizeOverlayGrid(currentQuestion.id, currentQuestion.overlay);
  }, [currentQuestion, isOverlayQuestion]);
  const templateQuestion = currentQuestion && currentQuestion.format !== "image_choice" && !isOverlayQuestion
    ? {
        id: String(currentQuestion.id),
        text: currentQuestion.questionText || "Question sans texte",
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

    try {
      const response = await fetch(`/api/iq/attempts/${data.attempt.token}/long-memory/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeUrl: currentResumeUrl,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { nextUrl?: string | null } | null;

      if (response.ok && payload?.nextUrl) {
        router.push(payload.nextUrl);
        return;
      }
    } catch {
      // If the long-memory check fails, continue with the normal question flow.
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
    body: { questionId: number; selectedOptionId?: number | null; selectedPosition?: number | null; responseTimeMs?: number },
    options?: { feedbackDelayMs?: number }
  ) => {
    if (!data || !currentQuestion || isSaving || savedAnswer || isSubmittingRef.current) return;

    const answeredAt = new Date();
    const responseTimeMs = body.responseTimeMs ?? Math.max(answeredAt.getTime() - displayedAtRef.current.getTime(), 0);

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
          displayedAt: displayedAtRef.current.toISOString(),
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
      setSelectedPosition(null);
      setSaveError(answerError instanceof Error ? answerError.message : "Impossible d'enregistrer la réponse.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (!data || !currentQuestion || isSaving || savedAnswer || isPaused) return;

    const numericQuestionId = Number(questionId);
    const numericOptionId = Number(optionId);

    setSelectedOptionId(numericOptionId);
    void saveAnswer({ questionId: numericQuestionId, selectedOptionId: numericOptionId });
  };

  const handleSelectPosition = async (position: number) => {
    if (!currentQuestion || isSaving || savedAnswer || isPaused) return;

    setSelectedPosition(position);
    void saveAnswer({ questionId: currentQuestion.id, selectedPosition: position });
  };

  const handlePauseToggle = () => {
    if (!currentQuestion || isSaving || savedAnswer) return;

    if (isPaused && isPauseTimeoutPending) {
      setIsPaused(false);
      setIsPauseTimeoutPending(false);
      void saveAnswer({ questionId: currentQuestion.id, responseTimeMs: MAIN_QUESTION_SECONDS * 1000 }, { feedbackDelayMs: 0 });
      return;
    }

    setIsPaused((current) => !current);
  };

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Phase indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="mb-6">
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
          <div className="text-sm font-medium">
            Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
          </div>
          {currentQuestion && isMainPhase ? (
            <div className="flex items-center gap-2">
              <TimeProgressBar value={timeProgress} />
              <PauseToggleButton isPaused={isPaused} onClick={handlePauseToggle} />
            </div>
          ) : null}
        </div>
      </div>

      {!currentQuestion ? (
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Transition en cours</h2>
          <p className="text-muted-foreground">Redirection vers l'etape suivante du test...</p>
        </Card>
      ) : (
        <div className="relative">
          {isPaused && !savedAnswer ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Pause className="h-6 w-6" />
                </div>
                <p className="font-semibold">{isPauseTimeoutPending ? "Temps termine" : "Test en pause"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isPauseTimeoutPending ? "Appuyez sur lecture pour passer a la suite." : "Le temps continue de defiler pendant la pause."}
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
                <p>
                  {savedAnswer.isCorrect
                    ? "Réponse enregistrée."
                    : isOverlayQuestion
                      ? `Bonne zone : ${savedAnswer.correctPosition ?? "indisponible"}`
                      : `Bonne réponse : ${correctOptionText ?? "indisponible"}`}
                </p>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: direction * 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2 md:gap-6 md:p-6"
            >
              {currentQuestion.imageUrl ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-snug text-muted-foreground">{currentQuestion.questionText || "Question visuelle"}</p>
                  <div className="relative min-h-[260px] overflow-hidden rounded-lg bg-muted md:min-h-[420px]">
                    <Image src={currentQuestion.imageUrl} alt="Question visuelle" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-1.5 md:p-3" />
                  </div>
                </div>
              ) : currentQuestion.format === "image_choice" ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-lg border bg-muted/40">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="mx-auto mb-3 h-10 w-10" />
                    <p className="text-sm">Question visuelle</p>
                  </div>
                </div>
              ) : null}

              <div className={currentQuestion.imageUrl || currentQuestion.format === "image_choice" ? "space-y-4 md:space-y-6" : "space-y-4 md:col-span-2 md:space-y-6"}>
                {templateQuestion ? (
                  <QuizQuestion
                    question={templateQuestion}
                    selectedOptionId={selectedOptionId ? String(selectedOptionId) : null}
                    onSelectOption={handleSelectOption}
                    isReviewMode={Boolean(savedAnswer) || isSaving || isPaused}
                  />
                ) : null}

                {currentQuestion.format === "image_choice" ? (
                  <div className="space-y-6">
                    {!hasVisualQuestionImage ? <h2 className="text-xl font-semibold leading-tight md:text-2xl">{currentQuestion.questionText || "Question visuelle"}</h2> : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {currentQuestion.options.map((option) => {
                        const isSelected = selectedOptionId === option.id;
                        const isCorrect = savedAnswer?.correctOptionId === option.id;
                        const isWrong = Boolean(savedAnswer) && isSelected && !isCorrect;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectOption(String(currentQuestion.id), String(option.id))}
                            disabled={Boolean(savedAnswer) || isSaving || isPaused}
                            className={`relative min-h-[120px] overflow-hidden rounded-lg border bg-background p-2 text-left transition-all hover:bg-accent ${
                              isSelected ? "border-2 shadow-md" : ""
                            } ${isCorrect ? "border-green-500 bg-green-50" : ""} ${isWrong ? "border-red-500 bg-red-50" : ""}`}
                          >
                            {option.imageUrl ? (
                              <div className="relative h-24 w-full">
                                <Image src={option.imageUrl} alt={option.text || option.key} fill sizes="(max-width: 768px) 50vw, 220px" className="object-contain" />
                              </div>
                            ) : null}
                            <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">{option.key}</span>
                              <span>{option.text || "Option"}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {isOverlayQuestion && currentQuestion.overlay && overlayGrid ? (
                  <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-lg border bg-muted/30">
                      <Image
                        src={currentQuestion.overlay.answersImageUrl}
                        alt="Réponses visuelles"
                        width={900}
                        height={600}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="h-auto w-full object-contain"
                      />
                      <div
                        className="absolute inset-0 grid"
                        style={{
                          gridTemplateColumns: `repeat(${overlayGrid.gridColumns}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${overlayGrid.gridRows}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: overlayGrid.answerCount }, (_, index) => {
                          const position = index + 1;
                          const isSelected = selectedPosition === position;
                          const isCorrect = savedAnswer?.correctPosition === position;
                          const isWrong = Boolean(savedAnswer) && isSelected && !isCorrect;

                          return (
                            <button
                              key={position}
                              type="button"
                            aria-label={`Réponse ${position}`}
                            onClick={() => handleSelectPosition(position)}
                              disabled={Boolean(savedAnswer) || isSaving || isPaused}
                              className={`border border-transparent bg-transparent transition-all hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                isSelected ? "bg-indigo-500/15 ring-2 ring-indigo-500" : ""
                              } ${isCorrect ? "bg-green-500/20 ring-2 ring-green-500" : ""} ${isWrong ? "bg-red-500/20 ring-2 ring-red-500" : ""}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
                {isSaving ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement de la réponse...
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
