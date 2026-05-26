import "server-only";

const BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

export type BrevoSendEmailPayload = {
  to: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  senderName?: string;
  replyTo?: string;
};

export type BrevoSendEmailResult = {
  sent: boolean;
  messageId: string | null;
  error?: string;
  details?: unknown;
};

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "brainspark";
  const replyTo = process.env.BREVO_REPLY_TO ?? "resultats@brainspark.fr";

  if (!apiKey || !senderEmail) return null;

  return {
    apiKey,
    senderEmail,
    senderName,
    replyTo,
  };
}

export function getBrevoPresence() {
  return {
    BREVO_API_KEY: Boolean(process.env.BREVO_API_KEY),
    BREVO_SENDER_EMAIL: Boolean(process.env.BREVO_SENDER_EMAIL),
    BREVO_SENDER_NAME: Boolean(process.env.BREVO_SENDER_NAME),
    BREVO_REPLY_TO: Boolean(process.env.BREVO_REPLY_TO),
  };
}

export async function sendBrevoEmail(payload: BrevoSendEmailPayload): Promise<BrevoSendEmailResult> {
  const config = getBrevoConfig();

  if (!config) {
    return {
      sent: false,
      messageId: null,
      error: "Configuration Brevo incomplete.",
      details: getBrevoPresence(),
    };
  }

  let response: Response;

  try {
    response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: config.senderEmail,
          name: payload.senderName ?? config.senderName,
        },
        replyTo: {
          email: payload.replyTo ?? config.replyTo,
        },
        to: [
          {
            email: payload.to,
          },
        ],
        subject: payload.subject,
        textContent: payload.textContent,
        htmlContent: payload.htmlContent,
      }),
    });
  } catch {
    return {
      sent: false,
      messageId: null,
      error: "Impossible de joindre l'API Brevo.",
    };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      sent: false,
      messageId: null,
      error: "Brevo a refuse l'envoi.",
      details: data,
    };
  }

  return {
    sent: true,
    messageId: typeof data?.messageId === "string" ? data.messageId : null,
  };
}
