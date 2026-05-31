export const DUEL_IDENTITY_COOKIE_NAME = "quizhub_duel_identity";
export const DUEL_IDENTITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type DuelIdentity = {
  email: string;
  pseudo: string;
};

export function normalizeDuelEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeDuelPseudo(pseudo: string | null | undefined) {
  return pseudo?.trim() ?? "";
}

export function isValidDuelEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createDuelIdentity(email: string, pseudo: string | null | undefined): DuelIdentity | null {
  const normalizedEmail = normalizeDuelEmail(email);

  if (!isValidDuelEmail(normalizedEmail)) {
    return null;
  }

  return {
    email: normalizedEmail,
    pseudo: normalizeDuelPseudo(pseudo),
  };
}

export function serializeDuelIdentity(identity: DuelIdentity) {
  return encodeURIComponent(JSON.stringify(identity));
}

export function parseDuelIdentity(value: string | null | undefined): DuelIdentity | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeCookieValue(value)) as Partial<DuelIdentity>;
    const email = typeof parsed.email === "string" ? parsed.email : "";
    const pseudo = typeof parsed.pseudo === "string" ? parsed.pseudo : "";

    return createDuelIdentity(email, pseudo);
  } catch {
    return null;
  }
}

function decodeCookieValue(value: string) {
  let decodedValue = value;

  for (let index = 0; index < 2; index += 1) {
    const nextValue = decodeURIComponent(decodedValue);

    if (nextValue === decodedValue) {
      return decodedValue;
    }

    decodedValue = nextValue;
  }

  return decodedValue;
}
