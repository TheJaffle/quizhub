"use client";

import type { IqAttemptPhase } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { AlertTriangle, Brain, ImageIcon, Languages, Loader2, Pause, Play, Sigma } from "lucide-react";
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

const DEFAULT_MAIN_QUESTION_SECONDS = 15;

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
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        pauseRequested && !isPaused ? "border-indigo-300 text-indigo-600" : ""
      }`}
      aria-label={isPaused ? "Reprendre le test" : "Demander une pause en fin de question"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function getSectionBadge(sectionKey: string) {
  switch (sectionKey) {
    case "verbal":
      return { label: "Verbale", icon: Languages };
    case "logic":
      return { label: "Logique", icon: Brain };
    case "quantitative":
      return { label: "Quantitative", icon: Sigma };
    case "spatial":
      return { label: "Spatiale", icon: ImageIcon };
    default:
      return { label: "Question", icon: Brain };
  }
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
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_MAIN_QUESTION_SECONDS);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const displayedAtRef = useRef<Date>(new Date());
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentQuestionTimeLimitSeconds = currentQuestion?.timeLimitSeconds ?? DEFAULT_MAIN_QUESTION_SECONDS;
  const isMainPhase = data?.phase === "main";
  const timeProgress = Math.max(0, Math.min(100, (timeRemaining / currentQuestionTimeLimitSeconds) * 100));
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const sectionBadge = currentQuestion ? getSectionBadge(currentQuestion.sectionKey) : null;
  const SectionBadgeIcon = sectionBadge?.icon;

  useEffect(() => {
    displayedAtRef.current = new Date();
    isSubmittingRef.current = false;
    setTimeRemaining(currentQuestionTimeLimitSeconds);
    setSelectedOptionId(null);
    setSelectedPosition(null);
    setSavedAnswer(null);
    setSaveError(null);
    setPauseRequested(false);
    setIsPaused(false);
  }, [currentQuestion?.id, currentQuestionTimeLimitSeconds]);

  useEffect(() => {
    if (!currentQuestion && data?.nextUrl) {
      router.push(data.nextUrl);
    }
  }, [currentQuestion, data?.nextUrl, router]);

  useEffect(() => {
    if (!isMainPhase || !currentQuestion || isSaving || savedAnswer) return;

    if (timeRemaining <= 0) {
      void saveAnswer({ questionId: currentQuestion.id, responseTimeMs: currentQuestionTimeLimitSeconds * 1000 });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isMainPhase, currentQuestion, currentQuestionTimeLimitSeconds, timeRemaining, isSaving, savedAnswer]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

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
        correctOptionId: "",
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

  const saveAnswer = async (body: { questionId: number; selectedOptionId?: number | null; selectedPosition?: number | null; responseTimeMs?: number }) => {
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

      void continueAfterSave();
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
    if (!data || !currentQuestion || isSaving || savedAnswer) return;

    const numericQuestionId = Number(questionId);
    const numericOptionId = Number(optionId);

    setSelectedOptionId(numericOptionId);
    void saveAnswer({ questionId: numericQuestionId, selectedOptionId: numericOptionId });
  };

  const handleSelectPosition = async (position: number) => {
    if (!currentQuestion || isSaving || savedAnswer) return;

    setSelectedPosition(position);
    void saveAnswer({ questionId: currentQuestion.id, selectedPosition: position });
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
          <AlertTitle>Phase indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        {currentQuestion && sectionBadge ? (
          <Badge className="bg-indigo-500 text-white hover:bg-indigo-600">
            {SectionBadgeIcon ? <SectionBadgeIcon className="mr-1 h-3.5 w-3.5" /> : null}
            {sectionBadge.label}
          </Badge>
        ) : <div />}
        {currentQuestion && isMainPhase ? (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-[110px] md:w-[140px]">
              <TimeProgressBar value={timeProgress} />
            </div>
            <PauseToggleButton isPaused={isPaused} pauseRequested={pauseRequested} onClick={handlePauseToggle} />
          </div>
        ) : null}
      </div>

      {pauseRequested && !isPaused && !savedAnswer ? (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Pause demandee : elle prendra effet a la fin de la question en cours.
        </div>
      ) : null}

      {!currentQuestion ? (
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Transition en cours</h2>
          <p className="text-muted-foreground">Redirection vers l'etape suivante du test...</p>
        </Card>
      ) : (
        <div className="relative">
          {isPaused ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Pause className="h-6 w-6" />
                </div>
                <p className="font-semibold">Pause active</p>
                <p className="mt-1 text-sm text-muted-foreground">La pause a pris effet a la fin de la question courante. Appuyez sur lecture pour reprendre.</p>
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

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectOption(String(currentQuestion.id), String(option.id))}
                            disabled={Boolean(savedAnswer) || isSaving || isPaused}
                            className={`relative min-h-[120px] overflow-hidden rounded-lg border bg-background p-2 text-left transition-all hover:bg-accent ${
                              isSelected ? "border-2 shadow-md" : ""
                            }`}
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

                          return (
                            <button
                              key={position}
                              type="button"
                            aria-label={`Réponse ${position}`}
                            onClick={() => handleSelectPosition(position)}
                              disabled={Boolean(savedAnswer) || isSaving || isPaused}
                              className={`border border-transparent bg-transparent transition-all hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                isSelected ? "bg-indigo-500/15 ring-2 ring-indigo-500" : ""
                              }`}
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
