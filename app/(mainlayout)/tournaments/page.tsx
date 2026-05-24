import { TournamentPage } from "@/components/tournaments/tournament-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournois de quiz | brainspark",
  description: "Participez à des tournois de quiz et tentez de gagner des récompenses.",
};

export default function Tournaments() {
  return <TournamentPage />;
}
