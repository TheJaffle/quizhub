import { updateUserPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const candidate = body as {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  };
  const result = await updateUserPassword(
    userId,
    typeof candidate.currentPassword === "string" ? candidate.currentPassword : "",
    typeof candidate.newPassword === "string" ? candidate.newPassword : "",
    typeof candidate.confirmPassword === "string" ? candidate.confirmPassword : ""
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
