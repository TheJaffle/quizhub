"use client";

import { useEffect, useState } from "react";
import { ActiveBattle } from "./active-battle";
import { BattleLobby } from "./battle-lobby";
import { BattleModeSelection } from "./battle-mode-selection";
import { BattleResults } from "./battle-results";
import {
  createDuelIdentity,
  DUEL_IDENTITY_COOKIE_MAX_AGE,
  DUEL_IDENTITY_COOKIE_NAME,
  parseDuelIdentity,
  serializeDuelIdentity,
} from "@/lib/duel-identity";

type BattleStage = "selection" | "lobby" | "active" | "results";
type BattleMode = "1v1" | "group";
type BattleType = "private";

type BattleQuestion = {
  id: number;
  text: string;
  correctAnswerId: number;
  answers: Array<{
    id: number;
    label: string;
    text: string;
  }>;
};

export type BattleParticipant = {
  id: number;
  email: string;
  pseudo: string | null;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number | null;
  completedAt: string;
};

type CurrentBattleUser = {
  id: number;
  email: string;
  pseudo: string;
};

export interface BattleState {
  mode: BattleMode;
  type: BattleType;
  category?: string;
  categoryName?: string;
  difficulty?: "easy" | "medium" | "hard";
  timePerQuestion: number;
  totalQuestions: number;
  roomCode?: string;
  roomLink?: string;
  questions: BattleQuestion[];
  participantEmail: string;
  participantPseudo: string;
  currentUser: CurrentBattleUser | null;
  players: Player[];
  participants: BattleParticipant[];
  currentPlayerIndex: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank?: number;
  isReady: boolean;
  isCurrentUser: boolean;
  timeElapsed: number;
  correctAnswers: number;
  streak: number;
}

export function BattlePage() {
  const [stage, setStage] = useState<BattleStage>("selection");
  const [battleState, setBattleState] = useState<BattleState>({
    mode: "1v1",
    type: "private",
    timePerQuestion: 10,
    totalQuestions: 5,
    questions: [],
    participantEmail: "",
    participantPseudo: "",
    currentUser: null,
    players: [],
    participants: [],
    currentPlayerIndex: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("room");
    const savedDuelIdentity = readDuelIdentityCookie();

    if (savedDuelIdentity) {
      setBattleState((current) => ({
        ...current,
        participantEmail: current.participantEmail || savedDuelIdentity.email,
        participantPseudo: current.participantPseudo || savedDuelIdentity.pseudo,
      }));
    }

    void loadCurrentUser();

    if (roomCode) {
      void loadRoom(roomCode, params.get("mode") === "group" ? "group" : "1v1");
    }
  }, []);

  async function loadCurrentUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    const user = payload?.user;

    if (!user?.email || !user?.pseudo) return;

    setBattleState((current) => ({
      ...current,
      currentUser: {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
      },
      participantEmail: current.participantEmail || user.email,
      participantPseudo: current.participantPseudo || user.pseudo,
    }));
  }

  async function loadRoom(roomCode: string, mode: BattleMode) {
    const response = await fetch(`/api/duels/${encodeURIComponent(roomCode)}`, { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Impossible de charger ce duel.");
    }

    setBattleState((current) => ({
      ...current,
      mode,
      type: "private",
      category: payload.challenge.categorySlug ?? undefined,
      categoryName: payload.challenge.categoryName ?? undefined,
      difficulty: payload.challenge.difficulty === "Easy" ? "easy" : payload.challenge.difficulty === "Hard" ? "hard" : "medium",
      timePerQuestion: payload.challenge.timePerQuestion,
      totalQuestions: payload.challenge.totalQuestions,
      roomCode: payload.challenge.roomCode,
      roomLink: `${window.location.origin}/battle?room=${encodeURIComponent(payload.challenge.roomCode)}&mode=${encodeURIComponent(mode)}`,
      questions: payload.challenge.questionPayload,
      participants: payload.challenge.participants ?? [],
      players: [],
    }));
    setStage("lobby");
  }

  const handleModeSelect = async (mode: BattleMode, type: BattleType, settings: Partial<BattleState>) => {
    const response = await fetch("/api/duels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: settings.category,
        difficulty: settings.difficulty,
        timePerQuestion: settings.timePerQuestion,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Impossible de créer le duel.");
    }

    setBattleState((current) => ({
      ...current,
      ...settings,
      mode,
      type,
      category: payload.challenge.categorySlug ?? settings.category,
      categoryName: payload.challenge.categoryName ?? settings.categoryName,
      roomCode: payload.challenge.roomCode,
      roomLink: `${window.location.origin}/battle?room=${encodeURIComponent(payload.challenge.roomCode)}&mode=${encodeURIComponent(mode)}`,
      questions: payload.challenge.questionPayload,
      totalQuestions: payload.challenge.totalQuestions,
      timePerQuestion: payload.challenge.timePerQuestion,
      participants: payload.challenge.participants ?? [],
      players: [],
    }));
    setStage("lobby");
  };

  const handleStartBattle = (participant: { email: string; pseudo: string }) => {
    writeDuelIdentityCookie(participant);

    setBattleState((current) => ({
      ...current,
      participantEmail: participant.email,
      participantPseudo: participant.pseudo,
    }));
    setStage("active");
  };

  const handleBattleComplete = (payload: { score: number; correctAnswers: number; participants?: BattleParticipant[] }) => {
    setBattleState((prev) => ({
      ...prev,
      participants: payload.participants ?? prev.participants,
      players: [
        {
          id: "current",
          name: prev.participantPseudo || prev.participantEmail || "Vous",
          avatar: "/placeholder-user.jpg",
          score: payload.score,
          correctAnswers: payload.correctAnswers,
          timeElapsed: prev.totalQuestions * prev.timePerQuestion,
          isReady: true,
          isCurrentUser: true,
          streak: 0,
        },
      ],
    }));
    setStage("results");
  };

  const handleRematch = () => {
    setBattleState((prev) => ({
      ...prev,
      players: prev.players.map((player) => ({
        ...player,
        score: 0,
        correctAnswers: 0,
        timeElapsed: 0,
        streak: 0,
      })),
    }));
    setStage("lobby");
  };

  const handleReturnHome = () => {
    setStage("selection");
  };

  return (
    <div className="container mx-auto ">
      {stage === "selection" && <BattleModeSelection onModeSelect={handleModeSelect} />}

      {stage === "lobby" && <BattleLobby battleState={battleState} onStartBattle={handleStartBattle} onCancel={handleReturnHome} />}

      {stage === "active" && <ActiveBattle battleState={battleState} onBattleComplete={handleBattleComplete} />}

      {stage === "results" && <BattleResults battleState={battleState} onRematch={handleRematch} onReturnHome={handleReturnHome} />}
    </div>
  );
}

function readDuelIdentityCookie() {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${DUEL_IDENTITY_COOKIE_NAME}=`))
    ?.split("=")[1];

  return parseDuelIdentity(cookie);
}

function writeDuelIdentityCookie(participant: { email: string; pseudo: string }) {
  if (typeof document === "undefined") return;

  const identity = createDuelIdentity(participant.email, participant.pseudo);

  if (!identity) return;

  document.cookie = `${DUEL_IDENTITY_COOKIE_NAME}=${serializeDuelIdentity(identity)}; path=/; max-age=${DUEL_IDENTITY_COOKIE_MAX_AGE}; samesite=lax`;
}
