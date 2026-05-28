import { getDuelChallengeWithParticipants } from "@/lib/duels";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ roomCode: string }> }) {
  try {
    const { roomCode } = await params;
    const { challenge, error } = await getDuelChallengeWithParticipants(roomCode);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (!challenge) {
      return NextResponse.json({ error: "Duel introuvable." }, { status: 404 });
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Duel load error", error);
    return NextResponse.json({ error: "Impossible de charger ce duel." }, { status: 500 });
  }
}
