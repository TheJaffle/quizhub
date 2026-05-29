import { persistIqAttemptDraft, type PersistIqAttemptDraftPayload } from "@/lib/iq-tests";
import { createResultEmailLink, sendResultEmail, type ResultEmailType } from "@/lib/result-email-links";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIN_FORM_SECONDS = 3;

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;

  return request.headers.get("x-real-ip");
}

function getBaseUrl(request: Request) {
  const configuredUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const origin = request.headers.get("origin");

  if (origin) return origin.replace(/\/$/, "");

  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  return `${protocol}://${host}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resultType = body.resultType as ResultEmailType;
    const resultToken = typeof body.resultToken === "string" ? body.resultToken : "";
    const email = typeof body.email === "string" ? body.email : "";
    const website = typeof body.website === "string" ? body.website : "";
    const iqDraft =
      body && typeof body === "object" && body.iqDraft && typeof body.iqDraft === "object"
        ? (body.iqDraft as PersistIqAttemptDraftPayload & { attemptToken?: string })
        : null;
    const formStartedAt = Number(body.formStartedAt);
    const elapsedSeconds = Number.isFinite(formStartedAt) ? (Date.now() - formStartedAt) / 1000 : 0;

    if (website.trim()) {
      return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
    }

    if (elapsedSeconds < MIN_FORM_SECONDS) {
      return NextResponse.json({ error: "Veuillez patienter quelques secondes avant l'envoi." }, { status: 400 });
    }

    if (resultType === "iq" && iqDraft && iqDraft.attemptToken === resultToken) {
      const draftAnswers = Array.isArray(iqDraft.answers) ? iqDraft.answers : [];

      if (draftAnswers.length > 0) {
        const persisted = await persistIqAttemptDraft(resultToken, { answers: draftAnswers });

        if (!persisted.ok) {
          return NextResponse.json({ error: persisted.error ?? "Impossible d'enregistrer les reponses du test." }, { status: 400 });
        }
      }
    }

    const { link, error } = await createResultEmailLink({
      resultType,
      resultToken,
      email,
      requestIp: getRequestIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    if (!link || error) {
      return NextResponse.json({ error: error ?? "Impossible de creer le lien de resultat." }, { status: 400 });
    }

    const delivery = await sendResultEmail(link, getBaseUrl(request));

    return NextResponse.json({
      ok: true,
      sent: delivery.sent,
      devAccessUrl: process.env.NODE_ENV === "development" ? delivery.accessUrl : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Impossible d'envoyer le lien de resultat pour le moment." }, { status: 500 });
  }
}
