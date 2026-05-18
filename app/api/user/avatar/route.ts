import { updateUserAvatar } from "@/lib/auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function getSafeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return ALLOWED_EXTENSIONS.has(extension) ? extension : null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier avatar manquant." }, { status: 400 });
  }

  const extension = getSafeExtension(file.name);

  if (!extension || !ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Format avatar non autorisé." }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json({ error: "Avatar trop lourd. Maximum 2 Mo." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "avatars");
  const fileName = `user-${userId}-${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDirectory, fileName);
  const avatarUrl = `/uploads/avatars/${fileName}`;

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(filePath, bytes);

  const result = await updateUserAvatar(userId, avatarUrl);

  if (result.error || !result.user) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ user: result.user, avatarUrl });
}
