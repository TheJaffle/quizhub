"use client";

import type { IqLongMemoryAnswer } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/quiz/quiz-question";
import { ResultEmailForm } from "@/components/results/result-email-form";
import { AlertTriangle, Brain, ImageIcon, Loader2, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqLongMemoryAnswerPageProps = {
  data: IqLongMemoryAnswer | null;
  error?: string;
};

type SavedAnswer = {
  isCorrect: boolean;
  correctOptionId: number | null;
  correctPosition: number | null;
  pointsEarned: number;
};

type CompletionState = {
  userAttached: boolean;
  redirectUrl: string | null;
  guestResultReady: boolean;
};

function TimeProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-label="Temps restant">
      <div className="h-full rounded-full bg-violet-500 transition-all duration-300 ease-linear" style={{ width: `${value}%` }} />
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
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        pauseRequested && !isPaused ? "border-violet-300 text-violet-600" : ""
      }`}
      aria-label={isPaused ? "Reprendre le test" : "Demander une pause en fin de question"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function IqLongMemoryAnswerPage({ data, error }: IqLongMemoryAnswerPageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [savedAnswer, setSavedAnswer] = useState<SavedAnswer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionState, setCompletionState] = useState<CompletionState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(data?.timeLimitSeconds ?? 0);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const displayedAtRef = useRef<Date>(new Date());

  const currentQuestion = data?.question ?? null;
  const isOverlayQuestion = currentQuestion?.format === "visual_overlay" || currentQuestion?.format === "spatial_overlay";
  const showTimer = Boolean(data?.timeLimitSeconds);
  const timeProgress = data?.timeLimitSeconds ? Math.max(0, Math.min(100, (timeRemaining / Math.max(data.timeLimitSeconds, 1)) * 100)) : 100;

  useEffect(() => {
    setTimeRemaining(data?.timeLimitSeconds ?? 0);
    setPauseRequested(false);
    setIsPaused(false);
  }, [data?.timeLimitSeconds, currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion || !data?.timeLimitSeconds || isSaving || savedAnswer || isCompleting || isPaused) {
      return;
    }

    if (timeRemaining <= 0) {
      void saveAnswer({ questionId: currentQuestion.id });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, data?.timeLimitSeconds, isCompleting, isSaving, savedAnswer, timeRemaining]);

  const templateQuestion = currentQuestion && !isOverlayQuestion
    ? {
        id: String(currentQuestion.id),
        text: currentQuestion.answerPromptText || currentQuestion.questionText || "Selectionnez la bonne reponse pour cette question de memoire longue.",
        correctOptionId: "",
        options: currentQuestion.options.map((option) => ({
          id: String(option.id),
          label: option.key,
          text: option.text || "Option",
        })),
      }
    : null;

  const finishFlow = async () => {
    if (!data) return;

    setIsCompleting(true);
    const response = await fetch(`/api/iq/attempts/${data.attempt.token}/long-memory/after-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ returnToUrl: data.returnToUrl }),
    });
    const payload = await response.json().catch(() => null) as
      | {
          nextUrl?: string | null;
          completion?: CompletionState | null;
        }
      | null;

    if (payload?.completion?.userAttached && payload.completion.redirectUrl) {
      router.push(payload.completion.redirectUrl);
      return;
    }

    if (payload?.completion?.guestResultReady) {
      setCompletionState(payload.completion);
      setIsCompleting(false);
      return;
    }

    router.push(payload?.nextUrl || data.returnToUrl);
  };

  const continueAfterSave = async () => {
    if (pauseRequested) {
      setPauseRequested(false);
      setIsPaused(true);
      return;
    }

    await finishFlow();
  };

  const saveAnswer = async (body: { questionId: number; selectedOptionId?: number | null; selectedPosition?: number | null }) => {
    if (!data || !currentQuestion || isSaving || savedAnswer) return;

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
          responseTimeMs: Math.max(new Date().getTime() - displayedAtRef.current.getTime(), 0),
          displayedAt: displayedAtRef.current.toISOString(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la reponse.");
      }

      setSavedAnswer(payload.answer);
      void continueAfterSave();
    } catch (answerError) {
      setSelectedOptionId(null);
      setSelectedPosition(null);
      setSaveError(answerError instanceof Error ? answerError.message : "Impossible d'enregistrer la reponse.");
    } finally {
      setIsSaving(false);
    }
  };

  if (error || !data || !currentQuestion) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Reponse memoire longue indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (completionState?.guestResultReady) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Brain className="h-9 w-9" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Votre resultat est pret</h2>
          <p className="mb-6 text-muted-foreground">Recevez un lien securise par email pour consulter votre resultat.</p>
          <ResultEmailForm resultType="iq" resultToken={data.attempt.token} />
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Badge className="bg-violet-600 text-white hover:bg-violet-700">
          <Brain className="mr-1 h-3.5 w-3.5" />
          Memoire longue
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          {showTimer ? (
            <div className="w-[110px] md:w-[140px]">
              <TimeProgressBar value={timeProgress} />
            </div>
          ) : null}
          <PauseToggleButton
            isPaused={isPaused}
            pauseRequested={pauseRequested}
            onClick={() => {
              if (isPaused) {
                setIsPaused(false);
                void continueAfterSave();
                return;
              }

              if (isSaving || savedAnswer || isCompleting) return;
              setPauseRequested((current) => !current);
            }}
          />
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">Reponse memoire longue</p>
      </div>

      {pauseRequested && !isPaused && !savedAnswer ? (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          Pause demandee : elle prendra effet a la fin de la question en cours.
        </div>
      ) : null}

      <div className="relative">
        {isPaused ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
            <div>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <Pause className="h-6 w-6" />
              </div>
              <p className="font-semibold">Pause active</p>
              <p className="mt-1 text-sm text-muted-foreground">La pause a pris effet a la fin de la question courante. Appuyez sur lecture pour reprendre.</p>
            </div>
          </div>
        ) : null}
      <Card className="overflow-hidden border-violet-200 shadow-lg shadow-violet-100/60">
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-6 p-6">
          {templateQuestion ? (
            <QuizQuestion
              question={templateQuestion}
              selectedOptionId={selectedOptionId ? String(selectedOptionId) : null}
              onSelectOption={(_, optionId) => {
                const numericOptionId = Number(optionId);
                setSelectedOptionId(numericOptionId);
                void saveAnswer({ questionId: currentQuestion.id, selectedOptionId: numericOptionId });
              }}
              isReviewMode={Boolean(savedAnswer) || isSaving || isPaused}
            />
          ) : null}

          {isOverlayQuestion && currentQuestion.overlay ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-center shadow-sm">
                <h2 className="mt-1 text-xl font-semibold leading-tight text-violet-950 md:text-2xl">
                  {currentQuestion.answerPromptText || currentQuestion.questionText || "Selectionnez la bonne reponse."}
                </h2>
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-muted/30">
                <Image
                  src={currentQuestion.overlay.answersImageUrl}
                  alt="Reponses memoire longue"
                  width={900}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="h-auto w-full object-contain"
                />
                <div
                  className="absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${currentQuestion.overlay.gridColumns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${currentQuestion.overlay.gridRows}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: currentQuestion.overlay.answerCount }, (_, index) => {
                    const position = index + 1;
                    const isSelected = selectedPosition === position;

                    return (
                      <button
                        key={position}
                        type="button"
                        aria-label={`Reponse ${position}`}
                        onClick={() => {
                          setSelectedPosition(position);
                          void saveAnswer({ questionId: currentQuestion.id, selectedPosition: position });
                        }}
                        disabled={Boolean(savedAnswer) || isSaving || isPaused}
                        className={`border border-transparent bg-transparent transition-all hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                          isSelected ? "bg-violet-500/15 ring-2 ring-violet-500" : ""
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : currentQuestion.imageUrl ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border bg-muted/40">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="mx-auto mb-3 h-10 w-10" />
                <p className="text-sm">Question visuelle</p>
              </div>
            </div>
          ) : null}

          {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
          {isSaving || isCompleting ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isCompleting ? "Finalisation du test..." : "Enregistrement de la reponse..."}
            </div>
          ) : null}
        </motion.div>
      </Card>
      </div>
    </div>
  );
}
