import type { IqResult } from "@/lib/iq-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Brain, Gauge, RotateCcw, Share2, Sparkles, Trophy, WalletCards } from "lucide-react";
import Link from "next/link";

type IqResultPageProps = {
  result: IqResult | null;
  error?: "not-found" | "forbidden" | "load-error";
  userPseudo?: string;
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

export function IqResultPage({ result, error, userPseudo }: IqResultPageProps) {
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
    <div className="mx-auto max-w-5xl py-4 md:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-3 bg-indigo-500 text-white hover:bg-indigo-600">
            <Brain className="mr-1 h-3.5 w-3.5" />
            Resultat indicatif
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Votre resultat brainspark</h1>
          {userPseudo ? <p className="text-muted-foreground">Connecte en tant que {userPseudo}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/dashboard/user">
              <WalletCards className="mr-2 h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/iq">
              <RotateCcw className="mr-2 h-4 w-4" />
              Recommencer
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-0 bg-slate-950 text-white shadow-xl">
        <CardContent className="p-5 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E91663]">
                <Trophy className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/60">{result.testTitle}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Nous vous remercions pour votre aide</h2>
            </div>

            <div className="rounded-2xl bg-white p-5 text-slate-950">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Score brainspark</p>
                  <p className="mt-1 text-5xl font-black">{cognitiveScore}</p>
                </div>
                <Gauge className="h-10 w-10 text-[#E91663]" />
              </div>
              <Progress value={cognitiveScore} className="mt-4 h-2" />
              <p className="mt-3 text-sm font-semibold text-slate-700">{getProfileLabel(cognitiveScore)}</p>
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
                <Badge key={section.key} variant="secondary">
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
            <Sparkles className="h-5 w-5 text-[#E91663]" />
            <h2 className="text-xl font-bold">Vos notes par categorie</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rankedSections.map((section) => (
              <div key={section.key} className="rounded-xl border bg-background p-4">
                <div className={`mb-2 flex items-center justify-between gap-2 ${section.color}`}>
                  <p className="font-semibold">{section.label}</p>
                  <Badge variant="outline">{section.note}/20</Badge>
                </div>
                <Progress value={section.percentage} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {section.score} / {section.maxScore} points
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-[#fff1f6] shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-950">
              <Share2 className="h-5 w-5 text-[#E91663]" />
              A comparer avec vos amis
            </div>
            <p className="mt-1 text-sm text-slate-600">Votre score partageable : {cognitiveScore}/100.</p>
          </div>
          <Badge className="w-fit bg-[#E91663] text-white hover:bg-[#E91663]">{getProfileLabel(cognitiveScore)}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
