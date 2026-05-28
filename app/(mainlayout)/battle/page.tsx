import { BattlePage } from "@/components/battle/battle-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battle quiz | QuizHub",
  description: "Créez un duel privé et partagez le lien avec vos amis.",
};

export default function Battle() {
  return <BattlePage />;
}
