"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Copy, ListChecks, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BattleState } from "./battle-page";

interface BattleLobbyProps {
  battleState: BattleState;
  onStartBattle: () => void;
  onCancel: () => void;
}

export function BattleLobby({ battleState, onStartBattle, onCancel }: BattleLobbyProps) {
  const [countdown, setCountdown] = useState(15);
  const [copied, setCopied] = useState(false);
  const [allReady, setAllReady] = useState(false);

  // Simulate players joining and getting ready
  useEffect(() => {
    const interval = setInterval(() => {
      if (countdown > 0) {
        setCountdown((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    // Simulate players getting ready
    const readyTimeout = setTimeout(() => {
      setAllReady(true);
    }, 5000);

    return () => clearTimeout(readyTimeout);
  }, []);

  const copyRoomCode = () => {
    if (battleState.roomCode) {
      navigator.clipboard.writeText(battleState.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{battleState.mode === "1v1" ? "Défi 1 contre 1" : "Défi de groupe"}</h1>
        <p className="text-muted-foreground">{countdown > 0 ? `Le défi commence dans ${countdown} secondes` : "Prêt à commencer !"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Joueurs</CardTitle>
              <CardDescription>{battleState.mode === "1v1" ? "Vous et votre adversaire" : `${battleState.players.length} joueurs dans le salon`}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {battleState.players.map((player, index) => (
                  <div key={player.id} className="flex flex-col items-center p-3 border rounded-lg bg-background">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <div className="font-medium">{player.name}</div>
                      <Badge variant={player.isReady ? "default" : "outline"} className="mt-1">
                        {player.isReady ? "Prêt" : "En attente..."}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={onStartBattle} disabled={!allReady && countdown > 0}>
                {countdown > 0 ? `Départ dans ${countdown}s` : "Commencer maintenant"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Paramètres du défi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Mode</div>
                <div className="font-medium">{battleState.mode === "1v1" ? "Défi 1 contre 1" : "Défi de groupe"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium flex items-center">
                  {battleState.type === "private" ? (
                    <>
                      <span>Salon privé</span>
                      {battleState.roomCode && (
                        <Button variant="ghost" size="sm" className="ml-2 h-6 px-2" onClick={copyRoomCode}>
                          {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      )}
                    </>
                  ) : (
                    "Partie publique"
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Catégorie</div>
                <div className="font-medium capitalize">{battleState.category || "Aléatoire"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Difficulté</div>
                <div className="font-medium capitalize">{battleState.difficulty || "Moyen"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Questions</div>
                <div className="font-medium">{battleState.totalQuestions} questions</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Temps par question</div>
                <div className="font-medium">{battleState.timePerQuestion} secondes</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Règles du défi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Répondez vite pour gagner des points bonus</span>
                </li>
                <li className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-green-500" />
                  <span>Une réponse validée ne peut plus être changée</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-purple-500" />
                  <span>Les séries de victoires donnent de l'XP bonus</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span>En attente des joueurs...</span>
          <span>{allReady ? "Tous les joueurs sont prêts !" : "Préparation..."}</span>
        </div>
        <Progress value={allReady ? 100 : 66} className="h-2" />
      </div>
    </div>
  );
}
