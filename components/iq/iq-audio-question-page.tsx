"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AudioLines, CheckCircle, Headphones, Loader2, Pause, Play, Radio, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

export type IqAudioQuestionOption = {
  key: string;
  audioUrl: string;
};

export type IqAudioQuestionData = {
  questionText: string;
  answerPromptText: string;
  promptAudioUrl: string;
  options: IqAudioQuestionOption[];
  maxStimulusPlays: number;
  transitionDelayMs: number;
  timeLimitSeconds?: number;
};

type IqAudioQuestionPageProps = {
  data: IqAudioQuestionData | null;
  error?: string;
};

type Phase = "stimulus" | "transition" | "answer" | "answered" | "timedOut";

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
      aria-label={isPaused ? "Reprendre la maquette" : "Demander une pause en fin de question"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function IqAudioQuestionPage({ data, error }: IqAudioQuestionPageProps) {
  useBlockTestBackNavigation();
  const [phase, setPhase] = useState<Phase>("stimulus");
  const [stimulusPlayCount, setStimulusPlayCount] = useState(0);
  const [isPlayingStimulus, setIsPlayingStimulus] = useState(false);
  const [playingOptionKey, setPlayingOptionKey] = useState<string | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [transitionRemainingMs, setTransitionRemainingMs] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(data?.timeLimitSeconds ?? 0);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBoundaryAction, setPausedBoundaryAction] = useState<"stay" | null>(null);
  const stimulusAudioRef = useRef<HTMLAudioElement | null>(null);
  const optionAudioRef = useRef<HTMLAudioElement | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionTimeLimitSeconds = data?.timeLimitSeconds ?? null;
  const showQuestionTimer = Boolean(questionTimeLimitSeconds);
  const timeProgress = questionTimeLimitSeconds ? Math.max(0, Math.min(100, (timeRemaining / Math.max(questionTimeLimitSeconds, 1)) * 100)) : 100;

  useEffect(() => {
    setTimeRemaining(data?.timeLimitSeconds ?? 0);
    setPhase("stimulus");
    setSelectedOptionKey(null);
    setPauseRequested(false);
    setIsPaused(false);
    setPausedBoundaryAction(null);
  }, [data?.timeLimitSeconds, data?.promptAudioUrl]);

  useEffect(() => {
    return () => {
      stimulusAudioRef.current?.pause();
      optionAudioRef.current?.pause();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "transition" || !data) {
      return;
    }

    setTransitionRemainingMs(data.transitionDelayMs);
    const interval = setInterval(() => {
      setTransitionRemainingMs((current) => Math.max(current - 100, 0));
    }, 100);

    transitionTimeoutRef.current = setTimeout(() => {
      setPhase("answer");
    }, data.transitionDelayMs);

    return () => {
      clearInterval(interval);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [phase, data]);

  useEffect(() => {
    if (!questionTimeLimitSeconds || phase === "answered" || isPaused) {
      return;
    }

    if (timeRemaining <= 0) {
      if (pauseRequested) {
        setPauseRequested(false);
        setIsPaused(true);
        setPausedBoundaryAction("stay");
      }
      setPhase("timedOut");
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [questionTimeLimitSeconds, phase, timeRemaining, isPaused, pauseRequested]);

  const handlePauseToggle = () => {
    if (isPaused) {
      setIsPaused(false);
      setPausedBoundaryAction(null);
      return;
    }

    if (phase === "answered" || phase === "timedOut") {
      return;
    }

    setPauseRequested((current) => !current);
  };

  const canPlayStimulus = useMemo(() => {
    if (!data) return false;
    return stimulusPlayCount < data.maxStimulusPlays && !isPlayingStimulus && phase === "stimulus";
  }, [data, stimulusPlayCount, isPlayingStimulus, phase]);

  const playStimulus = async () => {
    if (!data || !canPlayStimulus) return;

    optionAudioRef.current?.pause();
    setPlayingOptionKey(null);

    const audio = new Audio(data.promptAudioUrl);
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

  const playOption = async (optionKey: string, audioUrl: string) => {
    if (phase !== "answer" && phase !== "answered") return;

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

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Question sonore indisponible</AlertTitle>
          <AlertDescription>{error || "Cette question sonore est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 md:py-8">
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

      {pauseRequested && !isPaused && phase !== "answered" && phase !== "timedOut" ? (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Pause demandee : la question en cours continue normalement, puis la pause prendra effet.
        </div>
      ) : null}

      <div className="relative">
      {isPaused ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 text-center backdrop-blur-sm">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Pause className="h-6 w-6" />
            </div>
            <p className="font-semibold">Pause active</p>
            <p className="mt-1 text-sm text-muted-foreground">La pause a ete prise en compte a la fin de la question courante.</p>
          </div>
        </div>
      ) : null}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="border-b bg-indigo-50 px-4 py-4 md:px-6 md:py-5">
          <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1rem,3.9vw,2rem)] font-bold leading-none tracking-tight text-slate-950">
            {phase === "stimulus" || phase === "transition" ? data.questionText : data.answerPromptText}
          </h1>
        </div>

        <div className="space-y-6 p-4 md:space-y-8 md:p-8">
          {(phase === "stimulus" || phase === "transition") ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border bg-background px-4 py-8 shadow-sm md:px-6 md:py-10">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  {isPlayingStimulus ? <Volume2 className="h-10 w-10" /> : <AudioLines className="h-10 w-10" />}
                </div>
                <p className="mb-6 text-sm text-muted-foreground">Ecoutez attentivement sans support visuel ni texte descriptif.</p>
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
                Lecture stimulus : {stimulusPlayCount}/{data.maxStimulusPlays}
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
          ) : phase === "timedOut" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Temps ecoule. Passage a la question suivante.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid gap-3">
                {data.options.map((option) => {
                  const isSelected = selectedOptionKey === option.key;
                  const isPlaying = playingOptionKey === option.key;

                  return (
                    <div
                      key={option.key}
                      className={`rounded-2xl border bg-background p-3 shadow-sm transition-all ${
                        isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                          {option.key}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full justify-center rounded-lg px-3 text-base"
                            onClick={() => void playOption(option.key, option.audioUrl)}
                          >
                            {isPlaying ? <Radio className="mr-2 h-4 w-4 animate-pulse" /> : <Play className="mr-2 h-4 w-4" />}
                            Ecouter
                          </Button>
                          <Button
                            type="button"
                            className="h-9 w-full justify-center rounded-lg px-3 text-base"
                            variant={isSelected ? "default" : "secondary"}
                            onClick={() => {
                              setSelectedOptionKey(option.key);
                              if (pauseRequested) {
                                setPauseRequested(false);
                                setIsPaused(true);
                                setPausedBoundaryAction("stay");
                              }
                              setPhase("answered");
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
              </div>

              {phase === "answered" && selectedOptionKey ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-indigo-800">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Selection enregistree : {selectedOptionKey}.</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
}
