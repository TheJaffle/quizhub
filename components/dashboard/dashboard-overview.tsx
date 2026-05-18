import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { RecentQuizzes } from "@/components/dashboard/recent-quizzes";
import type { UserDashboardData } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, TrendingUp, Trophy } from "lucide-react";

type DashboardOverviewProps = {
  dashboardData: UserDashboardData;
};

export function DashboardOverview({ dashboardData }: DashboardOverviewProps) {
  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz terminés</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalCompletedQuizzes}</div>
            <p className="text-xs text-muted-foreground">Quiz terminés sur ce compte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleur score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.bestPercentage}%</div>
            <p className="text-xs text-muted-foreground">{dashboardData.bestQuizTitle ?? "Aucun quiz terminé"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.averagePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Score moyen sur les quiz terminés</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 max-w-full gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="min-w-0 max-w-full overflow-hidden lg:col-span-4">
          <CardHeader>
            <CardTitle>Activité des quiz</CardTitle>
            <CardDescription>Quiz terminés mois par mois</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 max-w-full overflow-hidden">
            <EarningsChart monthlyActivity={dashboardData.monthlyActivity} />
          </CardContent>
        </Card>

        <Card className="min-w-0 max-w-full overflow-hidden lg:col-span-3">
          <CardHeader>
            <CardTitle>Quiz récents</CardTitle>
            <CardDescription>Vos derniers résultats enregistrés</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentQuizzes recentResults={dashboardData.recentResults} />
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 max-w-full gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance quiz</CardTitle>
            <CardDescription>Résumé de vos meilleurs résultats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Quiz terminés</span>
                </div>
                <span className="font-medium">{dashboardData.totalCompletedQuizzes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Score moyen</span>
                </div>
                <span className="font-medium">{dashboardData.averagePercentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Meilleur quiz</span>
                </div>
                <span className="font-medium">{dashboardData.bestQuizTitle ?? "Aucune donnée"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Derniers événements de votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentResults.length > 0 ? dashboardData.recentResults.map((result, index) => (
                <div key={result.id} className={`border-l-2 pl-3 ${index === 0 ? "border-primary" : index === 1 ? "border-green-500" : index === 2 ? "border-blue-500" : "border-orange-500"}`}>
                  <p className="text-sm font-medium">Quiz terminé</p>
                  <p className="text-xs text-muted-foreground">Vous avez terminé "{result.title}" avec {result.percentage}%</p>
                  <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(result.createdAt)}</p>
                </div>
              )) : (
                <div className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium">Aucune activité</p>
                  <p className="text-xs text-muted-foreground">Aucun resultat n’est encore disponible sur ce compte.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
