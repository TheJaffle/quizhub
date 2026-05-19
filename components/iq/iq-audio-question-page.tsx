"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AudioLines, CheckCircle, Headphones, Loader2, Play, Radio, Volume2 } from "lucide-react";
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
};

type IqAudioQuestionPageProps = {
  data: IqAudioQuestionData | null;
  error?: string;
};

type Phase = "stimulus" | "transition" | "answer" | "answered";

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

export function IqAudioQuestionPage({ data, error }: IqAudioQuestionPageProps) {
  useBlockTestBackNavigation();
  const [phase, setPhase] = useState<Phase>("stimulus");
  const [stimulusPlayCount, setStimulusPlayCount] = useState(0);
  const [isPlayingStimulus, setIsPlayingStimulus] = useState(false);
  const [playingOptionKey, setPlayingOptionKey] = useState<string | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [transitionRemainingMs, setTransitionRemainingMs] = useState(0);
  const stimulusAudioRef = useRef<HTMLAudioElement | null>(null);
  const optionAudioRef = useRef<HTMLAudioElement | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          ) : (
            <div className="space-y-4">
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
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center"
                            onClick={() => void playOption(option.key, option.audioUrl)}
                          >
                            {isPlaying ? <Radio className="mr-2 h-4 w-4 animate-pulse" /> : <Play className="mr-2 h-4 w-4" />}
                            Ecouter
                          </Button>
                          <Button
                            type="button"
                            className="w-full justify-center"
                            variant={isSelected ? "default" : "secondary"}
                            onClick={() => {
                              setSelectedOptionKey(option.key);
                              setPhase("answered");
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Choisir
                          </Button>
                        </div>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700 md:h-14 md:w-14 md:text-xl">
                          {option.key}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {phase === "answered" && selectedOptionKey ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-indigo-800">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Selection enregistree visuellement pour la maquette : proposition {selectedOptionKey}.</p>
                  </div>
                  <p className="mt-1 text-sm text-indigo-700">
                    Quand on branchera la base et le scoring, ce clic enregistrera la reponse comme les autres categories.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
