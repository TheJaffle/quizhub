import { BattlePage } from "@/components/battle/battle-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Défi quiz | brainspark",
  description: "Défiez vos amis ou des joueurs au hasard dans des quiz en temps réel",
};

export default function Battle() {
  return <BattlePage />;
}
