import { getUserById } from "@/lib/auth";
import { getDuelChallengeWithParticipants, submitDuelResult } from "@/lib/duels";
import { createDuelIdentity, DUEL_IDENTITY_COOKIE_MAX_AGE, DUEL_IDENTITY_COOKIE_NAME, serializeDuelIdentity } from "@/lib/duel-identity";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ roomCode: string }> }) {
  try {
    const { roomCode } = await params;
    const body = await request.json().catch(() => null);
    const cookieStore = await cookies();
    const userId = Number(cookieStore.get("quizhub_user_id")?.value);
    const user = Number.isInteger(userId) && userId > 0 ? await getUserById(userId) : null;
    const submittedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (user && submittedEmail && submittedEmail !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "L'email du duel doit correspondre au compte connecté." }, { status: 403 });
    }

    const result = await submitDuelResult({
      roomCode,
      email: user?.email ?? submittedEmail,
      pseudo: user?.pseudo ?? (typeof body?.pseudo === "string" ? body.pseudo : null),
      userId: user?.id ?? null,
      answers: Array.isArray(body?.answers) ? body.answers : [],
      durationSeconds: typeof body?.durationSeconds === "number" ? body.durationSeconds : null,
    });

    if (!result.result || result.error) {
      return NextResponse.json({ error: result.error ?? "Impossible d'enregistrer le résultat." }, { status: 400 });
    }

    const { challenge } = await getDuelChallengeWithParticipants(roomCode);
    const response = NextResponse.json({ result: result.result, challenge });
    const duelIdentity = createDuelIdentity(result.result.email, result.result.pseudo);

    if (duelIdentity) {
      response.cookies.set(DUEL_IDENTITY_COOKIE_NAME, serializeDuelIdentity(duelIdentity), {
        sameSite: "lax",
        maxAge: DUEL_IDENTITY_COOKIE_MAX_AGE,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Duel submit error", error);
    return NextResponse.json({ error: "Impossible d'enregistrer le résultat du duel." }, { status: 500 });
  }
}
