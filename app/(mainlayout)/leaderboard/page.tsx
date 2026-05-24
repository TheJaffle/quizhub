import { LeaderboardPage } from "@/components/leaderboard/leaderboard-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classement | brainspark",
  description: "Découvrez les meilleurs joueurs dans les classements de quiz.",
};

export default function LeaderboardRoute() {
  return <LeaderboardPage />;
}
