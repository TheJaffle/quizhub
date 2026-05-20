"use client";

import type { IqAttemptPhase } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResultEmailForm } from "@/components/results/result-email-form";
import { AlertTriangle, AudioLines, CheckCircle, Headphones, Loader2, Pause, Play, Radio, Volume2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqAudioPhasePageProps = {
  data: IqAttemptPhase | null;
  error?: string;
};

type SavedAnswer = {
  isCorrect: boolean;
  correctOptionId: number | null;
  pointsEarned: number;
};

type CompletionState = {
  userAttached: boolean;
  redirectUrl: string | null;
  guestResultReady: boolean;
};

type Phase = "stimulus" | "transition" | "answer" | "answered";

const FEEDBACK_DELAY_MS = 1100;

function SoundPulse({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-1.5">
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className={`w-1.5 rounded-full bg-indigo-500 transition-all duration-300 ${active ? "animate-pulse" : "opacity-40"}`}
          style={{
            height: active ? `${16 + ((index % 2) + 1) * 10}px` : "12px",
            animationDelay: `${index * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}

function TimeProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-indigo-100/80" aria-label="Temps restant">
      <div className="h-full rounded-full bg-indigo-400 transition-all duration-300 ease-linear" style={{ width: `${value}%` }} />
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
      title={isPaused ? "Reprendre le test" : pauseRequested ? "Pause demandee a la fin de la question" : "Mettre en pause a la fin de la question"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function IqAudioPhasePage({ data, error }: IqAudioPhasePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useBlockTestBackNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("stimulus");
  const [stimulusPlayCount, setStimulusPlayCount] = useState(0);
  const [isPlayingStimulus, setIsPlayingStimulus] = useState(false);
  const [playingOptionKey, setPlayingOptionKey] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [savedAnswer, setSavedAnswer] = useState<SavedAnswer | null>(null);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [transitionRemainingMs, setTransitionRemainingMs] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(data?.phaseTimeLimitSeconds ?? 0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionState, setCompletionState] = useState<CompletionState | null>(null);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBoundaryAction, setPausedBoundaryAction] = useState<"continue" | "complete" | null>(null);
  const stimulusAudioRef = useRef<HTMLAudioElement | null>(null);
  const optionAudioRef = useRef<HTMLAudioElement | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerDisplayedAtRef = useRef<Date>(new Date());
  const isSubmittingRef = useRef(false);
  const hasCompletionStartedRef = useRef(false);

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentAudio = currentQuestion?.audio ?? null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const questionTimeLimitSeconds = data?.phaseTimeLimitSeconds ?? null;
  const showQuestionTimer = Boolean(questionTimeLimitSeconds);
  const timeProgress = questionTimeLimitSeconds ? Math.max(0, Math.min(100, (timeRemaining / Math.max(questionTimeLimitSeconds, 1)) * 100)) : 100;
  const currentResumeUrl = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    setTimeRemaining(data?.phaseTimeLimitSeconds ?? 0);
    setCompletionState(null);
    setIsCompleting(false);
    setPauseRequested(false);
    setIsPaused(false);
    setPausedBoundaryAction(null);
    hasCompletionStartedRef.current = false;
  }, [data?.phaseTimeLimitSeconds, data?.attempt.token]);

  useEffect(() => {
    return () => {
      stimulusAudioRef.current?.pause();
      optionAudioRef.current?.pause();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!data || questions.length > 0 || completionState || isCompleting) return;

    if (data.nextUrl) {
      router.push(data.nextUrl);
      return;
    }

    void handlePhaseCompletion();
  }, [completionState, data, isCompleting, questions.length, router]);

  useEffect(() => {
    stimulusAudioRef.current?.pause();
    optionAudioRef.current?.pause();
    setPlayingOptionKey(null);
    setStimulusPlayCount(0);
    setSelectedOptionId(null);
    setSavedAnswer(null);
    setTimeoutTriggered(false);
    setSaveError(null);
    setIsSaving(false);
    setIsPlayingStimulus(false);
    setTransitionRemainingMs(0);
    setTimeRemaining(data?.phaseTimeLimitSeconds ?? 0);
    setPauseRequested(false);
    setIsPaused(false);
    setPausedBoundaryAction(null);
    isSubmittingRef.current = false;
    setPhase("stimulus");
  }, [currentQuestion?.id, data?.phaseTimeLimitSeconds]);

  useEffect(() => {
    if (!questionTimeLimitSeconds || completionState || isCompleting || isSaving || savedAnswer) {
      return;
    }

    if (timeRemaining <= 0) {
      if (phase === "answered") {
        return;
      }

      void saveAnswer(null, questionTimeLimitSeconds * 1000, { timedOut: true });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [completionState, isCompleting, questionTimeLimitSeconds, phase, timeRemaining, isSaving, savedAnswer]);

  useEffect(() => {
    if (phase !== "transition" || !currentAudio) {
      return;
    }

    setTransitionRemainingMs(currentAudio.transitionDelayMs);
    const interval = setInterval(() => {
      setTransitionRemainingMs((current) => Math.max(current - 100, 0));
    }, 100);

    transitionTimeoutRef.current = setTimeout(() => {
      answerDisplayedAtRef.current = new Date();
      setPhase("answer");
    }, currentAudio.transitionDelayMs);

    return () => {
      clearInterval(interval);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [phase, currentAudio]);

  const canPlayStimulus = useMemo(() => {
    if (!currentAudio) return false;
    return stimulusPlayCount < currentAudio.maxStimulusPlays && !isPlayingStimulus && phase === "stimulus";
  }, [currentAudio, stimulusPlayCount, isPlayingStimulus, phase]);

  const checkLongMemoryBoundary = async (
    resumeUrl: string,
    options?: { force?: boolean; afterCurrentAnswerAction?: "advance" | "return" | "complete" }
  ) => {
    try {
      const response = await fetch(`/api/iq/attempts/${data?.attempt.token}/long-memory/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeUrl,
          force: options?.force,
          afterCurrentAnswerAction: options?.afterCurrentAnswerAction,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { nextUrl?: string | null } | null;

      if (response.ok && payload?.nextUrl) {
        router.push(payload.nextUrl);
        return true;
      }
    } catch {
      // Keep the native flow when the deferred long-memory check fails.
    }

    return false;
  };

  const finalizeAttempt = async () => {
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

  const handlePhaseCompletion = async () => {
    if (!data || hasCompletionStartedRef.current) return;

    const isSpeedTransition = Boolean(data.nextUrl?.includes("/speed-intro"));

    if (data.nextUrl) {
      const interrupted = await checkLongMemoryBoundary(data.nextUrl, {
        force: true,
        afterCurrentAnswerAction: isSpeedTransition ? "return" : "advance",
      });

      if (interrupted) {
        return;
      }

      router.push(data.nextUrl);
      return;
    }

    const interrupted = await checkLongMemoryBoundary(currentResumeUrl, {
      force: true,
      afterCurrentAnswerAction: "complete",
    });

    if (interrupted) {
      return;
    }

    await finalizeAttempt();
  };

  const proceedAfterQuestionBoundary = async () => {
    if (!data) return;

    if (isLastQuestion) {
      await handlePhaseCompletion();
      return;
    }

    const interrupted = await checkLongMemoryBoundary(currentResumeUrl);

    if (interrupted) {
      return;
    }

    setCurrentQuestionIndex((current) => current + 1);
  };

  const continueAfterSave = async () => {
    if (pauseRequested) {
      setPauseRequested(false);
      setIsPaused(true);
      setPausedBoundaryAction(isLastQuestion ? "complete" : "continue");
      return;
    }

    await proceedAfterQuestionBoundary();
  };

  const playStimulus = async () => {
    if (!currentAudio || !canPlayStimulus) return;

    optionAudioRef.current?.pause();
    setPlayingOptionKey(null);

    const audio = new Audio(currentAudio.promptAudioUrl);
    stimulusAudioRef.current = audio;
    setIsPlayingStimulus(true);
    setStimulusPlayCount((current) => current + 1);

    audio.onended = () => {
      setIsPlayingStimulus(false);
      setPhase("transition");
    };

    try {
      await audio.play();
    } catch {
      setIsPlayingStimulus(false);
    }
  };

  const playOption = async (optionKey: string, audioUrl: string | null) => {
    if (!audioUrl || (phase !== "answer" && phase !== "answered")) return;

    optionAudioRef.current?.pause();
    const audio = new Audio(audioUrl);
    optionAudioRef.current = audio;
    setPlayingOptionKey(optionKey);
    audio.onended = () => setPlayingOptionKey((current) => (current === optionKey ? null : current));

    try {
      await audio.play();
    } catch {
      setPlayingOptionKey(null);
    }
  };

  const saveAnswer = async (
    optionId: number | null,
    forcedResponseTimeMs?: number,
    options?: { timedOut?: boolean }
  ) => {
    if (!data || !currentQuestion || isSaving || savedAnswer || isSubmittingRef.current) return;

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
          questionId: currentQuestion.id,
          selectedOptionId: optionId,
          responseTimeMs: forcedResponseTimeMs ?? Math.max(new Date().getTime() - answerDisplayedAtRef.current.getTime(), 0),
          displayedAt: answerDisplayedAtRef.current.toISOString(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la reponse.");
      }

      setSavedAnswer(payload.answer);
      setTimeoutTriggered(Boolean(options?.timedOut));
      setPhase("answered");
      feedbackTimeoutRef.current = setTimeout(() => {
        void continueAfterSave();
      }, FEEDBACK_DELAY_MS);
    } catch (answerError) {
      isSubmittingRef.current = false;
      setSelectedOptionId(null);
      setSaveError(answerError instanceof Error ? answerError.message : "Impossible d'enregistrer la reponse.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      const action = pausedBoundaryAction;
      setIsPaused(false);
      setPausedBoundaryAction(null);

      if (action === "complete") {
        void handlePhaseCompletion();
        return;
      }

      if (action === "continue") {
        void proceedAfterQuestionBoundary();
      }
      return;
    }

    if (isSaving || isCompleting || savedAnswer) {
      return;
    }

    setPauseRequested((current) => !current);
  };

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Phase sonore indisponible</AlertTitle>
          <AlertDescription>{error || "Cette phase sonore est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (completionState?.guestResultReady) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <Headphones className="h-9 w-9" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Votre resultat est pret</h2>
          <p className="mb-6 text-muted-foreground">Recevez un lien securise par email pour consulter votre resultat.</p>
          <ResultEmailForm resultType="iq" resultToken={data.attempt.token} />
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert>
          <Loader2 className="h-5 w-5 animate-spin" />
          <AlertTitle>Transition en cours</AlertTitle>
          <AlertDescription>Passage a l'etape suivante du test...</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentAudio) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Question sonore incomplete</AlertTitle>
          <AlertDescription>La question audio en cours ne contient pas toutes les donnees necessaires.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 md:py-8">
      <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
        <Badge className="bg-indigo-500 text-white hover:bg-indigo-600">
          <Headphones className="mr-1 h-3.5 w-3.5" />
          Sonore
        </Badge>
        <div className="ml-auto flex items-center gap-2">
        {showQuestionTimer ? (
          <div className="w-[110px] md:w-[140px]">
            <TimeProgressBar value={timeProgress} />
          </div>
        ) : null}
        <PauseToggleButton isPaused={isPaused} pauseRequested={pauseRequested} onClick={handlePauseToggle} />
        </div>
      </div>

      {pauseRequested && !isPaused && !savedAnswer ? (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Pause demandee : la question en cours continue normalement, puis le test se mettra en pause.
        </div>
      ) : null}

      <div className="relative">
      {isPaused ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Pause className="h-6 w-6" />
            </div>
            <p className="font-semibold">Test en pause</p>
            <p className="mt-1 text-sm text-muted-foreground">La pause a pris effet a la fin de la question courante. Appuyez sur lecture pour reprendre.</p>
          </div>
        </div>
      ) : null}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="border-b bg-indigo-50 px-4 py-3 md:px-6 md:py-5">
          <div className="space-y-2">
            <h1 className="text-center text-[clamp(0.8rem,2.9vw,2.1rem)] font-bold leading-tight tracking-tight text-slate-950 md:text-left">
              {phase === "stimulus" || phase === "transition"
                ? currentQuestion.questionText || "Ecoutez attentivement."
                : currentQuestion.answerPromptText || "Quelle sequence avez-vous entendue ?"}
            </h1>
          </div>
        </div>

        <div className="space-y-5 p-4 md:space-y-6 md:p-6">
          {phase === "stimulus" || phase === "transition" ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border bg-background px-4 py-8 shadow-sm md:px-6 md:py-10">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  {isPlayingStimulus ? <Volume2 className="h-10 w-10" /> : <AudioLines className="h-10 w-10" />}
                </div>
                <Button size="lg" className="w-full max-w-[320px] rounded-full px-8" onClick={() => void playStimulus()} disabled={!canPlayStimulus}>
                  {isPlayingStimulus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Ecouter la sequence
                </Button>
                <div className="mt-6 flex min-h-[28px] items-center justify-center">
                  <SoundPulse active={isPlayingStimulus} />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">Lecture stimulus : {stimulusPlayCount}/{currentAudio.maxStimulusPlays}</div>

              {phase === "transition" ? (
                <div className="rounded-xl border bg-muted/40 px-4 py-4 text-center">
                  <p className="font-medium text-slate-900">Preparation des reponses audio...</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dans {(transitionRemainingMs / 1000).toFixed(1)} sec, les propositions audio apparaitront.
                  </p>
                </div>
              ) : null}
            </div>
          ) : timeoutTriggered ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Temps ecoule. Passage a la question suivante...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isPlaying = playingOptionKey === option.key;

                return (
                  <div
                    key={option.id}
                    className={`rounded-xl border bg-background p-2.5 shadow-sm transition-all ${isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {option.key}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-full justify-center rounded-lg px-3 text-sm"
                          onClick={() => void playOption(option.key, option.audioUrl)}
                          disabled={!option.audioUrl}
                        >
                          {isPlaying ? <Radio className="mr-2 h-4 w-4 animate-pulse text-indigo-600" /> : <Play className="mr-2 h-4 w-4" />}
                          Ecouter
                        </Button>
                        <Button
                          type="button"
                          className="h-8 w-full justify-center rounded-lg px-3 text-sm"
                          variant={isSelected ? "default" : "secondary"}
                          disabled={isSaving || Boolean(savedAnswer) || isCompleting}
                          onClick={() => {
                            setSelectedOptionId(option.id);
                            void saveAnswer(option.id);
                          }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Choisir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {savedAnswer ? (
                <div className={`rounded-xl px-4 py-4 ${savedAnswer.isCorrect ? "border border-emerald-200 bg-emerald-50" : "border border-red-200 bg-red-50"}`}>
                  <div className={`flex items-center gap-2 ${savedAnswer.isCorrect ? "text-emerald-800" : "text-red-800"}`}>
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">{savedAnswer.isCorrect ? "Bonne reponse enregistree." : "Reponse enregistree."}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {saveError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Impossible d&apos;enregistrer la reponse</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          ) : null}

          {isCompleting ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalisation du test...
            </div>
          ) : null}
        </div>
      </Card>
      </div>
    </div>
  );
}
