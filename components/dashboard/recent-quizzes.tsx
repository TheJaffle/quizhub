import type { DashboardRecentResult } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface RecentQuizzesProps {
  compact?: boolean;
  recentResults: DashboardRecentResult[];
}

function formatRelativeDate(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function RecentQuizzes({ compact = false, recentResults }: RecentQuizzesProps) {
  if (compact) {
    return (
      <div className="space-y-4">
        {recentResults.length > 0 ? recentResults.slice(0, 3).map((quiz) => (
          <div key={quiz.id} className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium text-sm">{quiz.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{quiz.score}/{quiz.totalQuestions}</span>
                <span>•</span>
                <span>{formatRelativeDate(quiz.createdAt)}</span>
              </div>
            </div>
            <Badge variant="default" className="text-xs">
              {quiz.percentage}%
            </Badge>
          </div>
        )) : <p className="text-sm text-muted-foreground">Aucun resultat recent.</p>}
        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
          <Link href="/dashboard/user">Voir mes statistiques</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz récents</CardTitle>
        <CardDescription>Vos derniers résultats de quiz</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentResults.length > 0 ? recentResults.map((quiz) => (
            <div key={quiz.id} className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium">{quiz.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{quiz.score}/{quiz.totalQuestions}</span>
                  <span>•</span>
                  <span>{formatRelativeDate(quiz.createdAt)}</span>
                </div>
              </div>
              <Badge variant="default">{quiz.percentage}%</Badge>
            </div>
          )) : <p className="text-sm text-muted-foreground">Aucun resultat recent.</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/user">Voir mes statistiques</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
