import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

// Mock data for past challenges
const pastChallenges = [
  {
    id: 1,
    date: "19 mai 2025",
    theme: "Histoire et culture",
    score: 80,
    rank: 15,
    completed: true,
  },
  {
    id: 2,
    date: "18 mai 2025",
    theme: "Divertissement",
    score: 60,
    rank: 42,
    completed: true,
  },
  {
    id: 3,
    date: "17 mai 2025",
    theme: "Géographie",
    score: 90,
    rank: 7,
    completed: true,
  },
  {
    id: 4,
    date: "16 mai 2025",
    theme: "Sciences et technologie",
    score: 70,
    rank: 23,
    completed: true,
  },
  {
    id: 5,
    date: "15 mai 2025",
    theme: "Sport et jeux",
    score: 85,
    rank: 12,
    completed: true,
  },
];

export function DailyHistory() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-wrap gap-2 flex-row items-center justify-between">
        <CardTitle className="text-xl">Historique des défis</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs">
          Tout voir
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          {pastChallenges.map((challenge) => (
            <div key={challenge.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div>
                <div className="font-medium mb-2">{challenge.date}</div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {challenge.theme}
                  </Badge>
                  {challenge.rank <= 10 && <Badge className="bg-amber-500">Top 10</Badge>}
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium">{challenge.score}%</div>
                <div className="text-sm text-muted-foreground">Rang #{challenge.rank}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
