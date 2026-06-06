"use client";

import type { IqTestIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { clearAllIqDraftSubmissions } from "@/components/iq/iq-draft-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Brain, Loader2, Play } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqIntroPageProps = {
  test: IqTestIntro | null;
  error?: string;
};

function formatDuration(totalSeconds: number | null) {
  if (!totalSeconds) return "Temps indicatif a confirmer";

  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} min environ`;
}

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, index) => CURRENT_YEAR - index);
const GENDER_OPTIONS = [
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
];

function normalizePubSource(value: string | null) {
  if (!value) return null;

  const normalizedValue = value.trim();

  return /^[a-zA-Z0-9_-]{1,80}$/.test(normalizedValue) ? normalizedValue : null;
}

export function IqIntroPage({ test, error }: IqIntroPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  useBlockTestBackNavigation();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const isSurveyIntro = test?.slug === "sondage";
  const introBadge = test?.introBadge ?? (isSurveyIntro ? "Calibration" : "Test QI");
  const introTitle = test?.introTitle ?? test?.title ?? "";
  const introText =
    test?.introText ??
    (isSurveyIntro
      ? "Quelques questions pour calibrer le futur test."
      : "Test de 45 minutes. Installez-vous au calme et avancez sans revenir en arrière.");
  const displayedDurationSeconds =
    test?.estimatedDurationMinutes && test.estimatedDurationMinutes > 0
      ? test.estimatedDurationMinutes * 60
      : test?.mainTimeLimitSeconds || test?.totalTimeLimitSeconds || null;

  const handleStart = async () => {
    if (!test) return;

    setIsStarting(true);
    setStartError(null);

    try {
      if (!birthYear || !gender) {
        throw new Error("Veuillez renseigner votre annee de naissance et votre genre.");
      }

      clearAllIqDraftSubmissions();

      const response = await fetch(`/api/iq/tests/${test.slug}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birthDate: `${birthYear}-01-01`,
          gender,
          pubSource: normalizePubSource(searchParams.get("pub")),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.resultUrl) {
          setStartError(payload.error || "Vous avez deja realise ce test de logique.");
          router.push(payload.resultUrl);
          return;
        }

        throw new Error(payload.error || "Impossible de demarrer le test.");
      }

      router.push(payload.nextUrl);
    } catch (submitError) {
      setStartError(submitError instanceof Error ? submitError.message : "Impossible de demarrer le test.");
    } finally {
      setIsStarting(false);
    }
  };

  if (error || !test) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Test de logique indisponible</AlertTitle>
          <AlertDescription>{error || "Ce test de logique est introuvable."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-2 md:py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[145px] bg-indigo-950 text-white md:min-h-[220px]">
            {isSurveyIntro || test.imageUrl ? (
              <Image
                src="/iq/fond.png"
                alt={isSurveyIntro ? "Sondage de calibration" : "Test de logique complet"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-60"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-indigo-900/75 to-blue-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-end p-4 md:justify-start md:p-8">
              <Badge className="mb-2 w-fit bg-white/15 text-white hover:bg-white/20">{introBadge}</Badge>
              <h1 className="max-w-xl text-2xl font-bold tracking-tight md:text-4xl">{introTitle}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">{introText}</p>
            </div>
          </div>

          <CardContent className="space-y-3 p-4 md:space-y-5 md:p-8">
            {isSurveyIntro ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-indigo-500" />
                    <h2 className="font-semibold">Avant de commencer</h2>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Installez-vous au calme.</p>
                    <p>Répondez naturellement, sans aide extérieure.</p>
                    <p>Allez au bout du parcours.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="mt-1 text-2xl font-bold">{test.mainQuestionCount}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="mt-1 text-xl font-bold">{formatDuration(displayedDurationSeconds)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-indigo-500" />
                    <h2 className="font-semibold">À retenir</h2>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Mettez-vous dans un endroit calme.</p>
                    <p>Ne répondez pas au hasard si vous ne savez pas.</p>
                    <p>Mémoire, son et rapidité arrivent ensuite.</p>
                  </div>
                </div>
              </>
            )}

            {startError ? <p className="text-sm text-destructive">{startError}</p> : null}

            <div className="rounded-lg border bg-background p-3">
              <div className="grid grid-cols-2 items-start gap-4">
                <div className="flex min-w-0 flex-col items-center space-y-2 text-center">
                  <Label htmlFor="iq-birth-year" className="flex min-h-10 items-end justify-center text-center text-sm leading-tight">
                    Annee de naissance
                  </Label>
                  <select
                    id="iq-birth-year"
                    value={birthYear}
                    onChange={(event) => setBirthYear(event.target.value)}
                    className="h-11 w-full max-w-[180px] rounded-md border border-input bg-background px-3 text-center text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Annee</option>
                    {BIRTH_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex min-w-0 flex-col items-center space-y-2 text-center">
                  <Label htmlFor="iq-gender" className="flex min-h-10 items-end justify-center text-center text-sm leading-tight">
                    Genre
                  </Label>
                  <select
                    id="iq-gender"
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    className="h-11 w-full max-w-[180px] rounded-md border border-input bg-background px-3 text-center text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Choisir</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleStart} disabled={isStarting}>
              {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {isSurveyIntro ? "Commencer le sondage" : "Commencer le test"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">Résultat indicatif, sans valeur de diagnostic médical.</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
