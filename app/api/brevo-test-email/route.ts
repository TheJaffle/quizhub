import { NextResponse } from "next/server";
import { getBrevoPresence, sendBrevoEmail } from "@/lib/brevo";

const TEST_RATE_LIMIT_MS = 5 * 60 * 1000;
const lastSendByIp = new Map<string, number>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const testTo = process.env.BREVO_TEST_TO ?? senderEmail;

  if (!senderEmail || !testTo || !process.env.BREVO_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Configuration Brevo incomplete. Ajoutez BREVO_API_KEY, BREVO_SENDER_EMAIL et BREVO_TEST_TO dans .env.local.",
      },
      { status: 500 }
    );
  }

  const clientIp = getClientIp(request);
  const now = Date.now();
  const lastSend = lastSendByIp.get(clientIp) ?? 0;

  if (now - lastSend < TEST_RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: "Un email de test vient deja d'etre envoye. Reessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const delivery = await sendBrevoEmail({
    to: testTo,
    subject: "Test envoi mail Brevo - Free Logic Test",
    textContent:
      "Bonjour,\n\nCeci est un email de test envoye depuis l'API transactionnelle Brevo de Free Logic Test.\n\nSi vous le recevez, la connexion API fonctionne.",
    htmlContent:
      "<p>Bonjour,</p><p>Ceci est un email de test envoye depuis l'API transactionnelle Brevo de Free Logic Test.</p><p>Si vous le recevez, la connexion API fonctionne.</p>",
  });

  if (!delivery.sent) {
    return NextResponse.json(
      {
        error: delivery.error ?? "Brevo a refuse l'envoi du mail de test.",
        details: delivery.details ?? getBrevoPresence(),
      },
      { status: 502 }
    );
  }

  lastSendByIp.set(clientIp, now);

  return NextResponse.json({
    ok: true,
    messageId: delivery.messageId,
  });
}
