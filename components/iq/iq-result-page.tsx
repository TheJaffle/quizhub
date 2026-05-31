import type { IqResult } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Brain, Eye, Gauge, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

type IqResultPageProps = {
  result: IqResult | null;
  error?: "not-found" | "forbidden" | "load-error";
  userPseudo?: string;
  emailToken?: string | null;
};

const sectionScores = [
  { key: "verbal", label: "Verbal", color: "text-indigo-500" },
  { key: "logic", label: "Logique", color: "text-blue-500" },
  { key: "quantitative", label: "Quantitatif", color: "text-fuchsia-500" },
  { key: "audio_memory", label: "Sonore", color: "text-sky-500" },
  { key: "long_memory", label: "Memoire longue", color: "text-violet-500" },
  { key: "spatial", label: "Spatial", color: "text-cyan-500" },
  { key: "memory", label: "Memoire", color: "text-emerald-500" },
  { key: "speed", label: "Rapidite", color: "text-amber-500" },
] as const;

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getProfileLabel(score: number) {
  if (score >= 82) return "Tres beau profil";
  if (score >= 68) return "Profil solide";
  if (score >= 52) return "Bon potentiel";
  if (score >= 35) return "Profil en construction";
  return "Resultat a reprendre au calme";
}

function getNoteOnTwenty(score: number, maxScore: number) {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(20, Number(((score / maxScore) * 20).toFixed(1))));
}

function getErrorText(error?: IqResultPageProps["error"]) {
  if (error === "forbidden") {
    return "Cette tentative existe, mais elle n'appartient pas au compte connecte.";
  }

  if (error === "load-error") {
    return "Impossible de charger ce resultat pour le moment.";
  }

  return "Ce resultat de test de logique est invalide ou introuvable.";
}

export function IqResultPage({ result, error, emailToken }: IqResultPageProps) {
  if (!result) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Resultat introuvable</AlertTitle>
          <AlertDescription>{getErrorText(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const answeredProgress = result.totalQuestions > 0 ? Math.round((result.answeredQuestions / result.totalQuestions) * 100) : 0;
  const totalPossibleScore = result.sectionBreakdown.reduce((total, section) => total + section.maxScore, 0);
  const precisionProgress = totalPossibleScore > 0 ? clampScore((result.rawScore / totalPossibleScore) * 100) : 0;
  const cognitiveScore = precisionProgress;
  const correctionUrl =
    result.testSlug === "sondage"
      ? `/iq/sondage-review/${encodeURIComponent(result.attemptToken)}${emailToken ? `?email_token=${encodeURIComponent(emailToken)}` : ""}`
      : null;
  const rankedSections = sectionScores
    .map((section) => {
      const value = result.sectionBreakdown.find((item) => item.key === section.key);

      return {
        ...section,
        score: value?.score ?? 0,
        maxScore: value?.maxScore ?? 0,
        percentage: value?.percentage ?? 0,
        note: getNoteOnTwenty(value?.score ?? 0, value?.maxScore ?? 0),
      };
    })
    .filter((section) => section.maxScore > 0);
  const strongestSections = [...rankedSections].sort((a, b) => b.percentage - a.percentage).slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl py-4 text-[#3B3B3B] md:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-3 bg-[#802E7B] text-white hover:bg-[#802E7B]">
            <Brain className="mr-1 h-3.5 w-3.5" />
            Resultat indicatif
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Votre resultat brainspark</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {correctionUrl ? (
            <Button asChild className="bg-[#802E7B] text-white hover:bg-[#6f286b]">
              <Link href={correctionUrl}>
                <Eye className="mr-2 h-4 w-4" />
                Correction
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-0 bg-[#802E7B] text-[#3B3B3B] shadow-xl">
        <CardContent className="px-6 pb-7 pt-12 md:px-10 md:pb-10 md:pt-14">
          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div className="pt-4 md:pt-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-white/35">
                <Trophy className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{result.testTitle}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-4xl">Nous vous remercions pour votre aide</h2>
            </div>

            <div className="rounded-2xl bg-white p-5 text-[#3B3B3B]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Score brainspark</p>
                  <p className="mt-1 text-5xl font-black">{cognitiveScore}</p>
                </div>
                <Gauge className="h-10 w-10 text-[#802E7B]" />
              </div>
              <Progress value={cognitiveScore} className="mt-4 h-2 [&>div]:bg-[#802E7B]" />
              <p className="mt-3 text-sm font-semibold text-[#3B3B3B]">{getProfileLabel(cognitiveScore)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {result.answeredQuestions}/{result.totalQuestions} questions repondues
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Reussite</p>
            <p className="mt-2 text-3xl font-bold">{precisionProgress}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.rawScore} / {totalPossibleScore || result.totalQuestions} points
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Reponses donnees</p>
            <p className="mt-2 text-3xl font-bold">{answeredProgress}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.answeredQuestions} / {result.totalQuestions}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Points forts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {strongestSections.map((section) => (
                <Badge key={section.key} className="bg-[#802E7B] font-semibold text-white hover:bg-[#802E7B]">
                  {section.label}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Les categories ou vous avez le mieux performe.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#802E7B]" />
            <h2 className="text-xl font-bold">Vos notes par categorie</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rankedSections.map((section) => (
              <div key={section.key} className="rounded-xl border bg-background p-4">
                <div className={`mb-2 flex items-center justify-between gap-2 ${section.color}`}>
                  <p className="font-semibold">{section.label}</p>
                  <Badge variant="outline">{section.note}/20</Badge>
                </div>
                <Progress value={section.percentage} className="h-2 [&>div]:bg-[#802E7B]" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {section.score} / {section.maxScore} points
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
