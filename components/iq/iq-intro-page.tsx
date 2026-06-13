"use client";

import type { IqTestIntro } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/layout/footer";
import { clearAllIqDraftSubmissions } from "@/components/iq/iq-draft-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Brain, CheckCircle2, ChevronRight, Gauge, Loader2, Play, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBlockTestBackNavigation } from "@/components/iq/use-block-test-back-navigation";

type IqIntroPageProps = {
  test: IqTestIntro | null;
  error?: string;
};

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, index) => CURRENT_YEAR - index);
const GENDER_OPTIONS = [
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
];
const SONDAGE_LIGHT_SLUG = "sondage-light";
const SONDAGE_LIGHT_FEATURES = [
  { icon: Brain, title: "Logique", text: "Des suites, des formes et des deductions rapides." },
  { icon: Gauge, title: "Rythme", text: "Un parcours fluide, pense pour rester concentré." },
  { icon: Trophy, title: "Score", text: "Un résultat indicatif à consulter à la fin du test." },
];
const SONDAGE_LIGHT_STEPS = ["Choisissez votre année de naissance", "Indiquez votre genre", "Lancez le test et jouez jusqu'au bout"];

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
  const introBadge = test?.introBadge ?? null;
  const introTitle = test?.introTitle ?? test?.title ?? "";
  const introText = test?.introText ?? "Test de 45 minutes. Installez-vous au calme et avancez sans revenir en arrière.";

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

  if (test.slug === SONDAGE_LIGHT_SLUG) {
    return (
      <div className="-m-3 bg-slate-950 text-slate-950 md:-m-4 xxl:-m-6">
        <section className="relative isolate overflow-hidden bg-slate-950 text-white">
          <Image
            src="/iq/fond.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.25),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.86)_48%,rgba(12,74,110,0.82))]" />

          <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-cyan-400 text-slate-950 hover:bg-cyan-400">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Test de logique gratuit
                </Badge>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">Résultat indicatif</span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Mettez votre logique au défi.</h1>
                <p className="max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">
                  Un test gratuit, visuel et progressif pour mesurer votre sens de l'observation, votre raisonnement et votre capacité à repérer les bonnes pistes.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {SONDAGE_LIGHT_FEATURES.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div key={feature.title} className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                      <Icon className="h-5 w-5 text-cyan-300" />
                      <h2 className="mt-3 text-sm font-semibold text-white">{feature.title}</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-200">{feature.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-white/15 bg-white p-4 text-slate-950 shadow-2xl sm:p-5 lg:p-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-cyan-700">Prêt à commencer ?</p>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Test de logique gratuit</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Installez-vous au calme, répondez naturellement et allez au bout du parcours.
                  </p>
                </div>

                {startError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{startError}</div>
                ) : null}

                <div className="grid grid-cols-2 items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex min-w-0 flex-col items-center space-y-2 text-center">
                    <Label htmlFor="iq-birth-year" className="flex min-h-10 items-end justify-center text-center text-sm font-semibold leading-tight text-slate-700">
                      Année de naissance
                    </Label>
                    <select
                      id="iq-birth-year"
                      value={birthYear}
                      onChange={(event) => setBirthYear(event.target.value)}
                      className="h-11 w-full max-w-[180px] rounded-md border border-slate-300 bg-white px-3 text-center text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                      <option value="">Année</option>
                      {BIRTH_YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex min-w-0 flex-col items-center space-y-2 text-center">
                    <Label htmlFor="iq-gender" className="flex min-h-10 items-end justify-center text-center text-sm font-semibold leading-tight text-slate-700">
                      Genre
                    </Label>
                    <select
                      id="iq-gender"
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                      className="h-11 w-full max-w-[180px] rounded-md border border-slate-300 bg-white px-3 text-center text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500"
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

                <Button className="h-12 w-full bg-cyan-500 text-base text-slate-950 hover:bg-cyan-400" size="lg" onClick={handleStart} disabled={isStarting}>
                  {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Commencer le test
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>

                <div className="space-y-2 border-t border-slate-200 pt-4">
                  {SONDAGE_LIGHT_STEPS.map((step) => (
                    <div key={step} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs leading-5 text-slate-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
                  <span>Test entièrement gratuit. Aucun achat, abonnement ou paiement en ligne n'est proposé.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-cyan-700">Comment ça marche</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Une expérience simple, comme un jeu de réflexion.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Observez", "Déduisez", "Validez"].map((label, index) => (
                <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                  <h3 className="mt-4 font-semibold text-slate-950">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {index === 0 ? "Repérez les formes, les suites et les détails importants." : index === 1 ? "Choisissez la réponse qui respecte la logique du problème." : "Avancez jusqu'au bout pour obtenir votre résultat indicatif."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <p>Besoin d'informations avant de commencer ?</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/mentions-legales">Mentions légales</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/conditions-generales-utilisation">CGU</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/politique-confidentialite">Confidentialité</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/cookies">Cookies</Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-2 md:py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[145px] bg-indigo-950 text-white md:min-h-[220px]">
            <Image
              src="/iq/fond.png"
              alt="Test de logique"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-indigo-900/75 to-blue-900/80" />
            <div className="relative z-10 flex h-full flex-col justify-end p-4 md:justify-start md:p-8">
              {introBadge ? <Badge className="mb-2 w-fit bg-white/15 text-white hover:bg-white/20">{introBadge}</Badge> : null}
              <h1 className="max-w-xl text-2xl font-bold tracking-tight md:text-4xl">{introTitle}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">{introText}</p>
            </div>
          </div>

          <CardContent className="space-y-3 p-4 md:space-y-5 md:p-8">
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
              Commencer le test
            </Button>

            <p className="text-center text-xs text-muted-foreground">Résultat indicatif, sans valeur de diagnostic médical.</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
