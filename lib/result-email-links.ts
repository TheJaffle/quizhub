import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

export type ResultEmailType = "quiz" | "iq";

export type ResultEmailLink = {
  resultType: ResultEmailType;
  resultToken: string;
  email: string;
  emailToken: string;
  expiresAt: Date;
};

type ResultEmailLinkRow = {
  result_type: ResultEmailType;
  result_token: string;
  email: string;
  email_token: string;
  expires_at: Date;
};

type CountRow = {
  count: number;
};

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const EMAIL_LINK_TTL_HOURS = 48;
const EMAIL_RATE_LIMIT_PER_EMAIL = 3;
const IP_RATE_LIMIT_PER_HOUR = 10;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapRow(row: ResultEmailLinkRow): ResultEmailLink {
  return {
    resultType: row.result_type,
    resultToken: row.result_token,
    email: row.email,
    emailToken: row.email_token,
    expiresAt: row.expires_at,
  };
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM ?? user;

  if (!host || !user || !pass || !from) return null;

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    from,
  };
}

function getSmtpPresence() {
  return {
    SMTP_HOST: Boolean(process.env.SMTP_HOST),
    SMTP_PORT: Boolean(process.env.SMTP_PORT),
    SMTP_USER: Boolean(process.env.SMTP_USER),
    SMTP_PASSWORD: Boolean(process.env.SMTP_PASSWORD),
    SMTP_FROM: Boolean(process.env.SMTP_FROM),
  };
}

export async function createResultEmailLink(payload: {
  resultType: ResultEmailType;
  resultToken: string;
  email: string;
  requestIp?: string | null;
  userAgent?: string | null;
}) {
  let connection: mysql.Connection | undefined;
  const email = normalizeEmail(payload.email);
  const requestIp = payload.requestIp?.slice(0, 80) ?? null;
  const userAgent = payload.userAgent?.slice(0, 255) ?? null;

  if ((payload.resultType !== "quiz" && payload.resultType !== "iq") || !payload.resultToken || !isValidEmail(email)) {
    return { link: null, error: "Demande invalide." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);

    if (payload.resultType === "quiz") {
      const [resultRows] = await connection.execute<mysql.RowDataPacket[]>(
        "SELECT id FROM quiz_results WHERE result_token = ? LIMIT 1",
        [payload.resultToken]
      );

      if (resultRows.length === 0) {
        return { link: null, error: "Resultat introuvable." };
      }
    } else {
      const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
        "SELECT id FROM iq_attempts WHERE attempt_token = ? AND status = 'completed' LIMIT 1",
        [payload.resultToken]
      );

      if (attemptRows.length === 0) {
        return { link: null, error: "Résultat introuvable." };
      }

      const [existingIqRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT rel.result_token
         FROM result_email_links rel
         INNER JOIN iq_attempts a ON a.attempt_token = rel.result_token
         WHERE rel.result_type = 'iq'
           AND rel.email = ?
           AND a.status = 'completed'
         ORDER BY rel.created_at ASC, rel.id ASC
         LIMIT 1`,
        [email]
      );
      const existingIqResult = (existingIqRows as { result_token: string }[])[0];

      if (existingIqResult && existingIqResult.result_token !== payload.resultToken) {
        return { link: null, error: "Cet email a déjà été utilisé pour ce test de logique. Une seule participation est autorisée." };
      }

      const [existingUserAttemptRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT a.attempt_token
         FROM users u
         INNER JOIN iq_attempts a ON a.user_id = u.id
         WHERE u.email = ?
           AND a.status = 'completed'
         ORDER BY a.completed_at ASC, a.id ASC
         LIMIT 1`,
        [email]
      );
      const existingUserAttempt = (existingUserAttemptRows as { attempt_token: string }[])[0];

      if (existingUserAttempt && existingUserAttempt.attempt_token !== payload.resultToken) {
        return { link: null, error: "Cet email a déjà un test de logique terminé. Une seule participation est autorisée." };
      }
    }

    const [emailRateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS count
       FROM result_email_links
       WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [email]
    );
    const emailRateCount = Number((emailRateRows as CountRow[])[0]?.count ?? 0);

    if (emailRateCount >= EMAIL_RATE_LIMIT_PER_EMAIL) {
      return { link: null, error: "Trop de demandes pour cet email. Reessayez plus tard." };
    }

    if (requestIp) {
      const [ipRateRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) AS count
         FROM result_email_links
         WHERE request_ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [requestIp]
      );
      const ipRateCount = Number((ipRateRows as CountRow[])[0]?.count ?? 0);

      if (ipRateCount >= IP_RATE_LIMIT_PER_HOUR) {
        return { link: null, error: "Trop de demandes depuis cette connexion. Reessayez plus tard." };
      }
    }

    const emailToken = crypto.randomBytes(32).toString("hex");
    const [insertResult] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO result_email_links
       (result_type, result_token, email, email_token, request_ip, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [payload.resultType, payload.resultToken, email, emailToken, requestIp, userAgent, EMAIL_LINK_TTL_HOURS]
    );

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT result_type, result_token, email, email_token, expires_at
       FROM result_email_links
       WHERE id = ?
       LIMIT 1`,
      [insertResult.insertId]
    );
    const link = (rows as ResultEmailLinkRow[])[0];

    return { link: mapRow(link), error: null };
  } finally {
    await connection?.end();
  }
}

export async function getResultEmailLink(emailToken: string) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT result_type, result_token, email, email_token, expires_at
       FROM result_email_links
       WHERE email_token = ?
         AND expires_at > NOW()
       LIMIT 1`,
      [emailToken]
    );
    const link = (rows as ResultEmailLinkRow[])[0];

    if (!link) return null;

    await connection.execute("UPDATE result_email_links SET used_at = COALESCE(used_at, NOW()) WHERE email_token = ?", [emailToken]);

    return mapRow(link);
  } finally {
    await connection?.end();
  }
}

export async function canAccessResultWithEmailToken(payload: {
  resultType: ResultEmailType;
  resultToken: string;
  emailToken: string | null | undefined;
}) {
  if (!payload.emailToken) return false;

  const link = await getResultEmailLink(payload.emailToken);

  return Boolean(link && link.resultType === payload.resultType && link.resultToken === payload.resultToken);
}

export async function sendResultEmail(link: ResultEmailLink, baseUrl: string) {
  const accessUrl = new URL(`/result-access/${link.emailToken}`, baseUrl).toString();
  const label = link.resultType === "iq" ? "votre résultat indicatif de logique" : "votre résultat de quiz";
  const subject = "Votre résultat brainspark";
  const text = `Bonjour,\n\nVoici le lien pour consulter ${label} :\n${accessUrl}\n\nCe lien expire dans ${EMAIL_LINK_TTL_HOURS} heures.\n\nbrainspark`;
  const html = `
    <p>Bonjour,</p>
    <p>Voici le lien pour consulter ${label} :</p>
    <p><a href="${accessUrl}">${accessUrl}</a></p>
    <p>Ce lien expire dans ${EMAIL_LINK_TTL_HOURS} heures.</p>
    <p>brainspark</p>
  `;
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    console.info("RESULT EMAIL SMTP CONFIG MISSING", getSmtpPresence());
    console.info("RESULT EMAIL LINK", { to: link.email, accessUrl });
    return { sent: false, accessUrl };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });

    await transporter.sendMail({
      from: smtpConfig.from,
      to: link.email,
      subject,
      text,
      html,
    });

    console.info("RESULT EMAIL SENT", { to: link.email, accessUrl });

    return { sent: true, accessUrl };
  } catch (error) {
    const smtpError = error as { message?: string; stack?: string; code?: string };

    console.error("RESULT EMAIL ERROR", {
      to: link.email,
      accessUrl,
      code: smtpError.code ?? null,
      message: smtpError.message ?? "Erreur SMTP inconnue",
      stack: smtpError.stack ?? null,
      smtp: getSmtpPresence(),
    });

    return { sent: false, accessUrl };
  }
}
