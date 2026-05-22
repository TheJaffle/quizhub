"use client";

import type { IqTestIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Brain, Clock, Loader2, Play, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

export function IqIntroPage({ test, error }: IqIntroPageProps) {
  const router = useRouter();
  useBlockTestBackNavigation();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const isSurveyIntro = test?.slug === "sondage";

  const handleStart = async () => {
    if (!test) return;

    setIsStarting(true);
    setStartError(null);

    try {
      if (!birthYear || !gender) {
        throw new Error("Veuillez renseigner votre annee de naissance et votre genre.");
      }

      const response = await fetch(`/api/iq/tests/${test.slug}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birthDate: `${birthYear}-01-01`,
          gender,
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
    <div className="mx-auto max-w-5xl py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[260px] bg-indigo-950 text-white">
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
            <div className="relative z-10 flex h-full flex-col justify-start p-6 md:p-8">
              <Badge className="mb-4 w-fit bg-white/15 text-white hover:bg-white/20">{isSurveyIntro ? "Phase de calibration" : "Test de logique"}</Badge>
              <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">{test.title}</h1>
              <p className="mt-4 max-w-xl text-white/80">
                {isSurveyIntro
                  ? "Une premiere session pour ajuster les questions, analyser les reponses et preparer le futur test de QI."
                  : test.description || "Un parcours progressif de raisonnement, sans valeur de diagnostic psychologique."}
              </p>
            </div>
          </div>

          <CardContent className="space-y-6 p-6 md:p-8">
            {isSurveyIntro ? (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-xl font-semibold">Avant de commencer</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>Merci de participer a ce test et de nous aider a l'ameliorer.</p>
                    <p>
                      Vous allez repondre a plusieurs series de questions autour du raisonnement verbal, logique, quantitatif et spatial, ainsi qu'a des exercices de memoire, de rapidite et
                      de perception sonore.
                    </p>
                    <p>
                      Pour profiter pleinement du test et obtenir un resultat le plus juste possible, l'ideal est de vous installer dans un endroit calme, a un moment ou vous pouvez etre
                      disponible et concentre.
                    </p>
                    <p>
                      Il n'y a pas de bonne ou de mauvaise facon de participer : l'important est simplement de repondre naturellement, avec attention, et d'aller au bout du parcours.
                    </p>
                    <p>Vos reponses nous permettront de mieux comprendre ce qui fonctionne, ce qui doit etre ameliore, et d'affiner les resultats proposes.</p>
                    <p>Le score obtenu reste indicatif et ne constitue pas une evaluation psychologique officielle.</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Merci
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Merci beaucoup pour votre aide, votre temps et votre serieux.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Questions premiere phase</p>
                    <p className="mt-2 text-3xl font-bold">{test.mainQuestionCount}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Temps indicatif</p>
                    <p className="mt-2 text-2xl font-bold">{formatDuration(test.mainTimeLimitSeconds || test.totalTimeLimitSeconds)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-xl font-semibold">Deroulement</h2>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Vous allez repondre a plusieurs series de questions.</p>
                    <p>Certaines questions evaluent le raisonnement verbal, logique, quantitatif et spatial.</p>
                    <p>Une partie memoire et une partie rapidite arriveront ensuite.</p>
                    <p>Repondez le plus precisement et rapidement possible.</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Ensuite
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Les modules {test.laterSections.map((section) => section.title.toLowerCase()).join(" et ")} seront proposes apres cette premiere phase.
                  </p>
                </div>
              </>
            )}

            {startError ? <p className="text-sm text-destructive">{startError}</p> : null}

            <div className="rounded-lg border bg-background p-4">
              <p className="mb-4 text-center text-sm text-muted-foreground">
                {isSurveyIntro
                  ? "Ces informations nous aident a analyser les reponses de calibration de maniere plus juste. Elles ne servent pas a produire un diagnostic psychologique."
                  : "Ces informations nous permettent de contextualiser le score indicatif. Le resultat ne constitue pas une evaluation psychologique officielle."}
              </p>
              <div className="grid grid-cols-2 items-start gap-4">
                <div className="flex min-w-0 flex-col items-center space-y-2 text-center">
                  <Label htmlFor="iq-birth-year" className="min-h-10 text-center leading-tight">
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
                  <Label htmlFor="iq-gender" className="flex min-h-10 items-center text-center leading-tight">
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

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Votre progression sera conservee avec une tentative separee des quiz classiques.</span>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
