import { getQuizScoreUserById } from "@/lib/auth";
import { startQuizSession } from "@/lib/quiz-sessions";
import type { QuizDifficulty } from "@/lib/quiz-topics";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GUEST_TOKEN_COOKIE = "brainspark_quiz_guest_token";
const VALID_DIFFICULTIES = new Set<QuizDifficulty>(["Easy", "Medium", "Hard"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const topicSlug = typeof body?.topicSlug === "string" ? body.topicSlug : "";
    const difficulty = typeof body?.difficulty === "string" ? body.difficulty : "";

    if (!topicSlug || !VALID_DIFFICULTIES.has(difficulty as QuizDifficulty)) {
      return NextResponse.json({ error: "Paramètres de session invalides." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = Number(cookieStore.get("quizhub_user_id")?.value);
    const user = Number.isInteger(userId) && userId > 0 ? await getQuizScoreUserById(userId) : null;
    const guestToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value ?? null;

    const result = await startQuizSession({
      topicSlug,
      difficulty: difficulty as QuizDifficulty,
      userId: user?.id ?? null,
      guestToken,
    });

    if (result.error || !result.sessionToken) {
      return NextResponse.json({ error: result.error ?? "Impossible de lancer ce quiz." }, { status: 400 });
    }

    const response = NextResponse.json(result);

    if (result.guestToken && (!guestToken || guestToken !== result.guestToken)) {
      response.cookies.set(GUEST_TOKEN_COOKIE, result.guestToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
      });
    }

    return response;
  } catch (error) {
    console.error("Quiz session start error", error);
    return NextResponse.json({ error: "Impossible de créer la session de quiz pour le moment." }, { status: 500 });
  }
}
