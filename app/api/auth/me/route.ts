import { getUserAvatarPresets, getUserById, updateUserSettings } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(userId);

  const avatarPresets = await getUserAvatarPresets();

  return NextResponse.json({ user, avatarPresets });
}

export async function PUT(request: Request) {
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
    email?: unknown;
    pseudo?: unknown;
    username?: unknown;
    fullName?: unknown;
    name?: unknown;
    bio?: unknown;
    avatarUrl?: unknown;
    birthDate?: unknown;
    gender?: unknown;
    newsletterOptIn?: unknown;
    notificationsOptIn?: unknown;
  };
  const result = await updateUserSettings(userId, {
    email: typeof candidate.email === "string" ? candidate.email : "",
    pseudo:
      typeof candidate.pseudo === "string"
        ? candidate.pseudo
        : typeof candidate.username === "string"
          ? candidate.username
          : "",
    fullName:
      typeof candidate.fullName === "string"
        ? candidate.fullName
        : typeof candidate.name === "string"
          ? candidate.name
          : null,
    bio: typeof candidate.bio === "string" ? candidate.bio : null,
    avatarUrl: typeof candidate.avatarUrl === "string" ? candidate.avatarUrl : null,
    birthDate: typeof candidate.birthDate === "string" ? candidate.birthDate : null,
    gender: typeof candidate.gender === "string" ? candidate.gender : null,
    newsletterOptIn: Boolean(candidate.newsletterOptIn),
    notificationsOptIn: Boolean(candidate.notificationsOptIn),
  });

  if (result.error || !result.user) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ user: result.user });
}
