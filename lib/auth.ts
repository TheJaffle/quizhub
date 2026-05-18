import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";

type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  pseudo: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  birth_date: Date | string | null;
  gender: string | null;
  newsletter_opt_in: number;
  notifications_opt_in: number;
  password_setup_required: number;
  is_active: number;
};

export type AuthUser = {
  id: number;
  email: string;
  pseudo: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  gender: string | null;
  newsletterOptIn: boolean;
  notificationsOptIn: boolean;
  passwordSetupRequired: boolean;
};

export type UserAvatarPreset = {
  id: number;
  name: string;
  imageUrl: string;
};

export type UserQuizResult = {
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: Date;
};

export type DashboardRecentResult = {
  id: number;
  resultToken: string;
  title: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: Date;
};

export type DashboardMonthlyActivity = {
  monthLabel: string;
  completedQuizzes: number;
};

export type UserDashboardData = {
  totalCompletedQuizzes: number;
  bestPercentage: number;
  averagePercentage: number;
  bestQuizTitle: string | null;
  recentResults: DashboardRecentResult[];
  monthlyActivity: DashboardMonthlyActivity[];
};

type UserQuizResultRow = {
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: Date;
};

type DashboardAggregateRow = {
  total_completed: number;
  best_percentage: number;
  average_percentage: string | number;
};

type DashboardBestQuizRow = {
  quiz_title: string;
};

type DashboardRecentResultRow = {
  id: number;
  result_token: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: Date;
};

type DashboardMonthlyActivityRow = {
  month_key: string;
  completed_count: number;
};

type IqAttemptOwnerRow = {
  id: number;
  user_id: number | null;
};

type VerifiedEmailResultType = "quiz" | "iq";

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const USER_SELECT_FIELDS =
  "id, email, password_hash, pseudo, full_name, bio, avatar_url, birth_date, gender, newsletter_opt_in, notifications_opt_in, password_setup_required, is_active";

const USER_BASE_SELECT_FIELDS = "id, email, password_hash, pseudo, full_name, bio, avatar_url, is_active";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatDateInput(value: Date | string | null) {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function mapUserRow(user: UserRow): AuthUser {
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    fullName: user.full_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    birthDate: formatDateInput(user.birth_date),
    gender: user.gender,
    newsletterOptIn: Boolean(user.newsletter_opt_in),
    notificationsOptIn: Boolean(user.notifications_opt_in),
    passwordSetupRequired: Boolean(user.password_setup_required),
  };
}

function mapBaseUserRow(user: Omit<UserRow, "birth_date" | "gender" | "newsletter_opt_in" | "notifications_opt_in" | "password_setup_required">): UserRow {
  return {
    ...user,
    birth_date: null,
    gender: null,
    newsletter_opt_in: 0,
    notifications_opt_in: 0,
    password_setup_required: 0,
  };
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

export async function registerUser(
  email: string,
  password: string,
  pseudo: string,
  resultToken?: string | null,
  attemptToken?: string | null
) {
  let connection: mysql.Connection | undefined;

  try {
    const normalizedEmail = normalizeEmail(email);
    const cleanPseudo = pseudo.trim();

    if (!normalizedEmail || !cleanPseudo || password.length < 8) {
      return { user: null, error: "Veuillez renseigner un email, un pseudo et un mot de passe d’au moins 8 caractères." };
    }

    connection = await mysql.createConnection(dbConfig);

    if (attemptToken) {
      const attemptCheck = await checkIqAttemptCanAttach(connection, attemptToken);

      if (attemptCheck.error) {
        return { user: null, error: attemptCheck.error };
      }
    }

    const passwordHash = hashPassword(password);
    const [result] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO users (email, password_hash, pseudo, is_active) VALUES (?, ?, ?, 1)",
      [normalizedEmail, passwordHash, cleanPseudo]
    );

    const user = {
      id: result.insertId,
      email: normalizedEmail,
      pseudo: cleanPseudo,
      fullName: null,
      bio: null,
      avatarUrl: null,
      birthDate: null,
      gender: null,
      newsletterOptIn: false,
      notificationsOptIn: false,
      passwordSetupRequired: false,
    };

    if (resultToken) {
      await attachResultToUser(connection, resultToken, user.id, user.pseudo);
    }

    if (attemptToken) {
      const attachResult = await attachIqAttemptToUserWithConnection(connection, attemptToken, user.id);

      if (attachResult.error) {
        return { user: null, error: attachResult.error };
      }
    }

    return { user, error: null };
  } catch (error) {
    const mysqlError = error as { code?: string };

    if (mysqlError.code === "ER_DUP_ENTRY") {
      return { user: null, error: "Cet email ou ce pseudo est déjà utilisé." };
    }

    return { user: null, error: "Impossible de créer le compte pour le moment." };
  } finally {
    await connection?.end();
  }
}

export async function loginUser(email: string, password: string, resultToken?: string | null, attemptToken?: string | null) {
  let connection: mysql.Connection | undefined;

  try {
    const normalizedEmail = normalizeEmail(email);
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE email = ? LIMIT 1`,
      [normalizedEmail]
    );

    const userRow = (rows as UserRow[])[0];

    if (!userRow || !userRow.is_active) {
      return { user: null, error: "Email ou mot de passe incorrect." };
    }

    const passwordMatches = verifyPassword(password, userRow.password_hash);

    if (!passwordMatches) {
      return { user: null, error: "Email ou mot de passe incorrect." };
    }

    if (attemptToken) {
      const attemptCheck = await checkIqAttemptCanAttach(connection, attemptToken, userRow.id);

      if (attemptCheck.error) {
        return { user: null, error: attemptCheck.error };
      }
    }

    await connection.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [userRow.id]);

    if (resultToken) {
      await attachResultToUser(connection, resultToken, userRow.id, userRow.pseudo);
    }

    if (attemptToken) {
      const attachResult = await attachIqAttemptToUserWithConnection(connection, attemptToken, userRow.id);

      if (attachResult.error) {
        return { user: null, error: attachResult.error };
      }
    }

    return {
      user: mapUserRow(userRow),
      error: null,
    };
  } catch {
    return { user: null, error: "Impossible de se connecter pour le moment." };
  } finally {
    await connection?.end();
  }
}

export async function attachIqAttemptToUser(attemptToken: string, userId: number) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    return await attachIqAttemptToUserWithConnection(connection, attemptToken, userId);
  } finally {
    await connection?.end();
  }
}

export async function findOrCreateUserFromVerifiedEmail(email: string, resultType: VerifiedEmailResultType, resultToken: string) {
  let connection: mysql.Connection | undefined;

  try {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !resultToken || (resultType !== "quiz" && resultType !== "iq")) {
      return { user: null, error: "Lien email invalide." };
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [columnRows] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM users");
    const userColumns = new Set(columnRows.map((row) => String(row.Field)));
    const hasAccountProfileColumns =
      userColumns.has("birth_date") &&
      userColumns.has("gender") &&
      userColumns.has("newsletter_opt_in") &&
      userColumns.has("notifications_opt_in") &&
      userColumns.has("password_setup_required");
    const selectFields = hasAccountProfileColumns ? USER_SELECT_FIELDS : USER_BASE_SELECT_FIELDS;

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(`SELECT ${selectFields} FROM users WHERE email = ? LIMIT 1`, [
      normalizedEmail,
    ]);
    let userRow = hasAccountProfileColumns
      ? (rows as UserRow[])[0]
      : (rows as Array<Omit<UserRow, "birth_date" | "gender" | "newsletter_opt_in" | "notifications_opt_in" | "password_setup_required">>)[0]
        ? mapBaseUserRow(
            (rows as Array<Omit<UserRow, "birth_date" | "gender" | "newsletter_opt_in" | "notifications_opt_in" | "password_setup_required">>)[0]
          )
        : undefined;

    if (userRow && !userRow.is_active) {
      await connection.rollback();
      return { user: null, error: "Ce compte est inactif." };
    }

    if (!userRow) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = hashPassword(randomPassword);
      const pseudo = `user-${crypto.randomBytes(4).toString("hex")}`;

      const [insertResult] = hasAccountProfileColumns
        ? await connection.execute<mysql.ResultSetHeader>(
            "INSERT INTO users (email, password_hash, pseudo, is_active, password_setup_required) VALUES (?, ?, ?, 1, 1)",
            [normalizedEmail, passwordHash, pseudo]
          )
        : await connection.execute<mysql.ResultSetHeader>(
            "INSERT INTO users (email, password_hash, pseudo, is_active) VALUES (?, ?, ?, 1)",
            [normalizedEmail, passwordHash, pseudo]
          );

      userRow = {
        id: insertResult.insertId,
        email: normalizedEmail,
        password_hash: passwordHash,
        pseudo,
        full_name: null,
        bio: null,
        avatar_url: null,
        birth_date: null,
        gender: null,
        newsletter_opt_in: 0,
        notifications_opt_in: 0,
        password_setup_required: hasAccountProfileColumns ? 1 : 0,
        is_active: 1,
      };
    }

    if (resultType === "quiz") {
      await attachResultToUser(connection, resultToken, userRow.id, userRow.pseudo);
    } else {
      const attachResult = await attachIqAttemptToUserWithConnection(connection, resultToken, userRow.id);

      if (attachResult.error) {
        await connection.rollback();
        return { user: null, error: attachResult.error };
      }
    }

    await connection.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [userRow.id]);
    await connection.commit();

    return {
      user: mapUserRow(userRow),
      error: null,
    };
  } catch (error) {
    await connection?.rollback();

    const mysqlError = error as { code?: string; errno?: number; message?: string; sqlMessage?: string };
    console.error("RESULT ACCESS AUTO ACCOUNT ERROR", {
      resultType,
      resultToken,
      email: normalizeEmail(email),
      code: mysqlError.code,
      errno: mysqlError.errno,
      message: mysqlError.message,
      sqlMessage: mysqlError.sqlMessage,
      database: dbConfig.database,
      host: dbConfig.host,
    });

    if (mysqlError.code === "ER_DUP_ENTRY") {
      return { user: null, error: "Impossible de finaliser le compte automatiquement. Reessayez." };
    }

    return { user: null, error: "Impossible de connecter ce resultat au compte pour le moment." };
  } finally {
    await connection?.end();
  }
}

export async function getUserById(id: number) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = ? LIMIT 1`,
      [id]
    );

    const user = (rows as UserRow[])[0];

    if (!user || !user.is_active) {
      return null;
    }

    return mapUserRow(user);
  } finally {
    await connection?.end();
  }
}

export async function getQuizScoreUserById(id: number) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT id, pseudo, is_active FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    const user = (rows as Array<{ id: number; pseudo: string; is_active: number }>)[0];

    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: user.id,
      pseudo: user.pseudo,
    };
  } finally {
    await connection?.end();
  }
}

export async function getUserAvatarPresets(): Promise<UserAvatarPreset[]> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, name, image_url
       FROM user_avatar_presets
       WHERE is_active = 1
       ORDER BY position ASC, id ASC`
    );

    return rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      imageUrl: String(row.image_url),
    }));
  } catch {
    return [
      "/avatars/avatar-01.webp",
      "/avatars/avatar-02.webp",
      "/avatars/avatar-03.webp",
      "/avatars/avatar-04.webp",
      "/avatars/avatar-05.webp",
      "/avatars/avatar-06.webp",
      "/avatars/avatar-07.webp",
      "/avatars/avatar-08.webp",
      "/avatars/avatar-09.webp",
      "/avatars/avatar-10.webp",
    ].map((imageUrl, index) => ({ id: index + 1, name: `Avatar ${index + 1}`, imageUrl }));
  } finally {
    await connection?.end();
  }
}

export async function isAllowedPresetAvatarUrl(avatarUrl: string) {
  const presets = await getUserAvatarPresets();

  return presets.some((preset) => preset.imageUrl === avatarUrl);
}

function isAllowedUploadedAvatarUrl(userId: number, avatarUrl: string) {
  return new RegExp(`^/uploads/avatars/user-${userId}-[0-9]+-[a-f0-9-]+\\.(jpg|jpeg|png|webp)$`).test(avatarUrl);
}

export async function updateUserAvatar(userId: number, avatarUrl: string) {
  let connection: mysql.Connection | undefined;

  try {
    if (!Number.isInteger(userId) || userId <= 0 || !isAllowedUploadedAvatarUrl(userId, avatarUrl)) {
      return { user: null, error: "Avatar invalide." };
    }

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `UPDATE users
       SET avatar_url = ?
       WHERE id = ? AND is_active = 1`,
      [avatarUrl, userId]
    );

    if (result.affectedRows === 0) {
      return { user: null, error: "Utilisateur introuvable." };
    }

    const user = await getUserById(userId);

    return { user, error: user ? null : "Utilisateur introuvable." };
  } finally {
    await connection?.end();
  }
}

export async function updateUserSettings(
  userId: number,
  payload: {
    email: string;
    pseudo: string;
    fullName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    newsletterOptIn?: boolean;
    notificationsOptIn?: boolean;
  }
) {
  let connection: mysql.Connection | undefined;

  try {
    const normalizedEmail = normalizeEmail(payload.email);
    const cleanPseudo = payload.pseudo.trim();
    const fullName = payload.fullName?.trim() || null;
    const bio = payload.bio?.trim() || null;
    const avatarUrl = payload.avatarUrl?.trim() || null;
    const birthDate = payload.birthDate?.trim() || null;
    const gender = payload.gender?.trim() || null;
    const newsletterOptIn = payload.newsletterOptIn ? 1 : 0;
    const notificationsOptIn = payload.notificationsOptIn ? 1 : 0;
    const allowedGenders = new Set(["female", "male", "other", "prefer_not_to_say"]);

    if (!Number.isInteger(userId) || userId <= 0 || !normalizedEmail || !cleanPseudo) {
      return { user: null, error: "Veuillez renseigner un email et un pseudo valides." };
    }

    if (birthDate) {
      const parsedDate = new Date(`${birthDate}T00:00:00.000Z`);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
        return { user: null, error: "Date de naissance invalide." };
      }
    }

    if (gender && !allowedGenders.has(gender)) {
      return { user: null, error: "Sexe invalide." };
    }

    if (avatarUrl && !isAllowedUploadedAvatarUrl(userId, avatarUrl) && !(await isAllowedPresetAvatarUrl(avatarUrl))) {
      return { user: null, error: "Avatar invalide." };
    }

    connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute<mysql.ResultSetHeader>(
      `UPDATE users
       SET email = ?,
           pseudo = ?,
           full_name = ?,
           bio = ?,
           avatar_url = ?,
           birth_date = ?,
           gender = ?,
           newsletter_opt_in = ?,
           notifications_opt_in = ?
       WHERE id = ? AND is_active = 1`,
      [normalizedEmail, cleanPseudo, fullName, bio, avatarUrl, birthDate, gender, newsletterOptIn, notificationsOptIn, userId]
    );

    if (result.affectedRows === 0) {
      return { user: null, error: "Utilisateur introuvable." };
    }

    const user = await getUserById(userId);

    return { user, error: user ? null : "Utilisateur introuvable." };
  } catch (error) {
    const mysqlError = error as { code?: string };

    if (mysqlError.code === "ER_DUP_ENTRY") {
      return { user: null, error: "Cet email ou ce pseudo est déjà utilisé." };
    }

    return { user: null, error: "Impossible de mettre à jour le profil pour le moment." };
  } finally {
    await connection?.end();
  }
}

export async function updateUserPassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string) {
  let connection: mysql.Connection | undefined;

  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      return { error: "Non authentifié." };
    }

    if (!newPassword || !confirmPassword) {
      return { error: "Veuillez renseigner le nouveau mot de passe et sa confirmation." };
    }

    if (newPassword.length < 8) {
      return { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." };
    }

    if (newPassword !== confirmPassword) {
      return { error: "La confirmation du mot de passe ne correspond pas." };
    }

    if (newPassword === currentPassword) {
      return { error: "Le nouveau mot de passe doit être différent de l'ancien." };
    }

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT id, password_hash, password_setup_required, is_active FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const user = (rows as Pick<UserRow, "id" | "password_hash" | "password_setup_required" | "is_active">[])[0];

    if (!user || !user.is_active) {
      return { error: "Utilisateur introuvable." };
    }

    const canSetInitialPassword = Boolean(user.password_setup_required);

    if (!canSetInitialPassword && !currentPassword) {
      return { error: "Veuillez renseigner votre mot de passe actuel." };
    }

    if (!canSetInitialPassword && !verifyPassword(currentPassword, user.password_hash)) {
      return { error: "Mot de passe actuel incorrect." };
    }

    const passwordHash = hashPassword(newPassword);
    await connection.execute("UPDATE users SET password_hash = ?, password_setup_required = 0 WHERE id = ? AND is_active = 1", [passwordHash, userId]);

    return { error: null };
  } finally {
    await connection?.end();
  }
}

export async function getUserQuizResultByToken(resultToken: string, userId: number) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.title AS quiz_title, qr.score, qr.total_questions, qr.percentage, qr.created_at
       FROM quiz_results qr
       INNER JOIN quizzes q ON q.id = qr.quiz_id
       WHERE qr.result_token = ? AND qr.user_id = ?
       LIMIT 1`,
      [resultToken, userId]
    );

    const result = (rows as UserQuizResultRow[])[0];

    if (!result) {
      return null;
    }

    return {
      quizTitle: result.quiz_title,
      score: result.score,
      totalQuestions: result.total_questions,
      percentage: result.percentage,
      createdAt: result.created_at,
    };
  } finally {
    await connection?.end();
  }
}

export async function getQuizResultByToken(resultToken: string) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.title AS quiz_title, qr.score, qr.total_questions, qr.percentage, qr.created_at
       FROM quiz_results qr
       INNER JOIN quizzes q ON q.id = qr.quiz_id
       WHERE qr.result_token = ?
       LIMIT 1`,
      [resultToken]
    );

    const result = (rows as UserQuizResultRow[])[0];

    if (!result) {
      return null;
    }

    return {
      quizTitle: result.quiz_title,
      score: result.score,
      totalQuestions: result.total_questions,
      percentage: result.percentage,
      createdAt: result.created_at,
    };
  } finally {
    await connection?.end();
  }
}

export async function getUserDashboardData(userId: number): Promise<UserDashboardData> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 5, 1);

    const [aggregateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS total_completed,
              COALESCE(MAX(percentage), 0) AS best_percentage,
              COALESCE(AVG(percentage), 0) AS average_percentage
       FROM quiz_results
       WHERE user_id = ?`,
      [userId]
    );

    const [bestQuizRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.title AS quiz_title
       FROM quiz_results qr
       INNER JOIN quizzes q ON q.id = qr.quiz_id
       WHERE qr.user_id = ?
       ORDER BY qr.percentage DESC, qr.score DESC, qr.created_at DESC
       LIMIT 1`,
      [userId]
    );

    const [recentResultRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT qr.id, qr.result_token, q.title AS quiz_title, qr.score, qr.total_questions, qr.percentage, qr.created_at
       FROM quiz_results qr
       INNER JOIN quizzes q ON q.id = qr.quiz_id
       WHERE qr.user_id = ?
       ORDER BY qr.created_at DESC, qr.id DESC
       LIMIT 4`,
      [userId]
    );

    const [monthlyActivityRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key,
              COUNT(*) AS completed_count
       FROM quiz_results
       WHERE user_id = ? AND created_at >= ?
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month_key ASC`,
      [userId, monthStart]
    );

    const aggregate = (aggregateRows as DashboardAggregateRow[])[0];
    const bestQuiz = (bestQuizRows as DashboardBestQuizRow[])[0];
    const recentResults = (recentResultRows as DashboardRecentResultRow[]).map((row) => ({
      id: row.id,
      resultToken: row.result_token,
      title: row.quiz_title,
      score: row.score,
      totalQuestions: row.total_questions,
      percentage: row.percentage,
      createdAt: row.created_at,
    }));
    const monthlyActivityMap = new Map(
      (monthlyActivityRows as DashboardMonthlyActivityRow[]).map((row) => [row.month_key, row.completed_count])
    );
    const monthlyActivity = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth() + index, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      return {
        monthLabel: monthFormatter.format(date),
        completedQuizzes: monthlyActivityMap.get(monthKey) ?? 0,
      };
    });

    return {
      totalCompletedQuizzes: aggregate?.total_completed ?? 0,
      bestPercentage: aggregate?.best_percentage ?? 0,
      averagePercentage: Number(aggregate?.average_percentage ?? 0),
      bestQuizTitle: bestQuiz?.quiz_title ?? null,
      recentResults,
      monthlyActivity,
    };
  } finally {
    await connection?.end();
  }
}

async function attachResultToUser(connection: mysql.Connection, resultToken: string, userId: number, pseudo: string) {
  await connection.execute(
    `UPDATE quiz_results
     SET user_id = ?, player_name = ?
     WHERE result_token = ? AND user_id IS NULL`,
    [userId, pseudo, resultToken]
  );
}

async function checkIqAttemptCanAttach(connection: mysql.Connection, attemptToken: string, userId?: number) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    "SELECT id, user_id FROM iq_attempts WHERE attempt_token = ? LIMIT 1",
    [attemptToken]
  );
  const attempt = (rows as IqAttemptOwnerRow[])[0];

  if (!attempt) {
    return { attempt: null, error: "Tentative de test de logique introuvable." };
  }

  if (attempt.user_id !== null && attempt.user_id !== userId) {
    return { attempt: null, error: "Cette tentative de test de logique appartient déjà à un autre compte." };
  }

  return { attempt, error: null };
}

async function attachIqAttemptToUserWithConnection(connection: mysql.Connection, attemptToken: string, userId: number) {
  const attemptCheck = await checkIqAttemptCanAttach(connection, attemptToken, userId);

  if (attemptCheck.error || !attemptCheck.attempt) {
    return { error: attemptCheck.error ?? "Tentative de test de logique introuvable." };
  }

  await connection.execute(
    `UPDATE iq_attempts
     SET user_id = ?, updated_at = NOW()
     WHERE id = ? AND user_id IS NULL`,
    [userId, attemptCheck.attempt.id]
  );
  await connection.execute(
    `UPDATE iq_attempt_answers
     SET user_id = ?
     WHERE attempt_id = ? AND user_id IS NULL`,
    [userId, attemptCheck.attempt.id]
  );

  const [attemptColumnRows] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM iq_attempts");
  const attemptColumns = new Set(attemptColumnRows.map((row) => String(row.Field)));
  const [userColumnRows] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM users");
  const userColumns = new Set(userColumnRows.map((row) => String(row.Field)));

  if (attemptColumns.has("birth_date") && attemptColumns.has("gender") && userColumns.has("birth_date") && userColumns.has("gender")) {
    await connection.execute(
      `UPDATE users u
       INNER JOIN iq_attempts a ON a.id = ?
       SET u.birth_date = COALESCE(u.birth_date, a.birth_date),
           u.gender = COALESCE(u.gender, a.gender)
       WHERE u.id = ? AND u.is_active = 1`,
      [attemptCheck.attempt.id, userId]
    );
  }

  return { error: null };
}
