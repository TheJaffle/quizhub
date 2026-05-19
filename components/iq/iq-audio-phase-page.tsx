"use client";

import type { IqAttemptPhase } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AudioLines, CheckCircle, Headphones, Loader2, Play, Radio, Volume2, XCircle } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [transitionRemainingMs, setTransitionRemainingMs] = useState(0);
  const stimulusAudioRef = useRef<HTMLAudioElement | null>(null);
  const optionAudioRef = useRef<HTMLAudioElement | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerDisplayedAtRef = useRef<Date>(new Date());
  const isSubmittingRef = useRef(false);

  const questions = data?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentAudio = currentQuestion?.audio ?? null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentResumeUrl = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

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
    if (!data || questions.length > 0 || !data.nextUrl) return;

    router.push(data.nextUrl);
  }, [data, questions.length, router]);

  useEffect(() => {
    stimulusAudioRef.current?.pause();
    optionAudioRef.current?.pause();
    setPlayingOptionKey(null);
    setStimulusPlayCount(0);
    setSelectedOptionId(null);
    setSavedAnswer(null);
    setSaveError(null);
    setIsSaving(false);
    setIsPlayingStimulus(false);
    setTransitionRemainingMs(0);
    isSubmittingRef.current = false;
    setPhase("stimulus");
  }, [currentQuestion?.id]);

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
      // If the long-memory check fails, continue with the normal audio flow.
    }

    if (isLastQuestion) {
      if (data.nextUrl) {
        router.push(data.nextUrl);
      }
      return;
    }

    setCurrentQuestionIndex((current) => current + 1);
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

  const saveAnswer = async (optionId: number) => {
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
          responseTimeMs: Math.max(new Date().getTime() - answerDisplayedAtRef.current.getTime(), 0),
          displayedAt: answerDisplayedAtRef.current.toISOString(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer la reponse.");
      }

      setSavedAnswer(payload.answer);
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
    <div className="mx-auto max-w-4xl px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-6">
        <Badge className="mb-3 bg-indigo-500 text-white hover:bg-indigo-600">
          <Headphones className="mr-1 h-3.5 w-3.5" />
          Test sonore
        </Badge>
      </div>

      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="border-b bg-indigo-50 px-4 py-4 md:px-6 md:py-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-700 md:text-sm">
            {phase === "stimulus" || phase === "transition" ? "Ecoute initiale" : "Rappel sonore"}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
            {phase === "stimulus" || phase === "transition" ? currentQuestion.questionText || "Ecoutez attentivement." : currentQuestion.answerPromptText || "Quelle sequence avez-vous entendue ?"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </p>
        </div>

        <div className="space-y-6 p-4 md:space-y-8 md:p-8">
          {phase === "stimulus" || phase === "transition" ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border bg-background px-4 py-8 shadow-sm md:px-6 md:py-10">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  {isPlayingStimulus ? <Volume2 className="h-10 w-10" /> : <AudioLines className="h-10 w-10" />}
                </div>
                <p className="mb-6 text-sm text-muted-foreground">Ecoutez attentivement la sequence sonore sans support textuel ni visuel explicatif.</p>
                <Button
                  size="lg"
                  className="w-full max-w-[320px] rounded-full px-8"
                  onClick={() => void playStimulus()}
                  disabled={!canPlayStimulus}
                >
                  {isPlayingStimulus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Ecouter la sequence
                </Button>
                <div className="mt-6 flex min-h-[28px] items-center justify-center">
                  <SoundPulse active={isPlayingStimulus} />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Lecture stimulus : {stimulusPlayCount}/{currentAudio.maxStimulusPlays}
              </div>

              {phase === "transition" ? (
                <div className="rounded-xl border bg-muted/40 px-4 py-4 text-center">
                  <p className="font-medium text-slate-900">Preparation des reponses audio...</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dans {(transitionRemainingMs / 1000).toFixed(1)} sec, les propositions audio apparaitront.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const isPlaying = playingOptionKey === option.key;

                  return (
                    <div
                      key={option.id}
                      className={`rounded-2xl border bg-background p-5 text-left shadow-sm transition-all ${
                        isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                            {option.key}
                          </span>
                          <div>
                            <p className="font-medium text-slate-950">Proposition {option.key}</p>
                            <p className="text-sm text-muted-foreground">Ecoutez la sequence puis validez si c&apos;est votre choix.</p>
                          </div>
                        </div>
                        <div className="text-indigo-600">
                          {isPlaying ? <Radio className="h-5 w-5 animate-pulse" /> : <Play className="h-5 w-5" />}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => void playOption(option.key, option.audioUrl)}
                          disabled={!option.audioUrl}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Ecouter
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          variant={isSelected ? "default" : "secondary"}
                          disabled={isSaving || Boolean(savedAnswer)}
                          onClick={() => {
                            setSelectedOptionId(option.id);
                            void saveAnswer(option.id);
                          }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Choisir {option.key}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {savedAnswer ? (
                <div className={`rounded-xl px-4 py-4 ${savedAnswer.isCorrect ? "border border-emerald-200 bg-emerald-50" : "border border-red-200 bg-red-50"}`}>
                  <div className={`flex items-center gap-2 ${savedAnswer.isCorrect ? "text-emerald-800" : "text-red-800"}`}>
                    {savedAnswer.isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
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
        </div>
      </Card>
    </div>
  );
}
