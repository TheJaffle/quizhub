"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Flame, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

export function DailyChallengeHeader() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const difference = midnight.getTime() - now.getTime();

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (value: number) => value.toString().padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Défi du jour</h1>
        <p className="text-muted-foreground">Un nouveau quiz chaque jour. Testez vos connaissances et comparez votre score.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 xl:pt-4 flex items-center space-x-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Temps restant</p>
              <p className="text-xl font-bold">
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 xl:pt-4 flex items-center space-x-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Thème du jour</p>
              <p className="text-xl font-bold">Sciences et technologie</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 xl:pt-4 flex items-center space-x-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Meilleure récompense</p>
              <p className="text-xl font-bold">500 pièces</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="p-4 xl:pt-4 flex items-center space-x-4">
            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
              <Flame className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Votre série</p>
              <p className="text-xl font-bold">4 jours</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
