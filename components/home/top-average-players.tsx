import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTopAveragePlayers } from "@/lib/quizzes";
import { Medal, Play, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export async function TopAveragePlayers() {
  const { players } = await getTopAveragePlayers();

  if (players.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 px-4 xl:px-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h2 className="text-2xl font-bold tracking-tight">Jouer avec les meilleurs joueurs</h2>
        </div>
        <p className="text-muted-foreground">Les joueurs avec la meilleure moyenne, tous quiz confondus.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {players.map((player, index) => (
          <Card key={player.playerKey} className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
            <div className="relative h-36">
              <Image width={600} height={350} src={player.bestQuizImage || "/placeholder.svg"} alt={player.bestQuizTitle} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <Badge variant={index === 0 ? "yellow" : "outline"} className="absolute left-3 top-3 bg-white/90 text-slate-900 dark:bg-slate-900/90 dark:text-white">
                <Medal className="mr-1 h-3.5 w-3.5" />
                #{index + 1}
              </Badge>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-xs text-white/80">{player.bestQuizCategory}</p>
                <h3 className="line-clamp-1 font-semibold text-white">{player.bestQuizTitle}</h3>
              </div>
            </div>

            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={player.playerAvatar || "/placeholder-user.jpg"} alt={player.playerName} />
                    <AvatarFallback>{player.playerName.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{player.playerName}</p>
                    <p className="text-xs text-muted-foreground">{player.attemptsCount} quiz joué{player.attemptsCount > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{player.averagePercent.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">moyenne</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">
                <span className="text-muted-foreground">Meilleur score</span>
                <span className="font-medium">
                  {player.bestQuizScore}/{player.bestQuizTotalQuestions}
                </span>
              </div>

              <Button className="w-full" asChild>
                <Link href={player.playUrl}>
                  <Play className="h-4 w-4" />
                  Jouer
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
