import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

// =============================================================================
// Outil d'analyse des reponses IQ (local, autonome).
//
// Se connecte a la base (OVH ou autre) via les variables QUIZHUB_DB_* lues dans
// .env.local / .env, sert une page web sur http://localhost:PORT.
//
// En haut de page : un selecteur du test analyse.
// Tableau agrege PAR QUESTION sur toutes les tentatives completees du test :
//   - taux de presentation, taux de non-reponse, taux de bonnes reponses,
//   - temps moyen de reponse, n repondues, difficulte.
//
// Lancement :  node scripts/iq-analysis-tool.mjs
// =============================================================================

import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const PORT = Number(process.env.IQ_ANALYSIS_PORT ?? 4555);
// Par defaut on n'ecoute que sur la loopback : l'outil doit passer derriere un
// reverse proxy (nginx + HTTPS). Mettre IQ_ANALYSIS_HOST=0.0.0.0 pour exposer
// directement (deconseille, HTTP en clair).
const HOST = process.env.IQ_ANALYSIS_HOST ?? "127.0.0.1";
const APP_BASE_URL = String(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "").replace(/\/+$/, "");
// Arret automatique apres inactivite (0 = desactive, l'appli tourne en continu).
// Prevu pour l'activation a la demande via systemd socket : le process s'arrete
// seul apres IQ_ANALYSIS_IDLE_MINUTES sans requete, et systemd le relance a la
// prochaine connexion. NE PAS activer sous pm2 (pm2 relancerait aussitot).
const IDLE_MINUTES = Number(process.env.IQ_ANALYSIS_IDLE_MINUTES ?? 0);

const NOT_PRESENTED_MS = 123456;
const UNANSWERED_MS = 1000;

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

// --- Authentification (Basic Auth multi-utilisateurs, obligatoire) -----------
// Deux facons de definir les comptes (dans .env.local ou en variables d'env) :
//   1) Plusieurs comptes : IQ_ANALYSIS_USERS="alice:motdepasse1,bob:motdepasse2"
//   2) Un seul compte    : IQ_ANALYSIS_USER=alice  IQ_ANALYSIS_PASSWORD=motdepasse1
// Astuce : si un mot de passe contient une virgule ou un ':', privilegier le
// format 1 reste possible tant que le login ne contient pas ':' (seul le premier
// ':' separe login et mot de passe ; les virgules separent les comptes).
const AUTH_USERS = parseAuthUsers();

if (AUTH_USERS.size === 0) {
  console.error(
    "\n  [SECURITE] Aucun compte defini. Renseigne soit :\n" +
    "    IQ_ANALYSIS_USERS=\"user1:motdepasse1,user2:motdepasse2\"\n" +
    "  soit IQ_ANALYSIS_USER + IQ_ANALYSIS_PASSWORD (compte unique),\n" +
    "  dans .env.local ou en variables d'environnement.\n" +
    "  L'outil expose des donnees sensibles : il refuse de demarrer sans authentification.\n"
  );
  process.exit(1);
}

function parseAuthUsers() {
  const users = new Map();

  const list = process.env.IQ_ANALYSIS_USERS ?? "";
  for (const pair of list.split(",")) {
    const entry = pair.trim();
    if (!entry) continue;
    const sep = entry.indexOf(":");
    if (sep === -1) continue;
    const login = entry.slice(0, sep).trim();
    const password = entry.slice(sep + 1); // mot de passe non trimme (espaces possibles)
    if (login && password) users.set(login, password);
  }

  // Compatibilite compte unique
  const singleUser = process.env.IQ_ANALYSIS_USER ?? "";
  const singlePass = process.env.IQ_ANALYSIS_PASSWORD ?? "";
  if (singleUser && singlePass && !users.has(singleUser)) {
    users.set(singleUser, singlePass);
  }

  return users;
}

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Verifie un couple email / mot de passe contre les comptes definis.
function verifyCredentials(email, password) {
  const expected = AUTH_USERS.get(email);
  if (expected === undefined) {
    // Comparaison factice pour limiter l'oracle temporel sur l'existence du compte.
    safeEqual(password, password);
    return false;
  }
  return safeEqual(password, expected);
}

// --- Sessions signees (cookie HMAC) ------------------------------------------
// Secret de signature : pris dans l'env si fourni (sessions stables entre redemarrages),
// sinon genere aleatoirement au demarrage (un redemarrage invalide les sessions).
const SESSION_SECRET = process.env.IQ_ANALYSIS_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 h
const COOKIE_NAME = "iq_analysis_session";

function signSession(email) {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(`${email}\n${exp}`, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifySession(value) {
  if (!value || typeof value !== "string") return null;
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  if (!safeEqual(sig, expectedSig)) return null;
  let decoded = "";
  try {
    decoded = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const nl = decoded.indexOf("\n");
  if (nl === -1) return null;
  const email = decoded.slice(0, nl);
  const exp = Number(decoded.slice(nl + 1));
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  if (!AUTH_USERS.has(email)) return null;
  return email;
}

function parseCookies(req) {
  const raw = req.headers["cookie"] ?? "";
  const out = {};
  for (const part of raw.split(";")) {
    const seg = part.trim();
    if (!seg) continue;
    const eq = seg.indexOf("=");
    if (eq === -1) continue;
    out[seg.slice(0, eq)] = decodeURIComponent(seg.slice(eq + 1));
  }
  return out;
}

function getSessionEmail(req) {
  return verifySession(parseCookies(req)[COOKIE_NAME]);
}

function sessionCookieHeader(value, req, maxAgeSeconds) {
  const secure = (req.headers["x-forwarded-proto"] === "https") ? "; Secure" : "";
  const maxAge = maxAgeSeconds === undefined ? Math.floor(SESSION_TTL_MS / 1000) : maxAgeSeconds;
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function readBody(req, limitBytes = 16 * 1024) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("Corps de requete trop volumineux."));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function htmlEscape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 3306),
  user: process.env.QUIZHUB_DB_USER ?? "quizhub",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "quizhub",
  database: process.env.QUIZHUB_DB_NAME ?? "quizhub",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function withConnection(fn) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

// --- Liste des tests + nb de tentatives completees ---------------------------
async function listTests() {
  return withConnection(async (c) => {
    const [rows] = await c.query(
      `SELECT t.id, t.slug, t.title,
              COALESCE(t.question_bank_test_id, t.id) AS bank_id,
              (SELECT COUNT(*) FROM iq_attempts a WHERE a.test_id = t.id AND a.status = 'completed') AS completed_attempts,
              (SELECT COUNT(*) FROM iq_attempts a WHERE a.test_id = t.id) AS total_attempts
       FROM iq_tests t
       ORDER BY t.id`
    );
    return rows;
  });
}

// --- Liste des users ayant complété un test ----------------------------------
async function listUsersForTest(testId) {
  return withConnection(async (c) => {
    const [rows] = await c.query(
      `SELECT CASE
                WHEN a.user_id IS NOT NULL THEN CONCAT('user:', a.user_id)
                ELSE CONCAT('guest:', COALESCE(rel.email, ''))
              END AS user_key,
              COALESCE(u.email, rel.email) AS email,
              COALESCE(u.pseudo, '') AS name,
              SUBSTRING_INDEX(GROUP_CONCAT(a.attempt_token ORDER BY a.completed_at DESC, a.id DESC), ',', 1) AS latest_attempt_token,
              COUNT(a.id) AS attempt_count
       FROM iq_attempts a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN (
         SELECT result_token, MIN(email) AS email
         FROM result_email_links
         WHERE result_type = 'iq'
         GROUP BY result_token
       ) rel ON rel.result_token = a.attempt_token
       WHERE a.test_id = ?
         AND a.status = 'completed'
         AND (u.email IS NOT NULL OR rel.email IS NOT NULL)
         AND COALESCE(u.email, rel.email) <> ''
       GROUP BY CASE
                  WHEN a.user_id IS NOT NULL THEN CONCAT('user:', a.user_id)
                  ELSE CONCAT('guest:', COALESCE(rel.email, ''))
                END,
                COALESCE(u.email, rel.email),
                COALESCE(u.pseudo, '')
       ORDER BY COALESCE(u.email, rel.email)`,
      [testId]
    );
    return rows;
  });
}

// --- Suppression des tentatives d'un test pour une liste de users ------------
async function deleteUserAttempts(testId, userKeys) {
  return withConnection(async (c) => {
    await c.beginTransaction();
    try {
      const deletedUsers = [];
      for (const userKey of userKeys) {
        let attempts = [];
        let userEmail = null;

        if (typeof userKey === "string" && userKey.startsWith("user:")) {
          const userId = Number(userKey.slice(5));
          if (!Number.isInteger(userId) || userId <= 0) continue;
          const [userRows] = await c.query("SELECT email FROM users WHERE id = ? LIMIT 1", [userId]);
          userEmail = userRows[0]?.email ?? null;
          const [rows] = await c.query(
            "SELECT id FROM iq_attempts WHERE test_id = ? AND user_id = ?",
            [testId, userId]
          );
          attempts = rows;
        } else if (typeof userKey === "string" && userKey.startsWith("guest:")) {
          userEmail = userKey.slice(6).trim();
          if (!userEmail) continue;
          const [rows] = await c.query(
            `SELECT a.id
             FROM iq_attempts a
             LEFT JOIN (
               SELECT result_token, MIN(email) AS email
               FROM result_email_links
               WHERE result_type = 'iq'
               GROUP BY result_token
             ) rel ON rel.result_token = a.attempt_token
             WHERE a.test_id = ? AND a.status = 'completed' AND a.user_id IS NULL AND rel.email = ?`,
            [testId, userEmail]
          );
          attempts = rows;
        } else {
          continue;
        }

        const attemptIds = attempts.map((a) => a.id);
        if (attemptIds.length === 0) continue;
        await c.query("DELETE FROM iq_attempt_answers WHERE attempt_id IN (?)", [attemptIds]);
        await c.query("DELETE FROM iq_attempts WHERE id IN (?)", [attemptIds]);
        if (userEmail) {
          await c.query(
            `DELETE rel
             FROM result_email_links rel
             WHERE rel.result_type = 'iq'
               AND rel.email = ?
               AND rel.result_token NOT IN (SELECT attempt_token FROM iq_attempts WHERE attempt_token IS NOT NULL)`,
            [userEmail]
          );
        }
        if (typeof userKey === "string" && userKey.startsWith("user:")) {
          const userId = Number(userKey.slice(5));
          const [[{ cnt }]] = await c.query(
            "SELECT COUNT(*) AS cnt FROM iq_attempts WHERE user_id = ?",
            [userId]
          );
          if (Number(cnt) === 0) {
            await c.query("DELETE FROM users WHERE id = ?", [userId]);
            deletedUsers.push(userId);
          }
        }
      }
      await c.commit();
      return { ok: true, deletedUsers };
    } catch (err) {
      await c.rollback();
      throw err;
    }
  });
}

// --- Analyse agregee par question pour un test -------------------------------
async function analyzeTest(testId) {
  return withConnection(async (c) => {
    const [[meta]] = await c.query(
      `SELECT t.id, t.slug, t.title,
              (SELECT COUNT(*) FROM iq_attempts a WHERE a.test_id = t.id AND a.status = 'completed') AS completed_attempts
       FROM iq_tests t WHERE t.id = ? LIMIT 1`,
      [testId]
    );
    if (!meta) return { meta: null, rows: [] };

    const completed = Number(meta.completed_attempts) || 0;

    const [rows] = await c.query(
      `SELECT
          s.section_key,
          s.title AS section_title,
          s.position AS section_position,
          q.position AS question_position,
          q.question_key,
          q.question_format,
          q.difficulty_level,
          q.weight,
          q.time_limit_seconds,
          COUNT(*) AS rows_total,
          SUM(CASE WHEN aa.response_time_ms = ? THEN 1 ELSE 0 END) AS not_presented,
          SUM(CASE WHEN aa.response_time_ms = ? THEN 1 ELSE 0 END) AS unanswered,
          SUM(CASE WHEN aa.response_time_ms IS NULL OR (aa.response_time_ms <> ? AND aa.response_time_ms <> ?) THEN 1 ELSE 0 END) AS answered,
          ROUND(AVG(CASE WHEN aa.response_time_ms IS NOT NULL AND aa.response_time_ms <> ? AND aa.response_time_ms <> ? THEN aa.response_time_ms END)) AS avg_ms,
          ROUND(MIN(CASE WHEN aa.response_time_ms IS NOT NULL AND aa.response_time_ms <> ? AND aa.response_time_ms <> ? THEN aa.response_time_ms END)) AS min_ms,
          ROUND(MAX(CASE WHEN aa.response_time_ms IS NOT NULL AND aa.response_time_ms <> ? AND aa.response_time_ms <> ? THEN aa.response_time_ms END)) AS max_ms,
          SUM(CASE
                WHEN q.time_limit_seconds IS NOT NULL
                 AND q.time_limit_seconds > 0
                 AND aa.response_time_ms IS NOT NULL
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms > q.time_limit_seconds * 1000 * 0.9
                THEN 1 ELSE 0 END) AS lost_10,
          SUM(CASE
                WHEN q.time_limit_seconds IS NOT NULL
                 AND q.time_limit_seconds > 0
                 AND aa.response_time_ms IS NOT NULL
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms > q.time_limit_seconds * 1000 * 0.8
                THEN 1 ELSE 0 END) AS lost_20,
          SUM(CASE
                WHEN q.time_limit_seconds IS NOT NULL
                 AND q.time_limit_seconds > 0
                 AND aa.response_time_ms IS NOT NULL
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms > q.time_limit_seconds * 1000 * 0.7
                THEN 1 ELSE 0 END) AS lost_30,
          SUM(CASE
                WHEN q.time_limit_seconds IS NOT NULL
                 AND q.time_limit_seconds > 0
                 AND aa.response_time_ms IS NOT NULL
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms > q.time_limit_seconds * 1000 * 0.6
                THEN 1 ELSE 0 END) AS lost_40,
          SUM(CASE
                WHEN q.time_limit_seconds IS NOT NULL
                 AND q.time_limit_seconds > 0
                 AND aa.response_time_ms IS NOT NULL
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms <> ?
                 AND aa.response_time_ms > q.time_limit_seconds * 1000 * 0.5
                THEN 1 ELSE 0 END) AS lost_50,
          SUM(CASE
                WHEN (overlay.question_id IS NOT NULL AND aa.selected_position IS NOT NULL AND overlay.correct_position IS NOT NULL AND aa.selected_position = overlay.correct_position)
                  OR (overlay.question_id IS NULL AND aa.selected_option_id IS NOT NULL AND correct.id IS NOT NULL AND aa.selected_option_id = correct.id)
                THEN 1 ELSE 0 END) AS correct
       FROM iq_attempt_answers aa
       INNER JOIN iq_attempts a ON a.id = aa.attempt_id
       INNER JOIN iq_questions q ON q.id = aa.question_id
       INNER JOIN iq_sections s ON s.id = aa.section_id
       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
       LEFT JOIN iq_question_options correct ON correct.question_id = q.id AND correct.is_correct = 1 AND correct.is_active = 1
       WHERE a.test_id = ? AND a.status = 'completed'
       GROUP BY q.id, s.section_key, s.title, s.position, q.position, q.question_key, q.question_format, q.difficulty_level, q.weight, q.time_limit_seconds
       ORDER BY s.position, q.position, q.question_key`,
      [
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        NOT_PRESENTED_MS, UNANSWERED_MS,
        testId,
      ]
    );

    const enriched = rows.map((r) => {
      const answered = Number(r.answered) || 0;
      const unanswered = Number(r.unanswered) || 0;
      const notPresented = Number(r.not_presented) || 0;
      const correct = Number(r.correct) || 0;
      const lost10 = Number(r.lost_10) || 0;
      const lost20 = Number(r.lost_20) || 0;
      const lost30 = Number(r.lost_30) || 0;
      const lost40 = Number(r.lost_40) || 0;
      const lost50 = Number(r.lost_50) || 0;
      const presented = answered + unanswered; // affichee a l'utilisateur
      return {
        section_key: r.section_key,
        section_title: r.section_title,
        question_key: r.question_key,
        question_format: r.question_format,
        difficulty_level: Number(r.difficulty_level),
        weight: Number(r.weight),
        time_limit_seconds: r.time_limit_seconds == null ? null : Number(r.time_limit_seconds),
        completed_attempts: completed,
        presented,
        not_presented: notPresented,
        answered,
        unanswered,
        correct,
        lost_10: lost10,
        lost_20: lost20,
        lost_30: lost30,
        lost_40: lost40,
        lost_50: lost50,
        presentation_rate: completed > 0 ? presented / completed : 0,
        unanswered_rate: presented > 0 ? unanswered / presented : 0,
        correct_rate: answered > 0 ? correct / answered : 0,
        lost_10_rate: answered > 0 ? lost10 / answered : 0,
        lost_20_rate: answered > 0 ? lost20 / answered : 0,
        lost_30_rate: answered > 0 ? lost30 / answered : 0,
        lost_40_rate: answered > 0 ? lost40 / answered : 0,
        lost_50_rate: answered > 0 ? lost50 / answered : 0,
        keep_10_rate: answered > 0 ? (answered - lost10) / answered : 0,
        keep_20_rate: answered > 0 ? (answered - lost20) / answered : 0,
        keep_30_rate: answered > 0 ? (answered - lost30) / answered : 0,
        keep_40_rate: answered > 0 ? (answered - lost40) / answered : 0,
        keep_50_rate: answered > 0 ? (answered - lost50) / answered : 0,
        avg_ms: r.avg_ms == null ? null : Number(r.avg_ms),
        min_ms: r.min_ms == null ? null : Number(r.min_ms),
        max_ms: r.max_ms == null ? null : Number(r.max_ms),
      };
    });

    return { meta: { id: meta.id, slug: meta.slug, title: meta.title, completed }, rows: enriched };
  });
}

// --- Page HTML ---------------------------------------------------------------
const PAGE = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Analyse reponses IQ</title>
<style>
  :root { --bg:#0f1115; --card:#1a1d24; --line:#2a2f3a; --txt:#e6e8ec; --mut:#9aa3b0; --accent:#5b9dff; --good:#3ecf8e; --warn:#f5a623; --bad:#ef5b5b; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--txt); font-size:13px; }
  header { position:sticky; top:0; z-index:10; background:var(--card); border-bottom:1px solid var(--line); padding:12px 16px; }
  .row { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
  h1 { font-size:15px; margin:0; font-weight:600; }
  select { background:var(--bg); color:var(--txt); border:1px solid var(--line); border-radius:8px; padding:7px 9px; font-size:13px; min-width:260px; }
  .meta { color:var(--mut); font-size:12px; }
  .chips { display:flex; gap:8px; flex-wrap:wrap; margin-top:7px; }
  .chip { background:var(--bg); border:1px solid var(--line); border-radius:999px; padding:3px 10px; font-size:11px; color:var(--mut); }
  .chip b { color:var(--txt); }
  main { padding:14px 16px 48px; }
  .sec { margin:18px 0 6px; font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:var(--accent); font-weight:600; }
  table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
  th,td { padding:6px 7px; text-align:right; border-bottom:1px solid var(--line); white-space:nowrap; font-size:12px; }
  th:first-child,td:first-child,th:nth-child(2),td:nth-child(2) { text-align:left; }
  th { background:#20242d; color:var(--mut); font-weight:600; cursor:pointer; user-select:none; position:sticky; top:0; z-index:2; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#20242d; }
  .key { font-family:ui-monospace,monospace; font-size:11px; }
  .fmt { color:var(--mut); font-size:10px; }
  .bar { display:inline-block; height:8px; border-radius:4px; vertical-align:middle; margin-left:6px; }
  .pct { font-variant-numeric:tabular-nums; }
  .muted { color:var(--mut); }
  .loading { color:var(--mut); padding:40px; text-align:center; }
  .flag { color:var(--warn); }
</style></head>
<body>
<header>
  <div class="row">
    <h1>Analyse des reponses IQ</h1>
    <select id="testSel"><option>Chargement...</option></select>
    <span class="meta" id="dbInfo"></span>
    <button onclick="openEditUsers()" style="margin-left:auto;background:var(--card);color:var(--accent);border:1px solid var(--line);border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer;">Edit Users</button>
    <a class="meta" href="logout" style="color:var(--accent);text-decoration:none">Deconnexion</a>
  </div>
  <div class="chips" id="chips"></div>
</header>
<main><div class="loading" id="content">Selectionne un test.</div></main>
<script>
const PRESELECT = "__PRESELECT__";
let CURRENT = { rows: [], sortKey: null, sortDir: -1 };

function pct(x){ return (x*100).toFixed(1)+'%'; }
function ms(x){ return x==null ? '—' : (x>=1000 ? (x/1000).toFixed(1)+' s' : x+' ms'); }
function colorFor(rate, kind){
  if(kind==='good') return rate>=0.66?'var(--good)':rate>=0.33?'var(--warn)':'var(--bad)';
  return rate>=0.33?'var(--bad)':rate>=0.1?'var(--warn)':'var(--good)'; // pour non-repondue: bas = bon
}

async function loadTests(){
  const r = await fetch('api/tests'); const data = await r.json();
  document.getElementById('dbInfo').textContent = 'base: '+data.db;
  const sel = document.getElementById('testSel');
  sel.innerHTML = '';
  for(const t of data.tests){
    const o = document.createElement('option');
    o.value = t.id;
    o.textContent = t.title+' ('+t.slug+') — '+t.completed_attempts+' tentatives completees';
    sel.appendChild(o);
  }
  sel.onchange = () => loadAnalysis(sel.value);
  if(PRESELECT && [...sel.options].some(o => o.value === PRESELECT)) sel.value = PRESELECT;
  if(data.tests.length) loadAnalysis(sel.value);
}

async function loadAnalysis(testId){
  document.getElementById('content').innerHTML = '<div class="loading">Analyse en cours...</div>';
  const r = await fetch('api/analysis?testId='+encodeURIComponent(testId));
  const data = await r.json();
  if(!data.meta){ document.getElementById('content').innerHTML='<div class="loading">Test introuvable.</div>'; return; }
  CURRENT.rows = data.rows;
  renderChips(data.meta, data.rows);
  render();
}

function renderChips(meta, rows){
  const totalQ = rows.length;
  const avgCorrect = rows.length ? rows.reduce((s,r)=>s+r.correct_rate,0)/rows.length : 0;
  const flagged = rows.filter(r=>r.presentation_rate < 0.95).length;
  document.getElementById('chips').innerHTML =
    '<span class="chip">Test analyse : <b>'+meta.title+'</b></span>'+
    '<span class="chip">Tentatives completees : <b>'+meta.completed+'</b></span>'+
    '<span class="chip">Questions : <b>'+totalQ+'</b></span>'+
    '<span class="chip">% bonnes (moyen) : <b>'+pct(avgCorrect)+'</b></span>'+
    '<span class="chip">Questions sous-presentees (&lt;95%) : <b class="flag">'+flagged+'</b></span>';
}

const COLS = [
  {k:'question_key', label:'Question', txt:true},
  {k:'difficulty_level', label:'Niv.'},
  {k:'presented', label:'n'},
  {k:'presentation_rate', label:'% vu', pct:true, kind:'good'},
  {k:'unanswered_rate', label:'% NR', pct:true, kind:'bad'},
  {k:'correct_rate', label:'% ok', pct:true, kind:'good'},
  {k:'answered', label:'n rep'},
  {k:'avg_ms', label:'Moy.', time:true},
  {k:'min_ms', label:'Min', time:true},
  {k:'max_ms', label:'Max', time:true},
  {k:'keep_10_rate', label:'R -10%', pct:true, kind:'good'},
  {k:'keep_20_rate', label:'R -20%', pct:true, kind:'good'},
  {k:'keep_30_rate', label:'R -30%', pct:true, kind:'good'},
  {k:'keep_40_rate', label:'R -40%', pct:true, kind:'good'},
  {k:'keep_50_rate', label:'R -50%', pct:true, kind:'good'},
];

function render(){
  const rows = [...CURRENT.rows];
  if(CURRENT.sortKey){
    rows.sort((a,b)=>{ const x=a[CURRENT.sortKey], y=b[CURRENT.sortKey];
      if(x==null) return 1; if(y==null) return -1;
      return (x<y?-1:x>y?1:0)*CURRENT.sortDir; });
  }
  // group by section preserving order
  const sections = [];
  const idx = {};
  for(const r of rows){ if(!(r.section_key in idx)){ idx[r.section_key]=sections.length; sections.push({key:r.section_key, title:r.section_title, rows:[]}); } sections[idx[r.section_key]].rows.push(r); }

  let html='';
  for(const sec of sections){
    html += '<div class="sec">'+sec.title+' ('+sec.key+') — '+sec.rows.length+' questions</div>';
    html += '<table><thead><tr>';
    for(const c of COLS){ html += '<th data-k="'+c.k+'">'+c.label+'</th>'; }
    html += '</tr></thead><tbody>';
    for(const r of sec.rows){
      html += '<tr>';
      for(const c of COLS){
        let v = r[c.k];
        if(c.txt){
          html += '<td><span class="key">'+v+'</span> <span class="fmt">'+r.question_format+'</span></td>';
        } else if(c.pct){
          const col = colorFor(v, c.kind);
          const w = Math.round(v*34);
          html += '<td class="pct" style="color:'+col+'">'+pct(v)+'<span class="bar" style="width:'+w+'px;background:'+col+'"></span></td>';
        } else if(c.time){
          html += '<td class="muted">'+ms(v)+'</td>';
        } else {
          html += '<td>'+(v==null?'—':v)+'</td>';
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
  }
  document.getElementById('content').innerHTML = html || '<div class="loading">Aucune donnee.</div>';
  document.querySelectorAll('th[data-k]').forEach(th=>{
    th.onclick = ()=>{ const k=th.getAttribute('data-k');
      if(CURRENT.sortKey===k) CURRENT.sortDir*=-1; else { CURRENT.sortKey=k; CURRENT.sortDir=-1; }
      render(); };
  });
}

loadTests();

// --- Edit Users --------------------------------------------------------------
function euEsc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function euResultUrl(token){ return token ? '${APP_BASE_URL || ""}/iq/results/'+encodeURIComponent(token) : ''; }

async function openEditUsers(){
  const sel=document.getElementById('testSel');
  document.getElementById('euTitle').textContent=sel.options[sel.selectedIndex]?.text.split(' \u2014')[0]??'';
  document.getElementById('euMsg').textContent='';
  document.getElementById('euList').innerHTML='<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--mut)">Chargement...</td></tr>';
  document.getElementById('euOverlay').style.display='flex';
  try {
    const resp = await fetch('api/users?testId='+encodeURIComponent(sel.value));
    const data = await resp.json();
    if(!resp.ok) throw new Error(data.error ?? ('HTTP '+resp.status));
    const users=data.users??[];
    const tbody=document.getElementById('euList');
    document.getElementById('euAll').checked=false;
    document.getElementById('euAll').indeterminate=false;
    if(!users.length){
      tbody.innerHTML='<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--mut)">Aucun utilisateur pour ce test.</td></tr>';
    } else {
      tbody.innerHTML=users.map(u=>
        '<tr style="border-top:1px solid var(--line)">'+
        '<td style="padding:8px 10px"><input type="checkbox" class="eu-cb" data-key="'+euEsc(u.user_key)+'" onchange="euUpdateCount()"></td>'+
        '<td style="padding:8px 10px;font-size:13px">'+euEsc(u.email)+'</td>'+
        '<td style="padding:8px 10px;font-size:13px;color:var(--mut)">'+euEsc(u.name??'')+'</td>'+
        '<td style="padding:8px 10px;font-size:13px;text-align:right">'+u.attempt_count+'</td>'+
        '<td style="padding:8px 10px;text-align:right">'+(u.latest_attempt_token ? '<a href="'+euEsc(euResultUrl(u.latest_attempt_token))+'" target="_blank" rel="noreferrer" style="color:var(--accent);text-decoration:none;font-size:12px">Ouvrir</a>' : '<span style="color:var(--mut);font-size:12px">—</span>')+'</td></tr>'
      ).join('');
    }
  } catch(err) {
  document.getElementById('euList').innerHTML='<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--bad)">Erreur de chargement : '+euEsc(err.message ?? err)+'</td></tr>';
  }
  euUpdateCount();
}
function euClose(){ document.getElementById('euOverlay').style.display='none'; }
function euToggleAll(cb){ document.querySelectorAll('.eu-cb').forEach(c=>c.checked=cb.checked); euUpdateCount(); }
function euUpdateCount(){
  const n=document.querySelectorAll('.eu-cb:checked').length, t=document.querySelectorAll('.eu-cb').length;
  document.getElementById('euCount').textContent=n+' sélectionné(s) sur '+t;
  document.getElementById('euBtn').disabled=n===0;
  document.getElementById('euAll').checked=t>0&&n===t;
  document.getElementById('euAll').indeterminate=n>0&&n<t;
}
async function euDelete(){
  const userKeys=[...document.querySelectorAll('.eu-cb:checked')].map(c=>String(c.dataset.key??'')).filter(Boolean);
  const testId=document.getElementById('testSel').value;
  if(!confirm('Supprimer les données de '+userKeys.length+' utilisateur(s) pour ce test ?\\nCette action est irréversible.')) return;
  document.getElementById('euBtn').disabled=true;
  document.getElementById('euMsg').style.color='var(--mut)';
  document.getElementById('euMsg').textContent='Suppression en cours...';
  try {
    const data=await(await fetch('api/users/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testId:Number(testId),userKeys})})).json();
    if(data.ok){
      document.getElementById('euMsg').style.color='var(--good)';
      document.getElementById('euMsg').textContent=userKeys.length+' tentative(s) supprimée(s).'+(data.deletedUsers?.length?' '+data.deletedUsers.length+' utilisateur(s) supprimé(s) de la base.':'');
      await openEditUsers();
      loadAnalysis(testId);
    } else throw new Error(data.error??'Erreur inconnue');
  } catch(err){
    document.getElementById('euMsg').style.color='var(--bad)';
    document.getElementById('euMsg').textContent='Erreur : '+err.message;
    document.getElementById('euBtn').disabled=false;
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('euOverlay').addEventListener('click',function(e){if(e.target===this)euClose();});
});
</script>

<!-- Modal Edit Users -->
<div id="euOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;align-items:center;justify-content:center;">
  <div style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;width:540px;max-width:95vw;max-height:82vh;display:flex;flex-direction:column;gap:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="margin:0;font-size:16px;">Edit Users &mdash; <span id="euTitle" style="color:var(--accent)"></span></h2>
      <button onclick="euClose()" style="background:none;border:none;color:var(--mut);font-size:22px;cursor:pointer;line-height:1;padding:0 4px;">&times;</button>
    </div>
    <p style="margin:0;font-size:13px;color:var(--mut);">Coche les utilisateurs dont tu veux supprimer les résultats pour ce test. Si l'utilisateur n'a plus aucun autre test, il sera aussi supprimé de la base.</p>
    <div style="overflow-y:auto;flex:1;border:1px solid var(--line);border-radius:8px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#20242d;">
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:var(--mut);width:36px;"><input type="checkbox" id="euAll" onchange="euToggleAll(this)"></th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:var(--mut);">Email</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:var(--mut);">Nom</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;color:var(--mut);">Tentatives</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;color:var(--mut);">Résultat</th>
        </tr></thead>
        <tbody id="euList"></tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap;">
      <span id="euCount" style="font-size:13px;color:var(--mut);">0 sélectionné(s)</span>
      <div style="display:flex;gap:10px;">
        <button onclick="euClose()" style="background:var(--bg);color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:8px 18px;cursor:pointer;font-size:14px;">Annuler</button>
        <button id="euBtn" onclick="euDelete()" style="background:var(--bad);color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-size:14px;font-weight:600;" disabled>Mettre à jour BD</button>
      </div>
    </div>
    <div id="euMsg" style="font-size:13px;min-height:18px;"></div>
  </div>
</div>
</body></html>`;

// --- Page de garde (login) ---------------------------------------------------
function renderLogin(tests, { error = "", selectedTestId = "" } = {}) {
  const options = tests
    .map((t) => {
      const sel = String(t.id) === String(selectedTestId) ? " selected" : "";
      return `<option value="${htmlEscape(t.id)}"${sel}>${htmlEscape(t.title)} (${htmlEscape(t.slug)}) — ${htmlEscape(t.completed_attempts)} tentatives</option>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Analyse IQ — Connexion</title>
<style>
  :root { --bg:#0f1115; --card:#1a1d24; --line:#2a2f3a; --txt:#e6e8ec; --mut:#9aa3b0; --accent:#5b9dff; --bad:#ef5b5b; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--txt); }
  form { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:28px; width:360px; max-width:92vw; }
  h1 { font-size:18px; margin:0 0 4px; }
  p.sub { color:var(--mut); font-size:13px; margin:0 0 20px; }
  label { display:block; font-size:13px; color:var(--mut); margin:14px 0 6px; }
  input, select { width:100%; background:var(--bg); color:var(--txt); border:1px solid var(--line); border-radius:9px; padding:10px 12px; font-size:14px; }
  button { width:100%; margin-top:22px; background:var(--accent); color:#06122c; border:0; border-radius:9px; padding:11px; font-size:15px; font-weight:600; cursor:pointer; }
  .err { background:rgba(239,91,91,.12); border:1px solid var(--bad); color:#ffb4b4; border-radius:9px; padding:9px 12px; font-size:13px; margin-bottom:6px; }
</style></head>
<body>
<form method="POST" action="login">
  <h1>Analyse des reponses IQ</h1>
  <p class="sub">Acces reserve. Identifie-toi pour consulter.</p>
  ${error ? `<div class="err">${htmlEscape(error)}</div>` : ""}
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="username" required autofocus>
  <label for="password">Mot de passe</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <label for="testId">Test a analyser</label>
  <select id="testId" name="testId" required>${options || "<option value=''>Aucun test</option>"}</select>
  <button type="submit">Acceder a l'analyse</button>
</form>
</body></html>`;
}

// --- Serveur -----------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    resetIdle();
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const method = req.method ?? "GET";

    // Deconnexion
    if (url.pathname === "/logout") {
      res.writeHead(302, { "Set-Cookie": sessionCookieHeader("", req, 0), Location: "." });
      res.end();
      return;
    }

    // Soumission du formulaire de connexion
    if (url.pathname === "/login" && method === "POST") {
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const email = (params.get("email") ?? "").trim();
      const password = params.get("password") ?? "";
      const testId = (params.get("testId") ?? "").replace(/[^0-9]/g, "");

      if (verifyCredentials(email, password)) {
        res.writeHead(302, {
          "Set-Cookie": sessionCookieHeader(signSession(email), req),
          Location: testId ? `app?testId=${encodeURIComponent(testId)}` : "app",
        });
        res.end();
        return;
      }

      const tests = await listTests();
      res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderLogin(tests, { error: "Email ou mot de passe incorrect.", selectedTestId: testId }));
      return;
    }

    const sessionEmail = getSessionEmail(req);

    // Page de garde
    if (url.pathname === "/" || url.pathname === "/login") {
      if (sessionEmail) {
        res.writeHead(302, { Location: "app" });
        res.end();
        return;
      }
      const tests = await listTests();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderLogin(tests));
      return;
    }

    // A partir d'ici : session obligatoire
    if (!sessionEmail) {
      if (url.pathname.startsWith("/api/")) {
        res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Session expiree, reconnecte-toi." }));
      } else {
        res.writeHead(302, { Location: "." });
        res.end();
      }
      return;
    }

    if (url.pathname === "/app") {
      const preselect = (url.searchParams.get("testId") ?? "").replace(/[^0-9]/g, "");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(PAGE.replace("__PRESELECT__", preselect));
      return;
    }

    if (url.pathname === "/api/tests") {
      const tests = await listTests();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ db: `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`, tests }));
      return;
    }

    if (url.pathname === "/api/analysis") {
      const testId = Number(url.searchParams.get("testId"));
      const data = await analyzeTest(testId);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data));
      return;
    }

    if (url.pathname === "/api/users" && method === "GET") {
      const testId = Number(url.searchParams.get("testId"));
      const users = await listUsersForTest(testId);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ users }));
      return;
    }

    if (url.pathname === "/api/users/delete" && method === "POST") {
      const body = await readBody(req);
      const params = JSON.parse(body);
      const testId = Number(params.testId);
      const userKeys = (params.userKeys ?? []).map(String).filter(Boolean);
      if (!testId || userKeys.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "Paramètres manquants." }));
        return;
      }
      const result = await deleteUserAttempts(testId, userKeys);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (error) {
    console.error("[500]", req.method, req.url, error);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error?.message ?? String(error) }));
  }
});

let idleTimer = null;
function resetIdle() {
  if (!IDLE_MINUTES || IDLE_MINUTES <= 0) return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    console.log(`Aucune activite depuis ${IDLE_MINUTES} min, arret.`);
    server.close(() => process.exit(0));
  }, IDLE_MINUTES * 60 * 1000);
  if (typeof idleTimer.unref === "function") idleTimer.unref();
}

function onListening(where) {
  resetIdle();
  console.log(`\n  Analyse IQ -> ${where}`);
  console.log(`  Base : ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  console.log(`  Auth : ${AUTH_USERS.size} compte(s) : ${[...AUTH_USERS.keys()].join(", ")}`);
  if (IDLE_MINUTES > 0) console.log(`  Arret auto apres ${IDLE_MINUTES} min d'inactivite.`);
  console.log(`  (Ctrl+C pour arreter)\n`);
}

// Activation a la demande (systemd socket) : si systemd nous passe un socket en
// ecoute, on l'utilise (fd 3) au lieu d'ouvrir le port nous-memes. Sinon, ecoute
// classique sur HOST:PORT.
if (process.env.LISTEN_FDS && Number(process.env.LISTEN_FDS) > 0) {
  server.listen({ fd: 3 }, () => onListening("socket systemd (fd 3)"));
} else {
  server.listen(PORT, HOST, () => onListening(`http://${HOST}:${PORT}`));
}
