"use client";

import type { IqLongMemoryExposure } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqLongMemoryExposurePageProps = {
  data: IqLongMemoryExposure | null;
  error?: string;
};

export function IqLongMemoryExposurePage({ data, error }: IqLongMemoryExposurePageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();
  const [timeRemaining, setTimeRemaining] = useState(data?.displayTimeSeconds ?? 1);

  useEffect(() => {
    setTimeRemaining(data?.displayTimeSeconds ?? 1);
  }, [data?.displayTimeSeconds, data?.question.id]);

  useEffect(() => {
    if (!data) return;

    if (timeRemaining <= 0) {
      router.push(data.returnToUrl);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [data, router, timeRemaining]);

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Exposition memoire longue indisponible</AlertTitle>
          <AlertDescription>{error || "Cette tentative de test de logique est introuvable."}</AlertDescription>
        </Alert>
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
        <span className="min-w-[5.75rem] whitespace-nowrap rounded-full bg-violet-100 px-3 py-1 text-center text-sm font-medium tabular-nums text-violet-700">
          {timeRemaining} sec
        </span>
      </div>

      <div className="mb-6 rounded-xl bg-[#BA0B1E] px-4 py-3 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Encodage memoire longue</p>
      </div>

      <Card className="overflow-hidden border bg-[#BA0B1E] p-6 shadow-lg shadow-slate-200 md:p-8">
        {data.question.questionText ? (
          <div className="mb-4 rounded-xl border bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-base font-semibold text-[#BA0B1E]">{data.question.questionText}</p>
          </div>
        ) : null}

        {data.question.imageUrl ? (
          <div className="rounded-lg border bg-white p-3 text-center">
            <img
              src={data.question.imageUrl}
              alt="Stimulus memoire longue"
              className="mx-auto h-auto max-h-[420px] w-full object-contain"
            />
          </div>
        ) : (
          <div className="space-y-5 text-center">
            <div className="rounded-lg border bg-white px-3 py-6 sm:px-5 md:p-10">
              <p className="mx-auto max-w-full whitespace-normal break-words text-[clamp(1.45rem,7vw,2.25rem)] font-bold leading-tight tracking-normal sm:tracking-wide md:text-5xl">
                {data.question.stimulusText || data.question.questionText || ""}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
