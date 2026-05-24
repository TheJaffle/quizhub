"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Globe, ListChecks, Lock, Swords, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { BattleState } from "./battle-page";

interface BattleModeSelectionProps {
  onModeSelect: (mode: "1v1" | "group", type: "public" | "private", settings: Partial<BattleState>) => void;
}

export function BattleModeSelection({ onModeSelect }: BattleModeSelectionProps) {
  const [activeTab, setActiveTab] = useState<"1v1" | "group">("1v1");
  const [battleType, setBattleType] = useState<"public" | "private">("public");
  const [category, setCategory] = useState<string>("random");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timePerQuestion, setTimePerQuestion] = useState<number>(10);
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [roomCode, setRoomCode] = useState<string>("");

  const handleStartBattle = () => {
    onModeSelect(activeTab, battleType, {
      category: category !== "random" ? category : undefined,
      difficulty,
      timePerQuestion,
      totalQuestions,
      roomCode: battleType === "private" ? roomCode : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Défi quiz</h1>
        <p className="text-muted-foreground">Défiez vos amis ou des joueurs au hasard dans des quiz en temps réel</p>
      </div>

      <Tabs defaultValue="1v1" className="w-full" onValueChange={(value) => setActiveTab(value as "1v1" | "group")}>
        <TabsList className="mb-6 flex overflow-x-auto gap-4 sm:grid grid-cols-2">
          <TabsTrigger value="1v1" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            <span>Défi 1 contre 1</span>
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Défi de groupe (3 à 10 joueurs)</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="1v1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Défi 1 contre 1</CardTitle>
              <CardDescription>Défiez un ami ou affrontez un joueur au hasard dans un duel de quiz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="battle-type">Type de défi</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={battleType === "public" ? "default" : "outline"} className="w-full flex items-center justify-center gap-2" onClick={() => setBattleType("public")}>
                      <Globe className="h-4 w-4" />
                      <span>Public</span>
                    </Button>
                    <Button variant={battleType === "private" ? "default" : "outline"} className="w-full flex items-center justify-center gap-2" onClick={() => setBattleType("private")}>
                      <Lock className="h-4 w-4" />
                      <span>Privé</span>
                    </Button>
                  </div>
                </div>

                {battleType === "private" && (
                  <div className="space-y-2">
                    <Label htmlFor="room-code">Code du salon</Label>
                    <Input id="room-code" placeholder="Saisir ou générer un code" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Aléatoire</SelectItem>
                      <SelectItem value="science">Sciences</SelectItem>
                      <SelectItem value="history">Histoire</SelectItem>
                      <SelectItem value="geography">Géographie</SelectItem>
                      <SelectItem value="entertainment">Divertissement</SelectItem>
                      <SelectItem value="sports">Sport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulté</Label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Choisir la difficulté" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-per-question">Temps par question (secondes)</Label>
                  <Select value={timePerQuestion.toString()} onValueChange={(value) => setTimePerQuestion(Number.parseInt(value))}>
                    <SelectTrigger id="time-per-question">
                      <SelectValue placeholder="Choisir le temps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 secondes</SelectItem>
                      <SelectItem value="10">10 secondes</SelectItem>
                      <SelectItem value="15">15 secondes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-questions">Nombre de questions</Label>
                  <Select value={totalQuestions.toString()} onValueChange={(value) => setTotalQuestions(Number.parseInt(value))}>
                    <SelectTrigger id="total-questions">
                      <SelectValue placeholder="Choisir un nombre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleStartBattle} className="w-full">
                Lancer le défi 1 contre 1
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="group" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Défi de groupe</CardTitle>
              <CardDescription>Créez ou rejoignez un défi de groupe avec 3 à 10 joueurs en simultané.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="battle-type-group">Type de défi</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={battleType === "public" ? "default" : "outline"} className="w-full flex items-center justify-center gap-2" onClick={() => setBattleType("public")}>
                      <Globe className="h-4 w-4" />
                      <span>Public</span>
                    </Button>
                    <Button variant={battleType === "private" ? "default" : "outline"} className="w-full flex items-center justify-center gap-2" onClick={() => setBattleType("private")}>
                      <Lock className="h-4 w-4" />
                      <span>Privé</span>
                    </Button>
                  </div>
                </div>

                {battleType === "private" && (
                  <div className="space-y-2">
                    <Label htmlFor="room-code-group">Code du salon</Label>
                    <Input id="room-code-group" placeholder="Saisir ou générer un code" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="category-group">Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category-group">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Aléatoire</SelectItem>
                      <SelectItem value="science">Sciences</SelectItem>
                      <SelectItem value="history">Histoire</SelectItem>
                      <SelectItem value="geography">Géographie</SelectItem>
                      <SelectItem value="entertainment">Divertissement</SelectItem>
                      <SelectItem value="sports">Sport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty-group">Difficulté</Label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}>
                    <SelectTrigger id="difficulty-group">
                      <SelectValue placeholder="Choisir la difficulté" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-per-question-group">Temps par question (secondes)</Label>
                  <Select value={timePerQuestion.toString()} onValueChange={(value) => setTimePerQuestion(Number.parseInt(value))}>
                    <SelectTrigger id="time-per-question-group">
                      <SelectValue placeholder="Choisir le temps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 secondes</SelectItem>
                      <SelectItem value="10">10 secondes</SelectItem>
                      <SelectItem value="15">15 secondes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-questions-group">Nombre de questions</Label>
                  <Select value={totalQuestions.toString()} onValueChange={(value) => setTotalQuestions(Number.parseInt(value))}>
                    <SelectTrigger id="total-questions-group">
                      <SelectValue placeholder="Choisir un nombre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleStartBattle} className="w-full">
                Lancer le défi de groupe
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Récompenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Gagnez de l'XP selon votre performance</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Obtenez des bonus de série</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Débloquez des badges spéciaux</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Règles du défi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Pas de retour en arrière</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Validation automatique à la fin du temps</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Score basé sur la rapidité et la précision</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-purple-500" />
              Système de classement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>Bronze → Argent → Or → Diamant</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>Classements saisonniers</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>Récompenses spéciales pour les meilleurs joueurs</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
