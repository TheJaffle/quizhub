"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, CheckCircle2, Loader2, Save, Shield, Timer, Users, XCircle } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type IqAdminQuestionStat = {
  id: number;
  sectionTitle: string;
  sectionKey: string;
  questionKey: string | null;
  questionText: string | null;
  questionImageUrl: string | null;
  questionFormat: string;
  weight: number;
  displayedCount: number;
  correctCount: number;
  incorrectCount: number;
  averageResponseTimeMs: number | null;
};

type IqAdminStats = {
  registeredPlayers: number;
  completedIqTests: number;
  questions: IqAdminQuestionStat[];
};

function formatAverageTime(ms: number | null) {
  if (ms === null) return "--";

  return `${(ms / 1000).toFixed(1)} s`;
}

function shortQuestion(question: IqAdminQuestionStat) {
  return question.questionText || question.questionKey || `Question #${question.id}`;
}

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<IqAdminStats | null>(null);
  const [weightDrafts, setWeightDrafts] = useState<Record<number, string>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);

  const isLoggedIn = Boolean(stats);

  const questionCount = stats?.questions.length ?? 0;
  const answeredTotal = useMemo(() => stats?.questions.reduce((total, question) => total + question.displayedCount, 0) ?? 0, [stats]);
  const currentStats = stats;

  const loadStats = async () => {
    setIsLoadingStats(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/iq-stats", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        setStats(null);
        setError(response.status === 401 ? null : payload.error || "Impossible de charger les statistiques.");
        return;
      }

      const nextStats = payload.stats as IqAdminStats;
      setStats(nextStats);
      setWeightDrafts(Object.fromEntries(nextStats.questions.map((question) => [question.id, String(question.weight)])));
    } catch {
      setError("Impossible de charger les statistiques.");
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Connexion impossible.");
      }

      toast.success("Connexion administrateur réussie.");
      await loadStats();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Connexion impossible.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleWeightSave = async (questionId: number) => {
    setSavingQuestionId(questionId);

    try {
      const response = await fetch("/api/admin/iq-stats", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          weight: Number(weightDrafts[questionId]),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'enregistrer les points.");
      }

      const nextStats = payload.stats as IqAdminStats;
      setStats(nextStats);
      setWeightDrafts(Object.fromEntries(nextStats.questions.map((question) => [question.id, String(question.weight)])));
      toast.success("Points de la question enregistrés.");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer les points.");
    } finally {
      setSavingQuestionId(null);
    }
  };

  if (isLoadingStats && !isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2 rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-600">Administration provisoire</p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Statistiques du test de logique</h1>
            </div>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Suivi des joueurs, des tests terminés et des performances question par question.
          </p>
        </div>

        {!isLoggedIn ? (
          <Card className="mx-auto max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Connexion administrateur</CardTitle>
              <CardDescription>Accès provisoire réservé au suivi du test de logique.</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-login">Login</Label>
                  <Input id="admin-login" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Mot de passe</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : currentStats ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Joueurs inscrits</CardTitle>
                  <Users className="h-5 w-5 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold">{currentStats.registeredPlayers}</div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tests QI terminés</CardTitle>
                  <Brain className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold">{currentStats.completedIqTests}</div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Réponses enregistrées</CardTitle>
                  <Timer className="h-5 w-5 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold">{answeredTotal}</div>
                  <p className="mt-2 text-xs text-muted-foreground">{questionCount} questions actives suivies</p>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden shadow-xl">
              <CardHeader>
                <CardTitle>Questions du test de logique</CardTitle>
                <CardDescription>
                  Les affichages correspondent aux réponses enregistrées, y compris les questions non répondues automatiquement par timeout.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[280px]">Question</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-center">Affichée</TableHead>
                        <TableHead className="text-center">Correctes</TableHead>
                        <TableHead className="text-center">Incorrectes</TableHead>
                        <TableHead className="text-center">Vitesse moyenne</TableHead>
                        <TableHead className="min-w-[180px]">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStats.questions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell>
                            <div className="space-y-1">
                              {question.questionImageUrl ? (
                                <div className="flex items-center gap-3">
                                  <div className="relative h-12 w-16 overflow-hidden rounded-md border bg-white">
                                    <Image
                                      src={question.questionImageUrl}
                                      alt={shortQuestion(question)}
                                      fill
                                      sizes="64px"
                                      className="object-contain"
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{question.questionKey || `Question #${question.id}`}</span>
                                </div>
                              ) : (
                                <p className="font-medium">{shortQuestion(question)}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">#{question.id}</Badge>
                                <Badge variant="secondary">{question.questionFormat}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{question.sectionTitle}</p>
                              <p className="text-xs text-muted-foreground">{question.sectionKey}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-lg font-semibold">{question.displayedCount}</TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              {question.correctCount}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                              <XCircle className="h-4 w-4" />
                              {question.incorrectCount}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">{formatAverageTime(question.averageResponseTimeMs)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0.1"
                                max="100"
                                step="0.1"
                                value={weightDrafts[question.id] ?? String(question.weight)}
                                onChange={(event) =>
                                  setWeightDrafts((current) => ({
                                    ...current,
                                    [question.id]: event.target.value,
                                  }))
                                }
                                className="w-24"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWeightSave(question.id)}
                                disabled={savingQuestionId === question.id}
                              >
                                {savingQuestionId === question.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                <span className="sr-only">Enregistrer</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </main>
  );
}
