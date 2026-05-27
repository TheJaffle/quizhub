"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AudioLines, Headphones, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

export type IqAudioIntroData = {
  title: string;
  description: string;
  questionCount: number;
  maxStimulusPlays: number;
  timeLimitSeconds: number | null;
  previewAudioUrl: string | null;
  nextUrl: string;
};

function formatTimeLimit(totalSeconds: number) {
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} sec`;
}

type IqAudioIntroPageProps = {
  data: IqAudioIntroData | null;
  error?: string;
};

export function IqAudioIntroPage({ data, error }: IqAudioIntroPageProps) {
  const router = useRouter();
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  useBlockTestBackNavigation();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Introduction sonore indisponible</AlertTitle>
          <AlertDescription>{error || "Cette phase sonore est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handlePreviewToggle = async () => {
    if (!data.previewAudioUrl) return;

    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPreviewPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPreviewPlaying(false);
      return;
    }

    try {
      audio.currentTime = 0;
      await audio.play();
      setIsPreviewPlaying(true);
    } catch {
      setIsPreviewPlaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-2 py-2 md:px-4 md:py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[120px] bg-indigo-950 text-white md:min-h-[220px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-indigo-900/75 to-blue-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-end p-4 md:justify-start md:p-8">
              <Badge className="mb-2 w-fit bg-white/15 text-white hover:bg-white/20">
                <Headphones className="mr-1 h-3.5 w-3.5" />
                Test sonore
              </Badge>
              <h1 className="max-w-xl text-2xl font-bold tracking-tight md:text-4xl">{data.title}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">Écoutez, mémorisez, puis retrouvez le bon son.</p>
            </div>
          </div>

          <CardContent className="space-y-3 p-4 md:space-y-5 md:p-8">
            {data.previewAudioUrl ? (
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <AudioLines className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-base font-semibold">Test du son</h2>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">Lancez l'exemple et réglez le volume.</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button type="button" variant="secondary" onClick={handlePreviewToggle}>
                    <Play className="mr-2 h-4 w-4" />
                    {isPreviewPlaying ? "Relancer l'extrait" : "Tester le son"}
                  </Button>
                  <audio
                    ref={previewAudioRef}
                    controls
                    preload="none"
                    className="w-full sm:max-w-md"
                    onPlay={() => setIsPreviewPlaying(true)}
                    onPause={() => setIsPreviewPlaying(false)}
                    onEnded={() => setIsPreviewPlaying(false)}
                  >
                    <source src={data.previewAudioUrl} />
                  </audio>
                </div>
              </div>
            ) : null}

            <div className={`grid grid-cols-3 gap-2 ${data.timeLimitSeconds ? "" : "sm:grid-cols-2"}`}>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="mt-1 text-2xl font-bold">{data.questionCount}</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">Écoutes</p>
                <p className="mt-1 text-xl font-bold">{data.maxStimulusPlays}</p>
              </div>
              {data.timeLimitSeconds ? (
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Temps</p>
                  <p className="mt-1 text-xl font-bold">{formatTimeLimit(data.timeLimitSeconds)}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>1. Écoutez la séquence.</p>
              <p>2. Comparez les 4 propositions.</p>
              <p>3. Choisissez celle qui est identique.</p>
            </div>

            <Button className="w-full" size="lg" onClick={() => router.push(data.nextUrl)}>
              <Play className="mr-2 h-4 w-4" />
              Commencer le test sonore
            </Button>

            <p className="text-center text-xs text-muted-foreground">Casque conseillé.</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
