"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import { BattleParticipant, BattleState } from "./battle-page";

interface ActiveBattleProps {
  battleState: BattleState;
  onBattleComplete: (payload: { score: number; correctAnswers: number; participants?: BattleParticipant[] }) => void;
}

interface Question {
  id: number;
  text: string;
  options: Array<{ id: number; label: string; text: string }>;
  correctAnswerId: number;
}

// State interface
interface GameState {
  currentQuestion: number;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  timeLeft: number;
  score: number;
  streak: number;
  correctAnswers: number;
  selectedAnswers: Record<number, number>;
  showFeedback: boolean;
}

// Action types
type GameAction = { type: "SELECT_ANSWER"; payload: number } | { type: "SUBMIT_ANSWER"; payload: { answerIndex: number | null; correctAnswer: number; timeLeft: number } } | { type: "NEXT_QUESTION"; payload: { timePerQuestion: number } } | { type: "TICK_TIMER" } | { type: "RESET_FEEDBACK" };

// Initial state
const createInitialState = (battleState: BattleState): GameState => ({
  currentQuestion: 0,
  selectedAnswer: null,
  isCorrect: null,
  timeLeft: battleState.timePerQuestion,
  score: 0,
  streak: 0,
  correctAnswers: 0,
  selectedAnswers: {},
  showFeedback: false,
});

// Reducer function
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "SELECT_ANSWER":
      if (state.showFeedback) return state;
      return {
        ...state,
        selectedAnswer: action.payload,
      };

    case "SUBMIT_ANSWER": {
      const { answerIndex, correctAnswer, timeLeft } = action.payload;
      const actualSelectedAnswer = answerIndex !== null ? answerIndex : state.selectedAnswer;
      const isCorrect = actualSelectedAnswer === correctAnswer;

      let newScore = state.score;
      let newStreak = state.streak;

      if (isCorrect) {
        const timeBonus = Math.floor(timeLeft * 10);
        const streakBonus = state.streak * 20;
        const questionScore = 100 + timeBonus + streakBonus;
        newScore += questionScore;
        newStreak += 1;
      } else {
        newStreak = 0;
      }

      return {
        ...state,
        isCorrect,
        score: newScore,
        streak: newStreak,
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
        selectedAnswers:
          actualSelectedAnswer === null
            ? state.selectedAnswers
            : {
                ...state.selectedAnswers,
                [state.currentQuestion]: actualSelectedAnswer,
              },
        showFeedback: true,
      };
    }

    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestion: state.currentQuestion + 1,
        selectedAnswer: null,
        isCorrect: null,
        showFeedback: false,
        timeLeft: action.payload.timePerQuestion,
      };

    case "TICK_TIMER":
      return {
        ...state,
        timeLeft: Math.max(0, state.timeLeft - 1),
      };

    case "RESET_FEEDBACK":
      return {
        ...state,
        selectedAnswer: null,
        isCorrect: null,
        showFeedback: false,
      };

    default:
      return state;
  }
};

export function ActiveBattle({ battleState, onBattleComplete }: ActiveBattleProps) {
  const [state, dispatch] = useReducer(gameReducer, battleState, createInitialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions: Question[] = battleState.questions.map((question) => ({
    id: question.id,
    text: question.text,
    correctAnswerId: question.correctAnswerId,
    options: question.answers,
  }));

  // Timer effect
  useEffect(() => {
    if (state.timeLeft > 0 && !state.showFeedback) {
      const timer = setTimeout(() => {
        dispatch({ type: "TICK_TIMER" });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.timeLeft === 0 && !state.showFeedback) {
      handleAnswerSubmit(null);
    }
  }, [state.timeLeft, state.showFeedback]);

  const handleAnswerSelect = (index: number) => {
    dispatch({ type: "SELECT_ANSWER", payload: index });
  };

  const handleAnswerSubmit = (index: number | null) => {
    const currentQ = questions[state.currentQuestion];

    dispatch({
      type: "SUBMIT_ANSWER",
      payload: {
        answerIndex: index,
        correctAnswer: currentQ.correctAnswerId,
        timeLeft: state.timeLeft,
      },
    });

    // Move to next question after a delay
    setTimeout(() => {
      if (state.currentQuestion < questions.length - 1) {
        dispatch({
          type: "NEXT_QUESTION",
          payload: { timePerQuestion: battleState.timePerQuestion },
        });
      } else {
        const finalSelectedAnswer = index ?? state.selectedAnswer;
        const finalScore = state.score + (currentQ.correctAnswerId === finalSelectedAnswer ? 100 + state.timeLeft * 10 + state.streak * 20 : 0);
        const finalCorrectAnswers = state.correctAnswers + (currentQ.correctAnswerId === finalSelectedAnswer ? 1 : 0);
        const selectedAnswers = {
          ...state.selectedAnswers,
          ...(finalSelectedAnswer === null ? {} : { [state.currentQuestion]: finalSelectedAnswer }),
        };

        fetch(`/api/duels/${encodeURIComponent(battleState.roomCode ?? "")}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: battleState.participantEmail,
            pseudo: battleState.participantPseudo,
            durationSeconds: battleState.totalQuestions * battleState.timePerQuestion,
            answers: questions.map((question, questionIndex) => ({
              questionId: question.id,
              answerId: selectedAnswers[questionIndex] ?? 0,
            })),
          }),
        })
          .then(async (response) => {
            const payload = await response.json();

            if (!response.ok) {
              throw new Error(payload.error || "Impossible d'enregistrer votre score.");
            }

            onBattleComplete({
              score: finalScore,
              correctAnswers: finalCorrectAnswers,
              participants: payload.challenge?.participants ?? payload.participants ?? undefined,
            });
          })
          .catch((error) => {
            setSubmitError(error instanceof Error ? error.message : "Impossible d'enregistrer votre score.");
          });
      }
    }, 1500);
  };

  const currentQ = questions[state.currentQuestion];
  const progress = (state.currentQuestion / questions.length) * 100;

  if (!currentQ) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Duel indisponible</h1>
        <p className="text-muted-foreground">Les questions de ce duel n'ont pas pu être chargées.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            Question {state.currentQuestion + 1} sur {questions.length}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="font-bold">{state.timeLeft}s</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-xl font-bold mb-6">{currentQ.text}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((option) => (
              <Button key={option.id} variant={state.selectedAnswer === option.id ? "default" : "outline"} className={`h-auto py-4 px-4 justify-start text-left ${state.showFeedback && option.id === currentQ.correctAnswerId ? "bg-green-500 hover:bg-green-500 text-white" : state.showFeedback && state.selectedAnswer === option.id && option.id !== currentQ.correctAnswerId ? "bg-red-500 hover:bg-red-500 text-white" : ""}`} onClick={() => handleAnswerSelect(option.id)}>
                <div className="flex items-center w-full">
                  <div className="mr-3 h-6 w-6 rounded-full border flex items-center justify-center">{option.label}</div>
                  <span>{option.text}</span>
                  {state.showFeedback && option.id === currentQ.correctAnswerId && <CheckCircle className="ml-auto h-5 w-5 text-white" />}
                  {state.showFeedback && state.selectedAnswer === option.id && option.id !== currentQ.correctAnswerId && <XCircle className="ml-auto h-5 w-5 text-white" />}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="font-bold text-xl">{state.score}</div>
          </div>
          {state.streak > 1 && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              Série x{state.streak}
            </Badge>
          )}
        </div>

        <Button onClick={() => handleAnswerSubmit(state.selectedAnswer)} disabled={state.selectedAnswer === null || state.showFeedback}>
          Valider ma réponse
        </Button>
      </div>

      {state.showFeedback && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${state.isCorrect ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
          {state.isCorrect ? (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Correct ! {state.streak > 1 ? `Bonus de série x${state.streak}.` : ""}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5" />
              <span>Incorrect. La bonne réponse était : {currentQ.options.find((option) => option.id === currentQ.correctAnswerId)?.text}</span>
            </>
          )}
        </div>
      )}
      {submitError ? <p className="mt-4 text-sm text-destructive">{submitError}</p> : null}
    </div>
  );
}
