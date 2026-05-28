"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ListChecks, Lock, Swords, Trophy, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BattleState } from "./battle-page";

interface BattleModeSelectionProps {
  onModeSelect: (mode: "1v1" | "group", type: "private", settings: Partial<BattleState>) => void | Promise<void>;
}

type DuelDifficulty = "Easy" | "Medium" | "Hard";

type DuelCategoryOption = {
  slug: string;
  name: string;
  questionCounts: Record<DuelDifficulty, number>;
};

const difficultyToApi: Record<"easy" | "medium" | "hard", DuelDifficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function BattleModeSelection({ onModeSelect }: BattleModeSelectionProps) {
  const [activeTab, setActiveTab] = useState<"1v1" | "group">("1v1");
  const [category, setCategory] = useState<string>("random");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timePerQuestion, setTimePerQuestion] = useState<number>(10);
  const [categories, setCategories] = useState<DuelCategoryOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const availableCategories = useMemo(() => {
    const apiDifficulty = difficultyToApi[difficulty];

    return categories.filter((option) => option.questionCounts[apiDifficulty] >= 5);
  }, [categories, difficulty]);

  useEffect(() => {
    fetch("/api/duels", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger les catégories.");
        }

        setCategories(Array.isArray(payload.categories) ? payload.categories : []);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "Impossible de charger les catégories.");
      });
  }, []);

  useEffect(() => {
    if (category !== "random" && !availableCategories.some((option) => option.slug === category)) {
      setCategory("random");
    }
  }, [availableCategories, category]);

  const handleStartBattle = async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      await onModeSelect(activeTab, "private", {
        category: category !== "random" ? category : undefined,
        difficulty,
        timePerQuestion,
        totalQuestions: 5,
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Impossible de créer le duel.");
    } finally {
      setIsCreating(false);
    }
  };

  const settingsForm = (suffix = "") => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Type de partie</Label>
        <div className="flex min-h-10 items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <Lock className="h-4 w-4 text-primary" />
          Défi privé avec lien d’invitation
        </div>
        <p className="text-xs text-muted-foreground">Un lien est créé avec 5 questions figées. Tous les invités reçoivent exactement le même quiz et peuvent le faire plus tard.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`category-${suffix}`}>Catégorie</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id={`category-${suffix}`}>
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="random">Aléatoire</SelectItem>
            {availableCategories.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loadError ? <p className="text-xs text-destructive">{loadError}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`difficulty-${suffix}`}>Difficulté</Label>
        <Select value={difficulty} onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}>
          <SelectTrigger id={`difficulty-${suffix}`}>
            <SelectValue placeholder="Choisir une difficulté" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Facile</SelectItem>
            <SelectItem value="medium">Moyen</SelectItem>
            <SelectItem value="hard">Difficile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`time-per-question-${suffix}`}>Temps par question</Label>
        <Select value={timePerQuestion.toString()} onValueChange={(value) => setTimePerQuestion(Number.parseInt(value))}>
          <SelectTrigger id={`time-per-question-${suffix}`}>
            <SelectValue placeholder="Choisir le temps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 secondes</SelectItem>
            <SelectItem value="10">10 secondes</SelectItem>
            <SelectItem value="15">15 secondes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Nombre de questions</Label>
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">5 questions pendant la phase de test.</div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Défis quiz</h1>
        <p className="text-muted-foreground">Créez un lien privé et comparez les scores quand chacun a terminé.</p>
      </div>

      <Tabs defaultValue="1v1" className="w-full" onValueChange={(value) => setActiveTab(value as "1v1" | "group")}>
        <TabsList className="mb-6 flex gap-4 overflow-x-auto sm:grid sm:grid-cols-2">
          <TabsTrigger value="1v1" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Duel 1 contre 1
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Défi de groupe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="1v1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Duel privé</CardTitle>
              <CardDescription>Créez un lien privé et envoyez-le à la personne que vous voulez défier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">{settingsForm("duel")}</CardContent>
            <CardFooter>
              {createError ? <p className="mb-3 w-full text-sm text-destructive">{createError}</p> : null}
              <Button onClick={handleStartBattle} className="w-full" disabled={isCreating}>
                {isCreating ? "Création..." : "Créer le lien du duel"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="group" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Défi de groupe</CardTitle>
              <CardDescription>Créez un lien privé et partagez-le avec plusieurs joueurs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">{settingsForm("group")}</CardContent>
            <CardFooter>
              {createError ? <p className="mb-3 w-full text-sm text-destructive">{createError}</p> : null}
              <Button onClick={handleStartBattle} className="w-full" disabled={isCreating}>
                {isCreating ? "Création..." : "Créer le lien du défi"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Récompenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>XP selon la performance</li>
              <li>Bonus de série</li>
              <li>Badges à débloquer</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              Règles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>Une réponse par question</li>
              <li>Validation automatique quand le temps est écoulé</li>
              <li>Score basé sur vitesse et justesse</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-purple-500" />
              Classement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>Classement par score</li>
              <li>Emails et pseudos affichés</li>
              <li>Le lien reste utilisable plus tard</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
