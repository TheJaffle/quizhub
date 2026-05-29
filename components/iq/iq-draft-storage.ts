"use client";

import type { SaveIqAttemptAnswerPayload } from "@/lib/iq-tests";

const IQ_DRAFT_STORAGE_PREFIX = "brainspark_iq_draft:";

export type IqDraftStoredAnswer = Pick<
  SaveIqAttemptAnswerPayload,
  "questionId" | "selectedOptionId" | "selectedPosition" | "responseTimeMs"
>;

export type IqDraftSubmission = {
  version: 2;
  attemptToken: string;
  answers: IqDraftStoredAnswer[];
  speedTotalTimeMs: number | null;
};

function getDraftStorageKey(attemptToken: string) {
  return `${IQ_DRAFT_STORAGE_PREFIX}${attemptToken}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeStoredAnswer(answer: Partial<IqDraftStoredAnswer>): IqDraftStoredAnswer | null {
  if (!Number.isInteger(answer.questionId)) {
    return null;
  }

  return {
    questionId: Number(answer.questionId),
    selectedOptionId:
      answer.selectedOptionId === null || answer.selectedOptionId === undefined
        ? null
        : Number(answer.selectedOptionId),
    selectedPosition:
      answer.selectedPosition === null || answer.selectedPosition === undefined
        ? null
        : Number(answer.selectedPosition),
    responseTimeMs:
      answer.responseTimeMs === null || answer.responseTimeMs === undefined
        ? null
        : Number(answer.responseTimeMs),
  };
}

function createEmptySubmission(attemptToken: string): IqDraftSubmission {
  return {
    version: 2,
    attemptToken,
    answers: [],
    speedTotalTimeMs: null,
  };
}

export function loadIqDraftSubmission(attemptToken: string): IqDraftSubmission | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getDraftStorageKey(attemptToken));

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<IqDraftSubmission> & {
      answers?: unknown[];
      speedTotalTimeMs?: unknown;
    };
    const answers = Array.isArray(parsed.answers)
      ? parsed.answers
          .map((answer) => normalizeStoredAnswer((answer ?? {}) as Partial<IqDraftStoredAnswer>))
          .filter((answer): answer is IqDraftStoredAnswer => Boolean(answer))
      : [];
    const speedTotalTimeMs =
      typeof parsed.speedTotalTimeMs === "number" && Number.isFinite(parsed.speedTotalTimeMs) && parsed.speedTotalTimeMs >= 0
        ? Math.round(parsed.speedTotalTimeMs)
        : null;

    return {
      version: 2,
      attemptToken,
      answers,
      speedTotalTimeMs,
    };
  } catch {
    return null;
  }
}

function saveIqDraftSubmission(submission: IqDraftSubmission) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(getDraftStorageKey(submission.attemptToken), JSON.stringify(submission));
}

export function saveIqDraftAnswer(attemptToken: string, answer: SaveIqAttemptAnswerPayload) {
  const submission = loadIqDraftSubmission(attemptToken) ?? createEmptySubmission(attemptToken);
  const normalizedAnswer = normalizeStoredAnswer(answer);

  if (!normalizedAnswer) {
    return submission;
  }

  const nextAnswers = submission.answers.filter((storedAnswer) => storedAnswer.questionId !== normalizedAnswer.questionId);
  nextAnswers.push(normalizedAnswer);

  const nextSubmission: IqDraftSubmission = {
    ...submission,
    answers: nextAnswers,
  };

  saveIqDraftSubmission(nextSubmission);
  return nextSubmission;
}

export function saveIqDraftSpeedTotalTime(attemptToken: string, totalTimeMs: number) {
  const submission = loadIqDraftSubmission(attemptToken) ?? createEmptySubmission(attemptToken);
  const safeTotalTimeMs = Number.isFinite(totalTimeMs) && totalTimeMs >= 0 ? Math.round(totalTimeMs) : null;
  const nextSubmission: IqDraftSubmission = {
    ...submission,
    speedTotalTimeMs: safeTotalTimeMs,
  };

  saveIqDraftSubmission(nextSubmission);
  return nextSubmission;
}

export function clearIqDraftSubmission(attemptToken: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(getDraftStorageKey(attemptToken));
}

export function clearAllIqDraftSubmissions() {
  if (!canUseStorage()) {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (key && key.startsWith(IQ_DRAFT_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function getIqDraftAnsweredQuestionIds(attemptToken: string) {
  const submission = loadIqDraftSubmission(attemptToken);

  return new Set((submission?.answers ?? []).map((answer) => answer.questionId));
}

export function getIqDraftAnswerCount(attemptToken: string) {
  return loadIqDraftSubmission(attemptToken)?.answers.length ?? 0;
}

export function getFirstUnansweredQuestionIndex(
  attemptToken: string,
  questions: Array<{ id: number }>
) {
  const answeredQuestionIds = getIqDraftAnsweredQuestionIds(attemptToken);
  const nextIndex = questions.findIndex((question) => !answeredQuestionIds.has(question.id));

  return nextIndex >= 0 ? nextIndex : questions.length;
}
