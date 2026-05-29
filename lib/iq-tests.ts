import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";

export type IqIntroSection = {
  id: number;
  key: string;
  title: string;
  description: string | null;
  timeLimitSeconds: number | null;
  questionCount: number;
};

export type IqTestIntro = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  totalTimeLimitSeconds: number | null;
  mainQuestionCount: number;
  mainTimeLimitSeconds: number;
  sections: IqIntroSection[];
  laterSections: IqIntroSection[];
};

export type IqTestIntroResult =
  | { test: IqTestIntro; error?: undefined }
  | { test: null; error: string };

export type CreateIqAttemptResult =
  | { attemptToken: string; nextUrl: string; blockedResultUrl?: undefined; error?: undefined }
  | { attemptToken: null; nextUrl: null; blockedResultUrl?: string; error: string };

export type CreateIqAttemptDemographics = {
  birthDate: string;
  gender: string;
};

export type IqPhaseOption = {
  id: number;
  key: string;
  text: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  position: number;
};

export type IqPhaseQuestion = {
  id: number;
  sectionId: number;
  sectionKey: string;
  sectionTitle: string;
  questionText: string | null;
  answerPromptText: string | null;
  stimulusText: string | null;
  format: string;
  imageUrl: string | null;
  difficultyLevel: number;
  weight: number;
  displayTimeSeconds: number | null;
  timeLimitSeconds: number | null;
  position: number;
  overlay: {
    answersImageUrl: string;
    answerCount: number;
    gridColumns: number;
    gridRows: number;
  } | null;
  audio: {
    promptAudioUrl: string;
    maxStimulusPlays: number;
    transitionDelayMs: number;
  } | null;
  options: IqPhaseOption[];
};

export type IqAttemptPhase = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
    testSlug: string;
  };
  phase: "main" | "memory" | "audio" | "speed";
  phaseTimeLimitSeconds: number | null;
  nextUrl: string | null;
  questions: IqPhaseQuestion[];
};

export type IqAttemptPhaseResult =
  | { data: IqAttemptPhase; error?: undefined }
  | { data: null; error: string };

export type SaveIqAttemptAnswerPayload = {
  questionId: number;
  selectedOptionId?: number | null;
  selectedPosition?: number | null;
  responseTimeMs?: number | null;
  displayedAt?: string | null;
};

export type PersistIqAttemptDraftPayload = {
  answers: SaveIqAttemptAnswerPayload[];
};

export type SaveIqAttemptAnswerResult =
  | {
      answer: {
        isCorrect: boolean;
        correctOptionId: number | null;
        correctPosition: number | null;
        pointsEarned: number;
      };
      error?: undefined;
    }
  | { answer: null; error: string };

export type IqMemoryIntro = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  section: {
    id: number;
    key: string;
    title: string;
    description: string | null;
    questionCount: number;
    displayTimeSeconds: number;
    timeLimitSeconds: number | null;
  };
  nextUrl: string;
};

export type IqMemoryIntroResult =
  | { data: IqMemoryIntro; error?: undefined }
  | { data: null; error: string };

export type IqLongMemoryIntro = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  introTitle: string;
  introText: string;
  itemCount: number;
  nextUrl: string;
};

export type IqLongMemoryIntroResult =
  | { data: IqLongMemoryIntro; error?: undefined }
  | { data: null; error: string };

export type IqLongMemoryExposure = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  question: IqPhaseQuestion;
  displayTimeSeconds: number;
  returnToUrl: string;
};

export type IqLongMemoryExposureResult =
  | { data: IqLongMemoryExposure; error?: undefined }
  | { data: null; error: string };

export type IqLongMemoryAnswer = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  question: IqPhaseQuestion;
  timeLimitSeconds: number | null;
  returnToUrl: string;
};

export type IqLongMemoryAnswerResult =
  | { data: IqLongMemoryAnswer; error?: undefined }
  | { data: null; error: string };

export type IqSpeedIntro = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  section: {
    id: number;
    key: string;
    title: string;
    description: string | null;
    questionCount: number;
    totalTimeLimitSeconds: number;
    timeLimitSeconds: number | null;
  };
  nextUrl: string;
};

export type IqSpeedIntroResult =
  | { data: IqSpeedIntro; error?: undefined }
  | { data: null; error: string };

export type IqAudioIntro = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  section: {
    id: number;
    key: string;
    title: string;
    description: string | null;
    questionCount: number;
    maxStimulusPlays: number;
    timeLimitSeconds: number | null;
    previewAudioUrl: string | null;
  };
  nextUrl: string;
};

export type IqAudioIntroResult =
  | { data: IqAudioIntro; error?: undefined }
  | { data: null; error: string };

export type CompleteIqAttemptResult =
  | {
      completion: {
        attemptToken: string;
        userAttached: boolean;
        redirectUrl: string | null;
        guestResultReady: boolean;
      };
      error?: undefined;
    }
  | { completion: null; error: string };

export type CleanupAbandonedIqAttemptsResult =
  | {
      deletedAnswers: number;
      deletedAttempts: number;
      olderThanHours: number;
      statuses: string[];
      error?: undefined;
    }
  | { deletedAnswers: 0; deletedAttempts: 0; olderThanHours: number; statuses: string[]; error: string };

export type CompletedIqAttemptLookup =
  | { attemptToken: string; resultUrl: string; error?: undefined }
  | { attemptToken: null; resultUrl: null; error?: string };

export type IqResult = {
  attemptToken: string;
  testTitle: string;
  testSlug: string;
  status: string;
  userId: number | null;
  startedAt: Date;
  completedAt: Date | null;
  totalQuestions: number;
  answeredQuestions: number;
  rawScore: number;
  weightedScore: number;
  estimatedIqScore: number | null;
  speedScore: number | null;
  memoryScore: number | null;
  verbalScore: number | null;
  logicScore: number | null;
  quantitativeScore: number | null;
  audioMemoryScore: number | null;
  longMemoryScore: number | null;
  spatialScore: number | null;
  averageResponseTimeMs: number | null;
  sectionBreakdown: IqResultSectionBreakdown[];
};

export type IqResultResult =
  | { result: IqResult; error?: undefined }
  | { result: null; error: "not-found" | "unattached" | "forbidden" | "load-error" };

export type IqResultSectionBreakdown = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
};

export type IqSondageReviewQuestion = {
  sectionKey: string;
  sectionTitle: string;
  questionKey: string;
  questionText: string | null;
  answerPromptText: string | null;
  stimulusText: string | null;
  format: string;
  imageUrl: string | null;
  answersImageUrl: string | null;
  promptAudioUrl: string | null;
  selectedOptionKey: string | null;
  selectedOptionText: string | null;
  correctOptionKey: string | null;
  correctOptionText: string | null;
  selectedPosition: number | null;
  correctPosition: number | null;
  isCorrect: boolean;
  responseTimeMs: number | null;
  options: Array<{
    key: string;
    text: string | null;
    position: number;
    audioUrl: string | null;
  }>;
};

export type IqSondageReviewSection = {
  key: string;
  label: string;
  questions: IqSondageReviewQuestion[];
};

export type IqSondageReview = {
  email: string;
  userPseudo: string | null;
  attemptToken: string;
  sections: IqSondageReviewSection[];
};

export type IqSondageReviewResult =
  | { review: IqSondageReview; error?: undefined }
  | { review: null; error: "not-found" | "load-error" };

type IqTestRow = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  total_time_limit_seconds: number | null;
  sequence_definition: string | null;
  question_bank_test_id: number | null;
};

export type IqTestLaunchItem = {
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
};

type IqSectionRow = {
  id: number;
  section_key: string;
  title: string;
  description: string | null;
  time_limit_seconds: number | null;
  question_count: number;
};

type CountRow = {
  count: number;
};

type IqAttemptRow = {
  id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
  test_slug: string;
};

type IqQuestionRow = {
  id: number;
  question_key: string;
  section_id: number;
  section_key: string;
  section_title: string;
  question_text: string | null;
  answer_prompt_text: string | null;
  stimulus_text: string | null;
  question_format: string;
  question_image_url: string | null;
  difficulty_level: number;
  weight: string | number;
  time_limit_seconds: number | null;
  display_time_seconds: number | null;
  section_display_time_seconds: number | null;
  section_time_limit_seconds: number | null;
  position: number;
  answers_image_url: string | null;
  answer_count: string | number | null;
  grid_columns: number | null;
  grid_rows: number | null;
  prompt_audio_url: string | null;
  max_stimulus_plays: number | null;
  transition_delay_ms: number | null;
};

type IqOptionRow = {
  id: number;
  question_id: number;
  option_key: string;
  option_text: string | null;
  option_image_url: string | null;
  position: number;
};

type IqAnswerCheckRow = {
  attempt_id: number;
  test_id: number;
  section_id: number;
  section_key: string;
  user_id: number | null;
  question_id: number;
  question_key: string;
  difficulty_level: number;
  weight: string | number;
  question_format: string;
  selected_option_id: number | null;
  is_correct: number | null;
  correct_option_id: number | null;
  selected_position: number | null;
  correct_position: number | null;
};

type IqExistingAnswerRow = {
  is_correct: number;
  correct_option_id: number | null;
  correct_position: number | null;
  points_earned: string | number;
};

type PreparedIqAnswerRow = IqAnswerCheckRow & {
  overlay_correct_position: number | null;
  overlay_answer_count: string | number | null;
  correct_position: number | null;
};

type PreparedIqAnswer = {
  answerData: PreparedIqAnswerRow;
  isCorrect: boolean;
  pointsEarned: number;
  responseTimeMs: number | null;
  safeDisplayedAt: string | null;
};

const NOT_PRESENTED_RESPONSE_TIME_MS = 123456;

type IqMemoryIntroRow = {
  attempt_id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
  section_id: number;
  section_key: string;
  section_title: string;
  section_description: string | null;
  display_time_seconds: number | null;
  time_limit_seconds: number | null;
  question_count: number;
};

type IqAudioIntroRow = {
  attempt_id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
  section_id: number;
  section_key: string;
  section_title: string;
  section_description: string | null;
  question_count: number;
  max_stimulus_plays: number | null;
};

type IqLongMemoryRouteRow = {
  attempt_id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
};

type IqSpeedIntroRow = {
  attempt_id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
  section_id: number;
  section_key: string;
  section_title: string;
  section_description: string | null;
  time_limit_seconds: number | null;
  question_count: number;
};

type IqResultRow = {
  id: number;
  attempt_token: string;
  test_id: number;
  test_title: string;
  test_slug: string;
  status: string;
  user_id: number | null;
  started_at: Date;
  completed_at: Date | null;
  total_questions: number;
  answered_questions: number;
  raw_score: string | number;
  weighted_score: string | number;
  estimated_iq_score: string | number | null;
  speed_score: string | number | null;
  memory_score: string | number | null;
  verbal_score: string | number | null;
  logic_score: string | number | null;
  quantitative_score: string | number | null;
  audio_memory_score: string | number | null;
  long_memory_score: string | number | null;
  spatial_score: string | number | null;
  average_response_time_ms: number | null;
};

type IqSondageReviewAttemptRow = {
  id: number;
  attempt_token: string;
  email: string;
  pseudo: string | null;
};

type IqSondageReviewRow = {
  section_key: string;
  section_title: string;
  question_key: string;
  question_text: string | null;
  answer_prompt_text: string | null;
  stimulus_text: string | null;
  question_format: string;
  question_image_url: string | null;
  answers_image_url: string | null;
  prompt_audio_url: string | null;
  selected_option_key: string | null;
  selected_option_text: string | null;
  correct_option_key: string | null;
  correct_option_text: string | null;
  selected_position: number | null;
  correct_position: number | null;
  is_correct: number;
  response_time_ms: number | null;
  question_id: number;
};

type IqSondageReviewOptionRow = {
  question_id: number;
  option_key: string;
  option_text: string | null;
  position: number;
  option_image_url: string | null;
};

type IqComputedScoreRow = {
  answered_questions: number;
  raw_score: string | number;
  average_response_time_ms: number | null;
  speed_score: string | number;
  memory_score: string | number;
  verbal_score: string | number;
  logic_score: string | number;
  quantitative_score: string | number;
  audio_memory_score: string | number;
  long_memory_score: string | number;
  spatial_score: string | number;
};

type IqSectionBreakdownRow = {
  section_key: string;
  section_title: string;
};

type TestSequenceQuestionChoice = {
  questionKey: string;
  weight: number;
};

type TestSequenceLongMemoryItem = {
  questionKey: string;
  displayTimeSeconds: number;
  timeLimitSeconds: number;
  minDelaySeconds: number;
};

type TestSequenceLongMemoryConfig = {
  enabled: boolean;
  introTitle?: string;
  introText?: string;
  flushPendingBeforeSpeed?: boolean;
  items: TestSequenceLongMemoryItem[];
};

type TestSequenceQuestionStep =
  | {
      type: "question";
      questionKey: string;
      timeLimitSeconds?: number;
    }
  | {
      type: "question";
      choices: TestSequenceQuestionChoice[];
      timeLimitSeconds?: number;
    };

type ResolvedTestSequenceQuestionStep = {
  type: "question";
  questionKey: string;
  timeLimitSeconds?: number;
};

type TestSequenceMemoryItem =
  | {
      questionKey: string;
    }
  | {
      choices: TestSequenceQuestionChoice[];
    };

type TestSequenceMemoryStep = {
  type: "memory";
  displayTimeSeconds?: number;
  timeLimitSeconds?: number;
  items: TestSequenceMemoryItem[];
};

type ResolvedTestSequenceMemoryStep = {
  type: "memory";
  items: Array<{
    questionKey: string;
    displayTimeSeconds?: number | null;
    timeLimitSeconds?: number | null;
  }>;
};

type TestSequenceSpeedStep = {
  type: "speed";
  questionKeys?: string[];
  totalTimeLimitSeconds?: number;
  timeLimitSeconds?: number;
};

type TestSequenceAudioMemoryStep = {
  type: "audio_memory";
  questionKeys?: string[];
  timeLimitSeconds?: number;
};

type TestSequenceSpecialStep = TestSequenceMemoryStep | TestSequenceAudioMemoryStep | TestSequenceSpeedStep;

type TestSequenceStep = TestSequenceQuestionStep | TestSequenceSpecialStep;
type ResolvedTestSequenceStep = ResolvedTestSequenceQuestionStep | ResolvedTestSequenceMemoryStep | TestSequenceAudioMemoryStep | TestSequenceSpeedStep;

type TestSequenceDefinition = {
  version: number;
  longMemory?: TestSequenceLongMemoryConfig;
  steps: TestSequenceStep[];
};

type ResolvedTestSequenceDefinition = {
  version: number;
  longMemory?: TestSequenceLongMemoryConfig;
  steps: ResolvedTestSequenceStep[];
};

type LongMemoryAttemptState = {
  enabled: boolean;
  introTitle: string;
  introText: string;
  flushPendingBeforeSpeed: boolean;
  items: TestSequenceLongMemoryItem[];
  currentIndex: number;
  activeQuestionKey: string | null;
  shownAt: string | null;
  questionsAnsweredSinceShown: number;
  afterCurrentAnswerAction: "advance" | "return" | "complete";
  status: "pending_intro" | "awaiting_exposure" | "waiting_delay" | "awaiting_answer" | "completed";
};

type SequenceEntry =
  | {
      type: "block";
      blockIndex: number;
      questionKeys: string[];
      questions: Array<{ questionKey: string; displayTimeSeconds: number | null; timeLimitSeconds: number | null }>;
    }
  | {
      type: "memory";
      questionKeys: string[] | null;
      questions: Array<{ questionKey: string; displayTimeSeconds: number | null; timeLimitSeconds: number | null }> | null;
    }
  | { type: "audio_memory"; questionKeys: string[] | null; timeLimitSeconds: number | null }
  | { type: "speed"; questionKeys: string[] | null; totalTimeLimitSeconds: number | null; timeLimitSeconds: number | null };

type SequencePlan = {
  blocks: Array<{
    blockIndex: number;
    questionKeys: string[];
    questions: Array<{ questionKey: string; displayTimeSeconds: number | null; timeLimitSeconds: number | null }>;
  }>;
  entries: SequenceEntry[];
  memoryEntryIndex: number | null;
  audioMemoryEntryIndex: number | null;
  speedEntryIndex: number | null;
};

type SequenceQuestionLookupRow = {
  question_key: string;
  section_key: string;
};

type SequenceResolvedQuestions = {
  questionSectionByKey: Map<string, string>;
  specialQuestionKeysByType: {
    memory: string[] | null;
    audio_memory: string[] | null;
    speed: string[] | null;
  };
};

function normalizeOverlayNumber(value: string | number | null | undefined, fallback: number) {
  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.min(100, Math.round(value)));
}

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const MAIN_SECTION_KEYS = ["verbal", "logic", "spatial"];
const LATER_SECTION_KEYS = ["memory", "audio_memory", "speed"];
const ABANDONED_ATTEMPT_CLEANUP_HOURS = 48;
const CLEANUP_ABANDONED_ATTEMPT_STATUSES = ["started", "abandoned"];
function mapSection(row: IqSectionRow): IqIntroSection {
  return {
    id: row.id,
    key: row.section_key,
    title: row.title,
    description: row.description,
    timeLimitSeconds: row.time_limit_seconds,
    questionCount: row.question_count,
  };
}

function parseTestSequenceDefinition(sequenceDefinition: string | null | undefined): TestSequenceDefinition {
  if (!sequenceDefinition) {
    throw new Error("Aucune sequence n'est definie pour ce test.");
  }

  const parsed = JSON.parse(sequenceDefinition) as Partial<TestSequenceDefinition>;
  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const steps: TestSequenceStep[] = [];
  let memoryCount = 0;
  let audioMemoryCount = 0;
  let speedCount = 0;
  let longMemory: TestSequenceLongMemoryConfig | undefined;

  if (parsed.longMemory !== undefined) {
    const rawLongMemory = parsed.longMemory;

    if (!rawLongMemory || typeof rawLongMemory !== "object") {
      throw new Error("La definition longMemory est invalide.");
    }

    const enabled = Boolean((rawLongMemory as { enabled?: unknown }).enabled);
    const introTitle =
      typeof (rawLongMemory as { introTitle?: unknown }).introTitle === "string"
        ? (rawLongMemory as { introTitle: string }).introTitle.trim()
        : "";
    const introText =
      typeof (rawLongMemory as { introText?: unknown }).introText === "string"
        ? (rawLongMemory as { introText: string }).introText.trim()
        : "";
    const flushPendingBeforeSpeed =
      typeof (rawLongMemory as { flushPendingBeforeSpeed?: unknown }).flushPendingBeforeSpeed === "boolean"
        ? (rawLongMemory as { flushPendingBeforeSpeed: boolean }).flushPendingBeforeSpeed
        : true;
    const rawItems = Array.isArray((rawLongMemory as { items?: unknown }).items) ? (rawLongMemory as { items: unknown[] }).items : [];

    if (enabled && rawItems.length === 0) {
      throw new Error("longMemory active doit contenir au moins un item.");
    }

    const items = rawItems.map((item) => {
      if (!item || typeof item !== "object") {
        throw new Error("Un item longMemory est invalide.");
      }

      const questionKey = typeof (item as { questionKey?: unknown }).questionKey === "string" ? (item as { questionKey: string }).questionKey.trim() : "";
      const displayTimeSeconds =
        typeof (item as { displayTimeSeconds?: unknown }).displayTimeSeconds === "number"
          ? Number((item as { displayTimeSeconds: number }).displayTimeSeconds)
          : NaN;
      const timeLimitSeconds =
        typeof (item as { timeLimitSeconds?: unknown }).timeLimitSeconds === "number"
          ? Number((item as { timeLimitSeconds: number }).timeLimitSeconds)
          : NaN;
      const minDelaySeconds =
        typeof (item as { minDelaySeconds?: unknown }).minDelaySeconds === "number"
          ? Number((item as { minDelaySeconds: number }).minDelaySeconds)
          : NaN;

      if (!questionKey) {
        throw new Error("Chaque item longMemory doit definir questionKey.");
      }

      if (!Number.isInteger(displayTimeSeconds) || displayTimeSeconds <= 0) {
        throw new Error("Chaque item longMemory doit definir displayTimeSeconds comme entier positif.");
      }

      if (!Number.isInteger(timeLimitSeconds) || timeLimitSeconds <= 0) {
        throw new Error("Chaque item longMemory doit definir timeLimitSeconds comme entier positif.");
      }

      if (!Number.isInteger(minDelaySeconds) || minDelaySeconds <= 0) {
        throw new Error("Chaque item longMemory doit definir minDelaySeconds comme entier positif.");
      }

      return {
        questionKey,
        displayTimeSeconds,
        timeLimitSeconds,
        minDelaySeconds,
      };
    });
    const uniqueLongMemoryKeys = new Set(items.map((item) => item.questionKey));

    if (uniqueLongMemoryKeys.size !== items.length) {
      throw new Error("Les questionKey longMemory doivent etre uniques.");
    }

    longMemory = {
      enabled,
      introTitle: introTitle || undefined,
      introText: introText || undefined,
      flushPendingBeforeSpeed,
      items,
    };
  }

  for (const rawStep of rawSteps) {
    if (!rawStep || typeof rawStep !== "object") {
      throw new Error("Etape de sequence invalide.");
    }

    if ((rawStep as { type?: unknown }).type === "question") {
      const questionKey = typeof (rawStep as { questionKey?: unknown }).questionKey === "string" ? (rawStep as { questionKey: string }).questionKey.trim() : "";
      const rawChoices = Array.isArray((rawStep as { choices?: unknown }).choices) ? (rawStep as { choices: unknown[] }).choices : null;
      const timeLimitSeconds = parseOptionalPositiveInteger(
        (rawStep as { timeLimitSeconds?: unknown }).timeLimitSeconds,
        "Une etape question avec timeLimitSeconds doit definir un entier positif."
      );

      if (questionKey && rawChoices) {
        throw new Error("Une etape question ne peut pas definir questionKey et choices en meme temps.");
      }

      if (questionKey) {
        steps.push({ type: "question", questionKey, timeLimitSeconds });
        continue;
      }

      if (!rawChoices) {
        throw new Error("Une etape question doit definir questionKey ou choices.");
      }

      steps.push({ type: "question", choices: parseWeightedChoices(rawChoices, "une etape question avec choices"), timeLimitSeconds });
      continue;
    }

    if ((rawStep as { type?: unknown }).type === "memory") {
      memoryCount += 1;
      const rawItems = Array.isArray((rawStep as { items?: unknown }).items) ? (rawStep as { items: unknown[] }).items : null;
      const displayTimeSeconds = parseOptionalPositiveInteger(
        (rawStep as { displayTimeSeconds?: unknown }).displayTimeSeconds,
        "Une etape memory avec displayTimeSeconds doit definir un entier positif."
      );
      const timeLimitSeconds = parseOptionalPositiveInteger(
        (rawStep as { timeLimitSeconds?: unknown }).timeLimitSeconds,
        "Une etape memory avec timeLimitSeconds doit definir un entier positif."
      );

      if (!rawItems || rawItems.length === 0) {
        throw new Error("Une etape memory doit definir items.");
      }

      const items = rawItems.map((item) => {
        if (!item || typeof item !== "object") {
          throw new Error("Un item memory est invalide.");
        }

        const questionKey = typeof (item as { questionKey?: unknown }).questionKey === "string" ? (item as { questionKey: string }).questionKey.trim() : "";
        const rawChoices = Array.isArray((item as { choices?: unknown }).choices) ? (item as { choices: unknown[] }).choices : null;

        if (questionKey && rawChoices) {
          throw new Error("Un item memory ne peut pas definir questionKey et choices en meme temps.");
        }

        if (questionKey) {
          return { questionKey } satisfies TestSequenceMemoryItem;
        }

        if (!rawChoices) {
          throw new Error("Un item memory doit definir questionKey ou choices.");
        }

        return {
          choices: parseWeightedChoices(rawChoices, "item memory avec choices"),
        } satisfies TestSequenceMemoryItem;
      });

      steps.push({ type: "memory", items, displayTimeSeconds, timeLimitSeconds });
      continue;
    }

    if (
      (rawStep as { type?: unknown }).type === "audioMemory" ||
      (rawStep as { type?: unknown }).type === "audio_memory" ||
      (rawStep as { type?: unknown }).type === "audio"
    ) {
      audioMemoryCount += 1;
      const questionKeys = Array.isArray((rawStep as { questionKeys?: unknown }).questionKeys)
        ? (rawStep as { questionKeys: unknown[] }).questionKeys
            .filter((questionKey): questionKey is string => typeof questionKey === "string")
            .map((questionKey) => questionKey.trim())
            .filter(Boolean)
        : undefined;

      if (Array.isArray((rawStep as { questionKeys?: unknown }).questionKeys) && (!questionKeys || questionKeys.length === 0)) {
        throw new Error("Une etape audioMemory avec questionKeys doit contenir au moins une cle.");
      }

      const timeLimitSecondsValue = (rawStep as { timeLimitSeconds?: unknown }).timeLimitSeconds;
      const timeLimitSeconds =
        typeof timeLimitSecondsValue === "number" && Number.isInteger(timeLimitSecondsValue) && timeLimitSecondsValue > 0
          ? timeLimitSecondsValue
          : undefined;

      if (timeLimitSecondsValue !== undefined && timeLimitSeconds === undefined) {
        throw new Error("Une etape audioMemory avec timeLimitSeconds doit definir un entier positif.");
      }

      steps.push({ type: "audio_memory", questionKeys, timeLimitSeconds });
      continue;
    }

    if ((rawStep as { type?: unknown }).type === "speed") {
      speedCount += 1;
      const questionKeys = Array.isArray((rawStep as { questionKeys?: unknown }).questionKeys)
        ? (rawStep as { questionKeys: unknown[] }).questionKeys
            .filter((questionKey): questionKey is string => typeof questionKey === "string")
            .map((questionKey) => questionKey.trim())
            .filter(Boolean)
        : undefined;

      if (Array.isArray((rawStep as { questionKeys?: unknown }).questionKeys) && (!questionKeys || questionKeys.length === 0)) {
        throw new Error("Une etape speed avec questionKeys doit contenir au moins une cle.");
      }

      const totalTimeLimitSecondsValue = (rawStep as { totalTimeLimitSeconds?: unknown }).totalTimeLimitSeconds;
      const totalTimeLimitSeconds =
        typeof totalTimeLimitSecondsValue === "number" && Number.isInteger(totalTimeLimitSecondsValue) && totalTimeLimitSecondsValue > 0
          ? totalTimeLimitSecondsValue
          : undefined;

      if (totalTimeLimitSecondsValue !== undefined && totalTimeLimitSeconds === undefined) {
        throw new Error("Une etape speed avec totalTimeLimitSeconds doit definir un entier positif.");
      }

      const timeLimitSecondsValue = (rawStep as { timeLimitSeconds?: unknown }).timeLimitSeconds;
      const timeLimitSeconds =
        typeof timeLimitSecondsValue === "number" && Number.isInteger(timeLimitSecondsValue) && timeLimitSecondsValue >= 0
          ? timeLimitSecondsValue
          : undefined;

      if (timeLimitSecondsValue !== undefined && timeLimitSeconds === undefined) {
        throw new Error("Une etape speed avec timeLimitSeconds doit definir un entier positif ou zero.");
      }

      steps.push({ type: "speed", questionKeys, totalTimeLimitSeconds, timeLimitSeconds });
      continue;
    }

    throw new Error("Type d'etape de sequence invalide.");
  }

  if (memoryCount > 1) {
    throw new Error("La sequence ne peut contenir qu'une seule etape memory.");
  }

  if (audioMemoryCount > 1) {
    throw new Error("La sequence ne peut contenir qu'une seule etape audioMemory.");
  }

  if (speedCount > 1) {
    throw new Error("La sequence ne peut contenir qu'une seule etape speed.");
  }

  if (steps.length === 0) {
    throw new Error("La sequence du test ne contient aucune etape.");
  }

  return {
    version: Number(parsed.version ?? 1),
    longMemory,
    steps,
  };
}

function parseResolvedTestSequenceDefinition(sequenceDefinition: string | null | undefined): ResolvedTestSequenceDefinition {
  if (!sequenceDefinition) {
    throw new Error("Aucune sequence resolue n'est definie pour cette tentative.");
  }

  const parsed = JSON.parse(sequenceDefinition) as Partial<ResolvedTestSequenceDefinition> & {
    steps?: Array<Record<string, unknown>>;
  };

  const normalizedSteps = Array.isArray(parsed.steps)
    ? parsed.steps.map((step) => {
        if (!step || typeof step !== "object" || step.type !== "memory") {
          return step;
        }

        const legacyQuestionKeys = Array.isArray((step as unknown as { questionKeys?: unknown }).questionKeys)
          ? (step as unknown as { questionKeys: unknown[] }).questionKeys
          : null;

        if (legacyQuestionKeys) {
          return {
            type: "memory",
            items: legacyQuestionKeys
              .filter((questionKey): questionKey is string => typeof questionKey === "string" && questionKey.trim().length > 0)
              .map((questionKey) => ({ questionKey: questionKey.trim() })),
          };
        }

        return step;
      })
    : [];

  return resolveTestSequenceDefinition(
    parseTestSequenceDefinition(
      JSON.stringify({
        ...parsed,
        steps: normalizedSteps,
      })
    )
  );
}

function getQuestionStepReferenceKey(step: TestSequenceQuestionStep | ResolvedTestSequenceQuestionStep) {
  return "questionKey" in step ? step.questionKey : step.choices[0].questionKey;
}

function getQuestionStepTimeLimitSeconds(step: TestSequenceQuestionStep | ResolvedTestSequenceQuestionStep) {
  return step.timeLimitSeconds ?? null;
}

function pickWeightedQuestionKey(choices: TestSequenceQuestionChoice[]) {
  const randomValue = Math.random() * 100;
  let cumulativeWeight = 0;

  for (const choice of choices) {
    cumulativeWeight += choice.weight;

    if (randomValue < cumulativeWeight) {
      return choice.questionKey;
    }
  }

  return choices[choices.length - 1].questionKey;
}

function parseWeightedChoices(rawChoices: unknown[], errorContext: string) {
  if (rawChoices.length < 2 || rawChoices.length > 3) {
    throw new Error(`${errorContext} doit definir entre 2 et 3 possibilites.`);
  }

  const choices = rawChoices.map((choice) => {
    if (!choice || typeof choice !== "object") {
      throw new Error(`Une option de ${errorContext} est invalide.`);
    }

    const choiceQuestionKey = typeof (choice as { questionKey?: unknown }).questionKey === "string" ? (choice as { questionKey: string }).questionKey.trim() : "";
    const choiceWeight = typeof (choice as { weight?: unknown }).weight === "number" ? (choice as { weight: number }).weight : NaN;

    if (!choiceQuestionKey) {
      throw new Error(`Chaque choix de ${errorContext} doit definir questionKey.`);
    }

    if (!Number.isInteger(choiceWeight) || choiceWeight <= 0) {
      throw new Error(`Chaque choix de ${errorContext} doit definir un poids entier positif.`);
    }

    return {
      questionKey: choiceQuestionKey,
      weight: choiceWeight,
    };
  });
  const uniqueChoiceKeys = new Set(choices.map((choice) => choice.questionKey));

  if (uniqueChoiceKeys.size !== choices.length) {
    throw new Error(`Les questionKey d'un ${errorContext} doivent etre uniques.`);
  }

  const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);

  if (totalWeight !== 100) {
    throw new Error(`La somme des poids d'un ${errorContext} doit etre egale a 100.`);
  }

  return choices;
}

function parseOptionalPositiveInteger(value: unknown, errorMessage: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  throw new Error(errorMessage);
}

function resolveTestSequenceDefinition(sequence: TestSequenceDefinition): ResolvedTestSequenceDefinition {
  return {
    version: sequence.version,
    longMemory: sequence.longMemory,
    steps: sequence.steps.map((step) => {
      if (step.type !== "question") {
        if (step.type === "memory") {
          return {
            type: "memory",
            items: step.items.map((item) => ({
              questionKey: "questionKey" in item ? item.questionKey : pickWeightedQuestionKey(item.choices),
              displayTimeSeconds: step.displayTimeSeconds ?? null,
              timeLimitSeconds: step.timeLimitSeconds ?? null,
            })),
          };
        }

        return step;
      }

      if ("questionKey" in step) {
        return {
          ...step,
          timeLimitSeconds: step.timeLimitSeconds ?? undefined,
        };
      }

      return {
        type: "question",
        questionKey: pickWeightedQuestionKey(step.choices),
        timeLimitSeconds: step.timeLimitSeconds ?? undefined,
      };
    }),
  };
}

async function loadTestSequenceDefinitionByTestId(connection: mysql.Connection, testId: number) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT sequence_definition
     FROM iq_tests
     WHERE id = ?
     LIMIT 1`,
    [testId]
  );
  const row = (rows as Array<{ sequence_definition: string | null }>)[0];

  if (!row) {
    throw new Error("Test introuvable pour charger la sequence.");
  }

  return parseTestSequenceDefinition(row.sequence_definition);
}

async function loadResolvedAttemptSequenceDefinitionByAttemptId(connection: mysql.Connection, attemptId: number) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT resolved_sequence_definition, test_id
     FROM iq_attempts
     WHERE id = ?
     LIMIT 1`,
    [attemptId]
  );
  const row = (rows as Array<{ resolved_sequence_definition: string | null; test_id: number }>)[0];

  if (!row) {
    throw new Error("Tentative introuvable pour charger la sequence resolue.");
  }

  if (row.resolved_sequence_definition) {
    return parseResolvedTestSequenceDefinition(row.resolved_sequence_definition);
  }

  return resolveTestSequenceDefinition(await loadTestSequenceDefinitionByTestId(connection, row.test_id));
}

async function loadQuestionBankTestIdByTestId(connection: mysql.Connection, testId: number) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT id, question_bank_test_id
     FROM iq_tests
     WHERE id = ?
     LIMIT 1`,
    [testId]
  );
  const row = (rows as Array<{ id: number; question_bank_test_id: number | null }>)[0];

  if (!row) {
    throw new Error("Test introuvable pour charger la banque de questions.");
  }

  return row.question_bank_test_id ?? row.id;
}

function createInitialLongMemoryState(sequence: ResolvedTestSequenceDefinition): LongMemoryAttemptState | null {
  if (!sequence.longMemory?.enabled || sequence.longMemory.items.length === 0) {
    return null;
  }

  return {
    enabled: true,
    introTitle: sequence.longMemory.introTitle || "Memoire longue",
    introText: sequence.longMemory.introText || "Nous allons en particulier tester votre memoire longue.",
    flushPendingBeforeSpeed: sequence.longMemory.flushPendingBeforeSpeed ?? true,
    items: sequence.longMemory.items,
    currentIndex: 0,
    activeQuestionKey: sequence.longMemory.items[0].questionKey,
    shownAt: null,
    questionsAnsweredSinceShown: 0,
    afterCurrentAnswerAction: "advance",
    status: "pending_intro",
  };
}

function getEnabledLongMemoryItems(sequence: TestSequenceDefinition | ResolvedTestSequenceDefinition) {
  return sequence.longMemory?.enabled ? sequence.longMemory.items : [];
}

async function validateLongMemoryItems(
  connection: mysql.Connection,
  testId: number,
  sequence: TestSequenceDefinition | ResolvedTestSequenceDefinition
) {
  const items = getEnabledLongMemoryItems(sequence);

  if (items.length === 0) {
    return;
  }

  const questionKeys = items.map((item) => item.questionKey);
  const placeholders = questionKeys.map(() => "?").join(", ");
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT q.question_key, s.section_key
     FROM iq_questions q
     INNER JOIN iq_sections s ON s.id = q.section_id
     WHERE q.test_id = ?
       AND q.is_active = 1
       AND s.is_active = 1
       AND q.question_key IN (${placeholders})`,
    [testId, ...questionKeys]
  );
  const questionSectionByKey = new Map<string, string>();

  for (const row of rows as SequenceQuestionLookupRow[]) {
    questionSectionByKey.set(row.question_key, row.section_key);
  }

  const missingQuestionKeys = questionKeys.filter((questionKey) => !questionSectionByKey.has(questionKey));

  if (missingQuestionKeys.length > 0) {
    throw new Error(`Question(s) long-memory introuvable(s) : ${missingQuestionKeys.join(", ")}`);
  }

  const invalidLongMemoryKeys = questionKeys.filter((questionKey) => questionSectionByKey.get(questionKey) !== "long_memory");

  if (invalidLongMemoryKeys.length > 0) {
    throw new Error(`Les questionKey longMemory doivent appartenir a la section long_memory : ${invalidLongMemoryKeys.join(", ")}`);
  }
}

async function loadLongMemoryStateByAttemptId(connection: mysql.Connection, attemptId: number) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT long_memory_state
     FROM iq_attempts
     WHERE id = ?
     LIMIT 1`,
    [attemptId]
  );
  const row = (rows as Array<{ long_memory_state: string | null }>)[0];

  if (!row?.long_memory_state) {
    return null;
  }

  return JSON.parse(row.long_memory_state) as LongMemoryAttemptState;
}

async function updateLongMemoryStateByAttemptId(connection: mysql.Connection, attemptId: number, state: LongMemoryAttemptState | null) {
  await connection.execute(
    `UPDATE iq_attempts
     SET long_memory_state = ?, updated_at = NOW()
     WHERE id = ?`,
    [state ? JSON.stringify(state) : null, attemptId]
  );
}

async function markLongMemoryQuestionProgress(
  connection: mysql.Connection,
  attemptId: number,
  sectionKey: string
) {
  if (sectionKey === "long_memory") {
    return;
  }

  const state = await loadLongMemoryStateByAttemptId(connection, attemptId);

  if (!state?.enabled || state.status !== "waiting_delay" || !state.shownAt) {
    return;
  }

  state.questionsAnsweredSinceShown += 1;
  await updateLongMemoryStateByAttemptId(connection, attemptId, state);
}

function buildLongMemoryExposureUrl(token: string, returnToUrl: string) {
  return `/iq/attempt/${token}/long-memory/exposure?returnTo=${encodeURIComponent(returnToUrl)}`;
}

function buildLongMemoryAnswerUrl(token: string, returnToUrl: string) {
  return `/iq/attempt/${token}/long-memory/answer?returnTo=${encodeURIComponent(returnToUrl)}`;
}

function shouldLongMemoryInterrupt(state: LongMemoryAttemptState, force = false) {
  if (!state.enabled || state.status !== "waiting_delay" || !state.shownAt) {
    return false;
  }

  const currentItem = state.items[state.currentIndex];

  if (!currentItem) {
    return false;
  }

  if (force) {
    return true;
  }

  if (state.questionsAnsweredSinceShown < 1) {
    return false;
  }

  return Date.now() >= new Date(state.shownAt).getTime() + currentItem.minDelaySeconds * 1000;
}

function buildSequencePlan(sequence: TestSequenceDefinition | ResolvedTestSequenceDefinition): SequencePlan {
  const blocks: SequencePlan["blocks"] = [];
  const entries: SequenceEntry[] = [];
  let questionBuffer: Array<{ questionKey: string; displayTimeSeconds: number | null; timeLimitSeconds: number | null }> = [];
  let blockIndex = 0;

  const flushQuestionBuffer = () => {
    if (questionBuffer.length === 0) return;

    const currentBlock = {
      blockIndex,
      questionKeys: questionBuffer.map((question) => question.questionKey),
      questions: questionBuffer,
    };
    blocks.push(currentBlock);
    entries.push({
      type: "block",
      blockIndex,
      questionKeys: currentBlock.questionKeys,
      questions: questionBuffer,
    });
    questionBuffer = [];
    blockIndex += 1;
  };

  for (const step of sequence.steps) {
    if (step.type === "question") {
      questionBuffer.push({
        questionKey: getQuestionStepReferenceKey(step),
        displayTimeSeconds: null,
        timeLimitSeconds: getQuestionStepTimeLimitSeconds(step),
      });
      continue;
    }

    flushQuestionBuffer();
    if (step.type === "memory") {
      const stepDisplayTimeSeconds = "displayTimeSeconds" in step ? step.displayTimeSeconds ?? null : null;
      const stepTimeLimitSeconds = "timeLimitSeconds" in step ? step.timeLimitSeconds ?? null : null;
      const questions = step.items.map((item) =>
        "questionKey" in item
          ? {
              questionKey: item.questionKey,
              displayTimeSeconds: "displayTimeSeconds" in item ? item.displayTimeSeconds ?? null : stepDisplayTimeSeconds,
              timeLimitSeconds: "timeLimitSeconds" in item ? item.timeLimitSeconds ?? null : stepTimeLimitSeconds,
            }
          : {
              questionKey: pickWeightedQuestionKey(item.choices),
              displayTimeSeconds: stepDisplayTimeSeconds,
              timeLimitSeconds: stepTimeLimitSeconds,
            }
      );

      entries.push({
        type: "memory",
        questionKeys: questions?.map((question) => question.questionKey) ?? null,
        questions,
      });
      continue;
    }

    if (step.type === "audio_memory") {
      entries.push({ type: "audio_memory", questionKeys: step.questionKeys ?? null, timeLimitSeconds: step.timeLimitSeconds ?? null });
      continue;
    }

    entries.push({
      type: "speed",
      questionKeys: step.questionKeys ?? null,
      totalTimeLimitSeconds: step.totalTimeLimitSeconds ?? null,
      timeLimitSeconds: step.timeLimitSeconds ?? null,
    });
  }

  flushQuestionBuffer();

  const memoryEntryIndex = entries.findIndex((entry) => entry.type === "memory");
  const audioMemoryEntryIndex = entries.findIndex((entry) => entry.type === "audio_memory");
  const speedEntryIndex = entries.findIndex((entry) => entry.type === "speed");

  return {
    blocks,
    entries,
    memoryEntryIndex: memoryEntryIndex >= 0 ? memoryEntryIndex : null,
    audioMemoryEntryIndex: audioMemoryEntryIndex >= 0 ? audioMemoryEntryIndex : null,
    speedEntryIndex: speedEntryIndex >= 0 ? speedEntryIndex : null,
  };
}

function getEntryIndexAfterQuestionBlock(plan: SequencePlan, blockIndex: number) {
  return plan.entries.findIndex((entry) => entry.type === "block" && entry.blockIndex === blockIndex) + 1;
}

function getNextUrlForEntry(token: string, plan: SequencePlan, entryIndex: number): string | null {
  const nextEntry = plan.entries[entryIndex];

  if (!nextEntry) {
    return null;
  }

  if (nextEntry.type === "block") {
    return `/iq/attempt/${token}/phase/main?block=${nextEntry.blockIndex}`;
  }

  if (nextEntry.type === "memory") {
    return `/iq/attempt/${token}/memory-intro`;
  }

  if (nextEntry.type === "audio_memory") {
    return `/iq/attempt/${token}/audio-intro`;
  }

  if (nextEntry.type === "speed") {
    return `/iq/attempt/${token}/speed-intro`;
  }

  return null;
}

function getNextUrlAfterQuestionBlock(token: string, plan: SequencePlan, blockIndex: number) {
  return getNextUrlForEntry(token, plan, getEntryIndexAfterQuestionBlock(plan, blockIndex));
}

function getNextUrlAfterSpecial(token: string, plan: SequencePlan, specialType: "memory" | "audio_memory" | "speed") {
  const specialEntryIndex = plan.entries.findIndex((entry) => entry.type === specialType);

  if (specialEntryIndex < 0) {
    return null;
  }

  return getNextUrlForEntry(token, plan, specialEntryIndex + 1);
}

function getChoiceSiblingQuestionKeys(sequence: TestSequenceDefinition, questionKey: string) {
  const siblingKeys = new Set<string>();

  for (const step of sequence.steps) {
    if (step.type === "question" && "choices" in step) {
      const choiceKeys = step.choices.map((choice) => choice.questionKey);

      if (choiceKeys.includes(questionKey)) {
        for (const choiceKey of choiceKeys) {
          if (choiceKey !== questionKey) {
            siblingKeys.add(choiceKey);
          }
        }
      }
      continue;
    }

    if (step.type !== "memory") {
      continue;
    }

    for (const item of step.items) {
      if (!("choices" in item)) {
        continue;
      }

      const choiceKeys = item.choices.map((choice) => choice.questionKey);

      if (choiceKeys.includes(questionKey)) {
        for (const choiceKey of choiceKeys) {
          if (choiceKey !== questionKey) {
            siblingKeys.add(choiceKey);
          }
        }
      }
    }
  }

  return [...siblingKeys];
}

async function resolveSequenceQuestionSections(
  connection: mysql.Connection,
  testId: number,
  plan: SequencePlan
) : Promise<SequenceResolvedQuestions> {
  const allQuestionKeys = [
    ...plan.blocks.flatMap((block) => block.questionKeys),
    ...plan.entries.flatMap((entry) => (entry.type === "block" ? [] : entry.questionKeys ?? [])),
  ];
  const uniqueQuestionKeys = [...new Set(allQuestionKeys)];

  if (uniqueQuestionKeys.length !== allQuestionKeys.length) {
    throw new Error("La sequence du test contient des questionKey dupliquees.");
  }

  if (uniqueQuestionKeys.length === 0) {
    return {
      questionSectionByKey: new Map<string, string>(),
      specialQuestionKeysByType: {
        memory: null,
        audio_memory: null,
        speed: null,
      },
    };
  }

  const placeholders = uniqueQuestionKeys.map(() => "?").join(", ");
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT q.question_key, s.section_key
     FROM iq_questions q
     INNER JOIN iq_sections s ON s.id = q.section_id
     WHERE q.test_id = ?
       AND q.is_active = 1
       AND s.is_active = 1
       AND q.question_key IN (${placeholders})`,
    [testId, ...uniqueQuestionKeys]
  );
  const questionSectionByKey = new Map<string, string>();

  for (const row of rows as SequenceQuestionLookupRow[]) {
    questionSectionByKey.set(row.question_key, row.section_key);
  }

  const missingQuestionKeys = uniqueQuestionKeys.filter((questionKey) => !questionSectionByKey.has(questionKey));

  if (missingQuestionKeys.length > 0) {
    throw new Error(`Question(s) introuvable(s) dans la sequence du test : ${missingQuestionKeys.join(", ")}`);
  }

  const memoryEntry = plan.entries.find((entry): entry is Extract<SequenceEntry, { type: "memory" }> => entry.type === "memory");
  const audioMemoryEntry = plan.entries.find((entry): entry is Extract<SequenceEntry, { type: "audio_memory" }> => entry.type === "audio_memory");
  const speedEntry = plan.entries.find((entry): entry is Extract<SequenceEntry, { type: "speed" }> => entry.type === "speed");

  if (memoryEntry?.questionKeys) {
    const invalidMemoryQuestionKeys = memoryEntry.questionKeys.filter((questionKey) => questionSectionByKey.get(questionKey) !== "memory");

    if (invalidMemoryQuestionKeys.length > 0) {
      throw new Error(`Les questionKey memory doivent appartenir a la section memory : ${invalidMemoryQuestionKeys.join(", ")}`);
    }
  }

  if (speedEntry?.questionKeys) {
    const invalidSpeedQuestionKeys = speedEntry.questionKeys.filter((questionKey) => questionSectionByKey.get(questionKey) !== "speed");

    if (invalidSpeedQuestionKeys.length > 0) {
      throw new Error(`Les questionKey speed doivent appartenir a la section speed : ${invalidSpeedQuestionKeys.join(", ")}`);
    }
  }

  if (audioMemoryEntry?.questionKeys) {
    const invalidAudioQuestionKeys = audioMemoryEntry.questionKeys.filter((questionKey) => questionSectionByKey.get(questionKey) !== "audio_memory");

    if (invalidAudioQuestionKeys.length > 0) {
      throw new Error(`Les questionKey audioMemory doivent appartenir a la section audio_memory : ${invalidAudioQuestionKeys.join(", ")}`);
    }
  }

  return {
    questionSectionByKey,
    specialQuestionKeysByType: {
      memory: memoryEntry?.questionKeys ?? null,
      audio_memory: audioMemoryEntry?.questionKeys ?? null,
      speed: speedEntry?.questionKeys ?? null,
    },
  };
}

function getOrderedSequenceSectionKeys(
  plan: SequencePlan,
  questionSectionByKey: Map<string, string>,
  longMemoryItems?: TestSequenceLongMemoryItem[]
) {
  const orderedSectionKeys: string[] = [];
  const seenSectionKeys = new Set<string>();

  if (longMemoryItems && longMemoryItems.length > 0) {
    seenSectionKeys.add("long_memory");
    orderedSectionKeys.push("long_memory");
  }

  for (const entry of plan.entries) {
    if (entry.type === "block") {
      for (const questionKey of entry.questionKeys) {
        const sectionKey = questionSectionByKey.get(questionKey);

        if (!sectionKey || seenSectionKeys.has(sectionKey)) {
          continue;
        }

        seenSectionKeys.add(sectionKey);
        orderedSectionKeys.push(sectionKey);
      }

      continue;
    }

    if (!seenSectionKeys.has(entry.type)) {
      seenSectionKeys.add(entry.type);
      orderedSectionKeys.push(entry.type);
    }
  }

  return orderedSectionKeys;
}

async function getSequenceQuestionCounts(
  connection: mysql.Connection,
  testId: number,
  plan: SequencePlan,
  longMemoryItems?: TestSequenceLongMemoryItem[]
) {
  const resolvedQuestions = await resolveSequenceQuestionSections(connection, testId, plan);
  const explicitQuestionCount = plan.blocks.reduce((total, block) => total + block.questionKeys.length, 0);
  const longMemoryQuestionCount = longMemoryItems?.length ?? 0;
  const includedSections = [
    plan.memoryEntryIndex !== null ? "memory" : null,
    plan.audioMemoryEntryIndex !== null ? "audio_memory" : null,
    plan.speedEntryIndex !== null ? "speed" : null,
  ].filter((value): value is "memory" | "audio_memory" | "speed" => Boolean(value));

  if (includedSections.length === 0) {
    return {
      totalQuestions: explicitQuestionCount + longMemoryQuestionCount,
      sectionCounts: new Map<string, number>(),
    };
  }

  const placeholders = includedSections.map(() => "?").join(", ");
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT s.section_key, COUNT(q.id) AS question_count
     FROM iq_sections s
     LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
     WHERE s.test_id = ?
       AND s.is_active = 1
       AND s.section_key IN (${placeholders})
     GROUP BY s.section_key`,
    [testId, ...includedSections]
  );
  const sectionCounts = new Map<string, number>();

  for (const row of rows as Array<{ section_key: string; question_count: number }>) {
    sectionCounts.set(row.section_key, Number(row.question_count ?? 0));
  }

  const selectedSpecialQuestionCount = includedSections.reduce((total, sectionKey) => {
    const selectedQuestionKeys = resolvedQuestions.specialQuestionKeysByType[sectionKey];

    if (!selectedQuestionKeys) {
      return total + (sectionCounts.get(sectionKey) ?? 0);
    }

    return total + selectedQuestionKeys.length;
  }, 0);

  return {
    totalQuestions: explicitQuestionCount + selectedSpecialQuestionCount + longMemoryQuestionCount,
    sectionCounts,
  };
}

async function getSequenceSectionMaxScores(
  connection: mysql.Connection,
  testId: number,
  plan: SequencePlan,
  longMemoryItems?: TestSequenceLongMemoryItem[]
) {
  const resolvedQuestions = await resolveSequenceQuestionSections(connection, testId, plan);
  const explicitQuestionKeys = plan.blocks.flatMap((block) => block.questionKeys);
  const includedSpecialSections = [
    plan.memoryEntryIndex !== null ? "memory" : null,
    plan.audioMemoryEntryIndex !== null ? "audio_memory" : null,
    plan.speedEntryIndex !== null ? "speed" : null,
  ].filter((value): value is "memory" | "audio_memory" | "speed" => Boolean(value));
  const maxScores = new Map<string, number>();

  if (explicitQuestionKeys.length > 0) {
    const placeholders = explicitQuestionKeys.map(() => "?").join(", ");
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.section_key, COALESCE(SUM(q.weight), 0) AS max_score
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       WHERE q.test_id = ?
         AND q.is_active = 1
         AND s.is_active = 1
         AND q.question_key IN (${placeholders})
       GROUP BY s.section_key`,
      [testId, ...explicitQuestionKeys]
    );

    for (const row of rows as Array<{ section_key: string; max_score: number | string }>) {
      maxScores.set(row.section_key, Number(row.max_score ?? 0));
    }
  }

  if (includedSpecialSections.length > 0) {
    for (const sectionKey of includedSpecialSections) {
      const selectedQuestionKeys = resolvedQuestions.specialQuestionKeysByType[sectionKey];

      if (!selectedQuestionKeys) {
        const [rows] = await connection.execute<mysql.RowDataPacket[]>(
          `SELECT s.section_key, COALESCE(SUM(q.weight), 0) AS max_score
           FROM iq_sections s
           LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
           WHERE s.test_id = ?
             AND s.is_active = 1
             AND s.section_key = ?
           GROUP BY s.section_key`,
          [testId, sectionKey]
        );

        for (const row of rows as Array<{ section_key: string; max_score: number | string }>) {
          maxScores.set(row.section_key, Number(row.max_score ?? 0));
        }

        continue;
      }

      const placeholders = selectedQuestionKeys.map(() => "?").join(", ");
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT s.section_key, COALESCE(SUM(q.weight), 0) AS max_score
         FROM iq_questions q
         INNER JOIN iq_sections s ON s.id = q.section_id
         WHERE q.test_id = ?
           AND q.is_active = 1
           AND s.is_active = 1
           AND s.section_key = ?
           AND q.question_key IN (${placeholders})
         GROUP BY s.section_key`,
        [testId, sectionKey, ...selectedQuestionKeys]
      );

      for (const row of rows as Array<{ section_key: string; max_score: number | string }>) {
        maxScores.set(row.section_key, Number(row.max_score ?? 0));
      }

      if (!maxScores.has(sectionKey)) {
        maxScores.set(sectionKey, 0);
      }
    }
  }

  if (longMemoryItems && longMemoryItems.length > 0) {
    const longMemoryQuestionKeys = longMemoryItems.map((item) => item.questionKey);
    const placeholders = longMemoryQuestionKeys.map(() => "?").join(", ");
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.section_key, COALESCE(SUM(q.weight), 0) AS max_score
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       WHERE q.test_id = ?
         AND q.is_active = 1
         AND s.is_active = 1
         AND s.section_key = 'long_memory'
         AND q.question_key IN (${placeholders})
       GROUP BY s.section_key`,
      [testId, ...longMemoryQuestionKeys]
    );

    for (const row of rows as Array<{ section_key: string; max_score: number | string }>) {
      maxScores.set(row.section_key, Number(row.max_score ?? 0));
    }

    if (!maxScores.has("long_memory")) {
      maxScores.set("long_memory", 0);
    }
  }

  return maxScores;
}

async function loadPhaseQuestionByKey(connection: mysql.Connection, testId: number, questionKey: string): Promise<IqPhaseQuestion | null> {
  const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT q.id, q.question_key, q.section_id, s.section_key, s.title AS section_title, q.question_text, q.answer_prompt_text, q.stimulus_text,
            q.question_format, COALESCE(overlay.question_image_url, q.question_image_url) AS question_image_url, q.difficulty_level, q.weight,
            q.time_limit_seconds, q.display_time_seconds, s.display_time_seconds AS section_display_time_seconds,
            s.time_limit_seconds AS section_time_limit_seconds, q.position,
            overlay.answers_image_url, overlay.answer_count, overlay.grid_columns, overlay.grid_rows,
            audio.prompt_audio_url, audio.max_stimulus_plays, audio.transition_delay_ms
     FROM iq_questions q
     INNER JOIN iq_sections s ON s.id = q.section_id
     LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
     LEFT JOIN iq_audio_memory_questions audio ON audio.question_id = q.id
     WHERE q.test_id = ?
       AND q.question_key = ?
       AND q.is_active = 1
       AND s.is_active = 1
     LIMIT 1`,
    [testId, questionKey]
  );
  const question = (questionRows as IqQuestionRow[])[0];

  if (!question) {
    return null;
  }

  const [optionRows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT id, question_id, option_key, option_text, option_image_url, position
     FROM iq_question_options
     WHERE is_active = 1 AND question_id = ?
     ORDER BY position ASC`,
    [question.id]
  );
  const isOverlayQuestion = question.question_format === "visual_overlay" || question.question_format === "spatial_overlay";
  const answerCount = normalizeOverlayNumber(question.answer_count, 4);
  const gridColumns = normalizeOverlayNumber(question.grid_columns, answerCount === 6 ? 3 : 2);
  const gridRows = normalizeOverlayNumber(question.grid_rows, 2);

  return {
    id: question.id,
    sectionId: question.section_id,
    sectionKey: question.section_key,
    sectionTitle: question.section_title,
    questionText: question.question_text,
    answerPromptText: question.answer_prompt_text,
    stimulusText: question.stimulus_text,
    format: question.question_format,
    imageUrl: question.question_image_url,
    difficultyLevel: question.difficulty_level,
    weight: Number(question.weight),
    displayTimeSeconds: question.display_time_seconds ?? question.section_display_time_seconds ?? null,
    timeLimitSeconds: question.time_limit_seconds ?? question.section_time_limit_seconds ?? null,
    position: question.position,
    overlay:
      isOverlayQuestion && question.answers_image_url
        ? {
            answersImageUrl: question.answers_image_url,
            answerCount,
            gridColumns,
            gridRows,
          }
        : null,
    audio:
      question.section_key === "audio_memory" && question.prompt_audio_url
        ? {
            promptAudioUrl: question.prompt_audio_url,
            maxStimulusPlays: normalizeOverlayNumber(question.max_stimulus_plays, 1),
            transitionDelayMs: normalizeOverlayNumber(question.transition_delay_ms, 1800),
          }
        : null,
    options: isOverlayQuestion
      ? []
      : (optionRows as IqOptionRow[]).map((option) => ({
          id: option.id,
          key: option.option_key,
          text: option.option_text,
          imageUrl: option.option_image_url,
          audioUrl: option.option_image_url,
          position: option.position,
        })),
  };
}

async function getAttemptAndQuestionBank(connection: mysql.Connection, token: string) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT a.id AS attempt_id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title
     FROM iq_attempts a
     INNER JOIN iq_tests t ON t.id = a.test_id
     WHERE a.attempt_token = ?
     LIMIT 1`,
    [token]
  );
  const row = (rows as IqLongMemoryRouteRow[])[0];

  if (!row) {
    return null;
  }

  const questionBankTestId = await loadQuestionBankTestIdByTestId(connection, row.test_id);

  return {
    row,
    questionBankTestId,
  };
}

export async function getIqLongMemoryIntroByAttemptToken(token: string): Promise<IqLongMemoryIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const attemptData = await getAttemptAndQuestionBank(connection, token);

    if (!attemptData) {
      return { data: null, error: "Introduction memoire longue introuvable pour cette tentative." };
    }

    const state = await loadLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id);

    if (!state?.enabled || state.items.length === 0) {
      return { data: null, error: "Cette tentative ne contient pas de memoire longue." };
    }

    const sequencePlan = buildSequencePlan(await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, attemptData.row.attempt_id));
    const firstStandardUrl = getNextUrlForEntry(attemptData.row.attempt_token, sequencePlan, 0);

    if (!firstStandardUrl) {
      return { data: null, error: "Impossible de determiner la suite du test." };
    }

    return {
      data: {
        attempt: {
          id: attemptData.row.attempt_id,
          token: attemptData.row.attempt_token,
          status: attemptData.row.status,
          userId: attemptData.row.user_id,
          testId: attemptData.row.test_id,
          testTitle: attemptData.row.test_title,
        },
        introTitle: state.introTitle,
        introText: state.introText,
        itemCount: state.items.length,
        nextUrl: buildLongMemoryExposureUrl(attemptData.row.attempt_token, firstStandardUrl),
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger l'introduction memoire longue depuis MySQL : ${message}`
          : "Impossible de charger l'introduction memoire longue pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqLongMemoryExposureByAttemptToken(token: string, returnToUrl: string): Promise<IqLongMemoryExposureResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const attemptData = await getAttemptAndQuestionBank(connection, token);

    if (!attemptData) {
      return { data: null, error: "Phase d'exposition memoire longue introuvable." };
    }

    const state = await loadLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id);

    if (!state?.enabled || !state.activeQuestionKey) {
      return { data: null, error: "Aucune question de memoire longue a exposer." };
    }

    const currentItem = state.items[state.currentIndex];

    if (!currentItem || currentItem.questionKey !== state.activeQuestionKey) {
      return { data: null, error: "Etat memoire longue incoherent." };
    }

    const question = await loadPhaseQuestionByKey(connection, attemptData.questionBankTestId, state.activeQuestionKey);

    if (!question) {
      return { data: null, error: "Question de memoire longue introuvable." };
    }

    state.status = "waiting_delay";
    state.shownAt = new Date().toISOString();
    state.questionsAnsweredSinceShown = 0;
    await updateLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id, state);

    return {
      data: {
        attempt: {
          id: attemptData.row.attempt_id,
          token: attemptData.row.attempt_token,
          status: attemptData.row.status,
          userId: attemptData.row.user_id,
          testId: attemptData.row.test_id,
          testTitle: attemptData.row.test_title,
        },
        question,
        displayTimeSeconds: currentItem.displayTimeSeconds,
        returnToUrl,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger l'exposition memoire longue depuis MySQL : ${message}`
          : "Impossible de charger l'exposition memoire longue pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqLongMemoryAnswerByAttemptToken(token: string, returnToUrl: string): Promise<IqLongMemoryAnswerResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const attemptData = await getAttemptAndQuestionBank(connection, token);

    if (!attemptData) {
      return { data: null, error: "Phase de reponse memoire longue introuvable." };
    }

    const state = await loadLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id);

    if (!state?.enabled || state.status !== "awaiting_answer" || !state.activeQuestionKey) {
      return { data: null, error: "Aucune reponse de memoire longue en attente." };
    }

    const currentItem = state.items[state.currentIndex];
    const question = await loadPhaseQuestionByKey(connection, attemptData.questionBankTestId, state.activeQuestionKey);

    if (!question) {
      return { data: null, error: "Question de memoire longue introuvable." };
    }

    return {
      data: {
        attempt: {
          id: attemptData.row.attempt_id,
          token: attemptData.row.attempt_token,
          status: attemptData.row.status,
          userId: attemptData.row.user_id,
          testId: attemptData.row.test_id,
          testTitle: attemptData.row.test_title,
        },
        question,
        timeLimitSeconds: currentItem?.timeLimitSeconds ?? null,
        returnToUrl,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger la reponse memoire longue depuis MySQL : ${message}`
          : "Impossible de charger la reponse memoire longue pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqLongMemoryInterruptUrl(
  token: string,
  resumeUrl: string,
  options?: { force?: boolean; afterCurrentAnswerAction?: "advance" | "return" | "complete" }
): Promise<string | null> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const attemptData = await getAttemptAndQuestionBank(connection, token);

    if (!attemptData) {
      return null;
    }

    const state = await loadLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id);

    if (!state) {
      return null;
    }

    if (state.status === "awaiting_answer") {
      if (options?.afterCurrentAnswerAction) {
        state.afterCurrentAnswerAction = options.afterCurrentAnswerAction;
        await updateLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id, state);
      }
      return buildLongMemoryAnswerUrl(token, resumeUrl);
    }

    if (!shouldLongMemoryInterrupt(state, options?.force ?? false)) {
      return null;
    }

    state.status = "awaiting_answer";
    state.afterCurrentAnswerAction = options?.afterCurrentAnswerAction ?? "advance";
    await updateLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id, state);

    return buildLongMemoryAnswerUrl(token, resumeUrl);
  } catch {
    return null;
  } finally {
    await connection?.end();
  }
}

export async function advanceIqLongMemoryAfterAnswer(token: string, returnToUrl: string): Promise<{
  nextUrl: string | null;
  completion:
    | {
        attemptToken: string;
        userAttached: boolean;
        redirectUrl: string | null;
        guestResultReady: boolean;
      }
    | null;
}> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const attemptData = await getAttemptAndQuestionBank(connection, token);

    if (!attemptData) {
      return { nextUrl: returnToUrl, completion: null };
    }

    const state = await loadLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id);

    if (!state?.enabled) {
      return { nextUrl: returnToUrl, completion: null };
    }

    if (state.afterCurrentAnswerAction === "complete") {
      state.currentIndex = state.items.length;
      state.activeQuestionKey = null;
      state.shownAt = null;
      state.questionsAnsweredSinceShown = 0;
      state.status = "completed";
      state.afterCurrentAnswerAction = "advance";
      await updateLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id, state);

      if (!attemptData.row.user_id) {
        return {
          nextUrl: returnToUrl,
          completion: {
            attemptToken: token,
            userAttached: false,
            redirectUrl: null,
            guestResultReady: true,
          },
        };
      }

      const completionResult = await completeIqAttempt(token);

      return {
        nextUrl: completionResult.completion?.redirectUrl ?? returnToUrl,
        completion: completionResult.completion ?? null,
      };
    }

    if (state.afterCurrentAnswerAction === "return") {
      state.currentIndex = state.items.length;
      state.activeQuestionKey = null;
      state.shownAt = null;
      state.questionsAnsweredSinceShown = 0;
      state.status = "completed";
      state.afterCurrentAnswerAction = "advance";
      await updateLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id, state);

      return { nextUrl: returnToUrl, completion: null };
    }

    const nextIndex = state.currentIndex + 1;
    const nextItem = state.items[nextIndex] ?? null;

    if (!nextItem) {
      state.currentIndex = state.items.length;
      state.activeQuestionKey = null;
      state.shownAt = null;
      state.questionsAnsweredSinceShown = 0;
      state.status = "completed";
      state.afterCurrentAnswerAction = "advance";
      await updateLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id, state);
      return { nextUrl: returnToUrl, completion: null };
    }

    state.currentIndex = nextIndex;
    state.activeQuestionKey = nextItem.questionKey;
    state.shownAt = null;
    state.questionsAnsweredSinceShown = 0;
    state.status = "awaiting_exposure";
    state.afterCurrentAnswerAction = "advance";
    await updateLongMemoryStateByAttemptId(connection, attemptData.row.attempt_id, state);

    return { nextUrl: buildLongMemoryExposureUrl(token, returnToUrl), completion: null };
  } catch {
    return { nextUrl: returnToUrl, completion: null };
  } finally {
    await connection?.end();
  }
}

export async function getIqTestIntroBySlug(slug: string): Promise<IqTestIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [testRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, title, slug, description, image_url, total_time_limit_seconds, sequence_definition, question_bank_test_id
       FROM iq_tests
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [slug]
    );
    const test = (testRows as IqTestRow[])[0];

    if (!test) {
      return { test: null, error: "Test de logique introuvable." };
    }

    const questionBankTestId = test.question_bank_test_id ?? test.id;
    const sequencePlan = buildSequencePlan(parseTestSequenceDefinition(test.sequence_definition));

    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.id, s.section_key, s.title, s.description, s.time_limit_seconds, COUNT(q.id) AS question_count
       FROM iq_sections s
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE s.test_id = ? AND s.is_active = 1
       GROUP BY s.id, s.section_key, s.title, s.description, s.time_limit_seconds, s.position
       ORDER BY s.position ASC`,
      [questionBankTestId]
    );

    const sections = (sectionRows as IqSectionRow[]).map(mapSection);
    const firstQuestionBlock = sequencePlan.blocks[0];
    const resolvedQuestions = await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan);
    const questionSectionByKey = resolvedQuestions.questionSectionByKey;
    const orderedSectionKeys = getOrderedSequenceSectionKeys(sequencePlan, questionSectionByKey);
    const firstQuestionSectionKeys = new Set(
      firstQuestionBlock?.questionKeys.map((questionKey) => questionSectionByKey.get(questionKey)).filter((sectionKey): sectionKey is string => Boolean(sectionKey)) ?? []
    );
    const orderedLaterSectionKeys = orderedSectionKeys.filter(
      (sectionKey) => sectionKey === "memory" || sectionKey === "audio_memory" || sectionKey === "speed"
    );
    const sectionsByKey = new Map(sections.map((section) => [section.key, section]));
    const mainSections = orderedSectionKeys
      .filter((sectionKey) => firstQuestionSectionKeys.has(sectionKey))
      .map((sectionKey) => sectionsByKey.get(sectionKey))
      .filter((section): section is IqIntroSection => Boolean(section));
    const laterSections = orderedLaterSectionKeys
      .map((sectionKey) => {
        const section = sectionsByKey.get(sectionKey);

        if (!section) {
          return null;
        }

        const selectedQuestionKeys = resolvedQuestions.specialQuestionKeysByType[sectionKey];

        return {
          ...section,
          questionCount: selectedQuestionKeys ? selectedQuestionKeys.length : section.questionCount,
        };
      })
      .filter((section): section is IqIntroSection => Boolean(section));
    const firstQuestionBlockCount = firstQuestionBlock?.questionKeys.length ?? 0;

    return {
      test: {
        id: test.id,
        title: test.title,
        slug: test.slug,
        description: test.description,
        imageUrl: test.image_url,
        totalTimeLimitSeconds: test.total_time_limit_seconds,
        mainQuestionCount: firstQuestionBlockCount,
        mainTimeLimitSeconds: firstQuestionBlockCount * 15,
        sections: mainSections,
        laterSections,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      test: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger le test de logique depuis MySQL : ${message}`
          : "Impossible de charger le test de logique pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

const ALLOWED_IQ_GENDERS = new Set(["female", "male"]);

function isValidBirthDate(value: string) {
  if (!/^\d{4}-01-01$/.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const currentYear = new Date().getFullYear();

  return Number.isInteger(year) && year >= 1900 && year <= currentYear;
}

export async function getCompletedIqAttemptByToken(attemptToken: string, slug?: string): Promise<CompletedIqAttemptLookup> {
  let connection: mysql.Connection | undefined;

  try {
    if (!attemptToken) {
      return { attemptToken: null, resultUrl: null };
    }

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.attempt_token
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.attempt_token = ?
         AND a.status = 'completed'
         AND (? IS NULL OR t.slug = ?)
       LIMIT 1`,
      [attemptToken, slug ?? null, slug ?? null]
    );
    const row = (rows as { attempt_token: string }[])[0];

    if (!row) {
      return { attemptToken: null, resultUrl: null };
    }

    return {
      attemptToken: row.attempt_token,
      resultUrl: `/iq/results/${encodeURIComponent(row.attempt_token)}`,
    };
  } catch {
    return { attemptToken: null, resultUrl: null, error: "Impossible de vérifier l'ancienne tentative QI." };
  } finally {
    await connection?.end();
  }
}

export async function getCompletedIqAttemptForUser(userId: number, slug?: string): Promise<CompletedIqAttemptLookup> {
  let connection: mysql.Connection | undefined;

  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      return { attemptToken: null, resultUrl: null };
    }

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.attempt_token
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.user_id = ?
         AND a.status = 'completed'
         AND (? IS NULL OR t.slug = ?)
       ORDER BY a.completed_at ASC, a.id ASC
       LIMIT 1`,
      [userId, slug ?? null, slug ?? null]
    );
    const row = (rows as { attempt_token: string }[])[0];

    if (!row) {
      return { attemptToken: null, resultUrl: null };
    }

    return {
      attemptToken: row.attempt_token,
      resultUrl: `/iq/results/${encodeURIComponent(row.attempt_token)}`,
    };
  } catch {
    return { attemptToken: null, resultUrl: null, error: "Impossible de vérifier l'ancienne tentative QI." };
  } finally {
    await connection?.end();
  }
}

export async function createIqAttempt(
  slug: string,
  userId?: number | null,
  demographics?: CreateIqAttemptDemographics | null
): Promise<CreateIqAttemptResult> {
  let connection: mysql.Connection | undefined;

  try {
    const birthDate = demographics?.birthDate ?? "";
    const gender = demographics?.gender ?? "";

    if (!isValidBirthDate(birthDate) || !ALLOWED_IQ_GENDERS.has(gender)) {
      return { attemptToken: null, nextUrl: null, error: "Veuillez renseigner votre année de naissance et votre genre." };
    }

    connection = await mysql.createConnection(dbConfig);

    const [testRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, sequence_definition, question_bank_test_id
       FROM iq_tests
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [slug]
    );
    const test = (testRows as Array<{ id: number; sequence_definition: string | null; question_bank_test_id: number | null }>)[0];

    if (!test) {
      return { attemptToken: null, nextUrl: null, error: "Test de logique introuvable." };
    }

    const questionBankTestId = test.question_bank_test_id ?? test.id;
    const attemptToken = crypto.randomUUID();
    const resolvedSequenceDefinition = resolveTestSequenceDefinition(parseTestSequenceDefinition(test.sequence_definition));
    const initialLongMemoryState = createInitialLongMemoryState(resolvedSequenceDefinition);
    const sequencePlan = buildSequencePlan(resolvedSequenceDefinition);
    await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan);
    await validateLongMemoryItems(connection, questionBankTestId, resolvedSequenceDefinition);
    const { totalQuestions } = await getSequenceQuestionCounts(
      connection,
      questionBankTestId,
      sequencePlan,
      getEnabledLongMemoryItems(resolvedSequenceDefinition)
    );
    const firstStandardUrl = getNextUrlForEntry(attemptToken, sequencePlan, 0);
    const nextUrl =
      initialLongMemoryState && firstStandardUrl
        ? `/iq/attempt/${attemptToken}/long-memory-intro`
        : firstStandardUrl;

    if (!nextUrl) {
      return { attemptToken: null, nextUrl: null, error: "La sequence du test ne contient aucune etape exploitable." };
    }

    let safeUserId: number | null = null;

    if (Number.isInteger(userId) && Number(userId) > 0) {
      const [userRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id
         FROM users
         WHERE id = ? AND is_active = 1
         LIMIT 1`,
        [Number(userId)]
      );
      const user = (userRows as { id: number }[])[0];

      safeUserId = user?.id ?? null;
    }

    if (safeUserId) {
      const [userColumnRows] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM users");
      const userColumns = new Set(userColumnRows.map((row) => String(row.Field)));

      if (userColumns.has("birth_date") && userColumns.has("gender")) {
        await connection.execute(
          `UPDATE users
           SET birth_date = ?, gender = ?
           WHERE id = ? AND is_active = 1`,
          [birthDate, gender, safeUserId]
        );
      }
    }

    await connection.execute(
      `INSERT INTO iq_attempts (
         test_id,
         user_id,
         birth_date,
         gender,
         attempt_token,
         resolved_sequence_definition,
         long_memory_state,
         status,
         started_at,
         total_questions
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'started', NOW(), ?)`,
      [
        test.id,
        safeUserId,
        birthDate,
        gender,
        attemptToken,
        JSON.stringify(resolvedSequenceDefinition),
        initialLongMemoryState ? JSON.stringify(initialLongMemoryState) : null,
        totalQuestions,
      ]
    );

    return {
      attemptToken,
      nextUrl,
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";
    const mysqlError = error as { code?: string; errno?: number; sqlMessage?: string };

    console.error("IQ ATTEMPT CREATE ERROR", {
      slug,
      userId: userId ?? null,
      code: mysqlError.code ?? null,
      errno: mysqlError.errno ?? null,
      message,
      sqlMessage: mysqlError.sqlMessage ?? null,
      database: dbConfig.database,
      host: dbConfig.host,
    });

    return {
      attemptToken: null,
      nextUrl: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de créer une tentative de test de logique depuis MySQL : ${message}`
          : "Impossible de démarrer le test de logique pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqTestLaunchItems(): Promise<IqTestLaunchItem[]> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT title, slug, description, image_url
       FROM iq_tests
       WHERE is_active = 1
         AND sequence_definition IS NOT NULL
       ORDER BY FIELD(slug, 'test-qi-complet', 'sondage'), id ASC`
    );

    return (rows as Array<{ title: string; slug: string; description: string | null; image_url: string | null }>).map((row) => ({
      title: row.title,
      slug: row.slug,
      description: row.description,
      imageUrl: row.image_url,
    }));
  } catch {
    return [];
  } finally {
    await connection?.end();
  }
}

export async function getIqAttemptPhase(token: string, phase: "main" | "memory" | "audio" | "speed", blockIndex = 0): Promise<IqAttemptPhaseResult> {
  let connection: mysql.Connection | undefined;

  if (phase !== "main" && phase !== "memory" && phase !== "audio" && phase !== "speed") {
    return { data: null, error: "Phase de test indisponible." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);

    const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title, t.slug AS test_slug
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.attempt_token = ?
       LIMIT 1`,
      [token]
    );
    const attempt = (attemptRows as IqAttemptRow[])[0];

    if (!attempt) {
      return { data: null, error: "Tentative de test de logique introuvable." };
    }

    const questionBankTestId = await loadQuestionBankTestIdByTestId(connection, attempt.test_id);
    const sequencePlan = buildSequencePlan(await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, attempt.id));
    const resolvedQuestions = await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan);
    const questionSectionByKey = resolvedQuestions.questionSectionByKey;
    const currentQuestionBlock = phase === "main" ? sequencePlan.blocks[blockIndex] : null;
    const selectedSpecialQuestionKeys = phase === "memory" || phase === "audio" || phase === "speed"
      ? resolvedQuestions.specialQuestionKeysByType[phase === "audio" ? "audio_memory" : phase]
      : null;
    const mainQuestionOverrides = currentQuestionBlock
      ? new Map(currentQuestionBlock.questions.map((question) => [question.questionKey, question]))
      : null;
    const memoryEntry = phase === "memory"
      ? sequencePlan.entries.find((entry): entry is Extract<SequenceEntry, { type: "memory" }> => entry.type === "memory") ?? null
      : null;
    const memoryQuestionOverrides = memoryEntry?.questions
      ? new Map(memoryEntry.questions.map((question) => [question.questionKey, question]))
      : null;
    const speedEntry = phase === "speed"
      ? sequencePlan.entries.find((entry): entry is Extract<SequenceEntry, { type: "speed" }> => entry.type === "speed") ?? null
      : null;
    const audioEntry = phase === "audio"
      ? sequencePlan.entries.find((entry): entry is Extract<SequenceEntry, { type: "audio_memory" }> => entry.type === "audio_memory") ?? null
      : null;

    if (phase === "main" && !currentQuestionBlock) {
      return { data: null, error: "Bloc de questions introuvable dans la sequence du test." };
    }

    if (phase === "memory" && sequencePlan.memoryEntryIndex === null) {
      return { data: null, error: "La sequence du test ne contient pas de phase memoire." };
    }

    if (phase === "audio" && sequencePlan.audioMemoryEntryIndex === null) {
      return { data: null, error: "La sequence du test ne contient pas de phase sonore." };
    }

    if (phase === "speed" && sequencePlan.speedEntryIndex === null) {
      return { data: null, error: "La sequence du test ne contient pas de phase rapidite." };
    }

    const whereClauses = ["q.test_id = ?", "q.is_active = 1", "s.is_active = 1"];
    const queryParams: Array<string | number> = [questionBankTestId];

    if (phase === "main" && currentQuestionBlock) {
      for (const questionKey of currentQuestionBlock.questionKeys) {
        if (!questionSectionByKey.has(questionKey)) {
          return { data: null, error: `Question introuvable dans la sequence du test : ${questionKey}` };
        }
      }

      const questionKeyPlaceholders = currentQuestionBlock.questionKeys.map(() => "?").join(", ");
      whereClauses.push(`q.question_key IN (${questionKeyPlaceholders})`);
      queryParams.push(...currentQuestionBlock.questionKeys);
    } else if (phase === "memory") {
      whereClauses.push("s.section_key = 'memory'");
      if (selectedSpecialQuestionKeys) {
        const questionKeyPlaceholders = selectedSpecialQuestionKeys.map(() => "?").join(", ");
        whereClauses.push(`q.question_key IN (${questionKeyPlaceholders})`);
        queryParams.push(...selectedSpecialQuestionKeys);
      }
    } else if (phase === "audio") {
      whereClauses.push("s.section_key = 'audio_memory'");
      if (selectedSpecialQuestionKeys) {
        const questionKeyPlaceholders = selectedSpecialQuestionKeys.map(() => "?").join(", ");
        whereClauses.push(`q.question_key IN (${questionKeyPlaceholders})`);
        queryParams.push(...selectedSpecialQuestionKeys);
      }
    } else {
      whereClauses.push("s.section_key = 'speed'");
      if (selectedSpecialQuestionKeys) {
        const questionKeyPlaceholders = selectedSpecialQuestionKeys.map(() => "?").join(", ");
        whereClauses.push(`q.question_key IN (${questionKeyPlaceholders})`);
        queryParams.push(...selectedSpecialQuestionKeys);
      }
    }

    whereClauses.push(
      `NOT EXISTS (
         SELECT 1
         FROM iq_attempt_answers aa
         WHERE aa.attempt_id = ? AND aa.question_id = q.id
       )`
    );
    queryParams.push(attempt.id);

    const orderBy =
      phase === "main" && currentQuestionBlock
        ? `FIELD(q.question_key, ${currentQuestionBlock.questionKeys.map(() => "?").join(", ")}) ASC`
        : (phase === "memory" || phase === "audio" || phase === "speed") && selectedSpecialQuestionKeys
          ? `FIELD(q.question_key, ${selectedSpecialQuestionKeys.map(() => "?").join(", ")}) ASC`
        : "q.position ASC";

    if (phase === "main" && currentQuestionBlock) {
      queryParams.push(...currentQuestionBlock.questionKeys);
    } else if ((phase === "memory" || phase === "audio" || phase === "speed") && selectedSpecialQuestionKeys) {
      queryParams.push(...selectedSpecialQuestionKeys);
    }

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id, q.question_key, q.section_id, s.section_key, s.title AS section_title, q.question_text, q.answer_prompt_text, q.stimulus_text,
              q.question_format, COALESCE(overlay.question_image_url, q.question_image_url) AS question_image_url, q.difficulty_level, q.weight,
              q.time_limit_seconds, q.display_time_seconds, s.display_time_seconds AS section_display_time_seconds,
              s.time_limit_seconds AS section_time_limit_seconds, q.position,
              overlay.answers_image_url, overlay.answer_count, overlay.grid_columns, overlay.grid_rows,
              audio.prompt_audio_url, audio.max_stimulus_plays, audio.transition_delay_ms
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
       LEFT JOIN iq_audio_memory_questions audio ON audio.question_id = q.id
       WHERE ${whereClauses.join("\n         AND ")}
       ORDER BY ${orderBy}`,
      queryParams
    );
    const questions = questionRows as IqQuestionRow[];
    const questionIds = questions.map((question) => question.id);

    let optionRows: IqOptionRow[] = [];
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => "?").join(", ");
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, question_id, option_key, option_text, option_image_url, position
         FROM iq_question_options
         WHERE is_active = 1 AND question_id IN (${placeholders})
         ORDER BY question_id ASC, position ASC`,
        questionIds
      );
      optionRows = rows as IqOptionRow[];
    }

    const optionsByQuestion = new Map<number, IqPhaseOption[]>();
    for (const option of optionRows) {
      const list = optionsByQuestion.get(option.question_id) ?? [];
      list.push({
        id: option.id,
        key: option.option_key,
        text: option.option_text,
        imageUrl: option.option_image_url,
        audioUrl: option.option_image_url,
        position: option.position,
      });
      optionsByQuestion.set(option.question_id, list);
    }

    return {
      data: {
        attempt: {
          id: attempt.id,
          token: attempt.attempt_token,
          status: attempt.status,
          userId: attempt.user_id,
          testId: attempt.test_id,
          testTitle: attempt.test_title,
          testSlug: attempt.test_slug,
        },
        phase,
        phaseTimeLimitSeconds:
          phase === "speed"
            ? speedEntry?.totalTimeLimitSeconds ?? (questions[0] ? questions[0].section_time_limit_seconds ?? null : null)
            : phase === "audio"
              ? audioEntry?.timeLimitSeconds ?? (questions[0] ? questions[0].section_time_limit_seconds ?? null : null)
            : questions[0]
              ? questions[0].section_time_limit_seconds ?? null
              : null,
        nextUrl:
          phase === "main"
            ? getNextUrlAfterQuestionBlock(attempt.attempt_token, sequencePlan, blockIndex)
            : getNextUrlAfterSpecial(attempt.attempt_token, sequencePlan, phase === "audio" ? "audio_memory" : phase),
        questions: questions.map((question) => {
          const isOverlayQuestion =
            question.question_format === "visual_overlay" || question.question_format === "spatial_overlay";
          const answerCount = normalizeOverlayNumber(question.answer_count, 4);
          const gridColumns = normalizeOverlayNumber(question.grid_columns, answerCount === 6 ? 3 : 2);
          const gridRows = normalizeOverlayNumber(question.grid_rows, 2);
          const questionOverride =
            phase === "main"
              ? mainQuestionOverrides?.get(question.question_key)
              : phase === "memory"
                ? memoryQuestionOverrides?.get(question.question_key)
                : null;

          return {
            id: question.id,
            sectionId: question.section_id,
            sectionKey: question.section_key,
            sectionTitle: question.section_title,
            questionText: question.question_text,
            answerPromptText: question.answer_prompt_text,
            stimulusText: question.stimulus_text,
            format: question.question_format,
            imageUrl: question.question_image_url,
            difficultyLevel: question.difficulty_level,
            weight: Number(question.weight),
            displayTimeSeconds:
              phase === "memory"
                ? questionOverride?.displayTimeSeconds ?? question.display_time_seconds ?? question.section_display_time_seconds ?? null
                : question.display_time_seconds ?? question.section_display_time_seconds ?? null,
            timeLimitSeconds:
              questionOverride?.timeLimitSeconds ?? question.time_limit_seconds ?? question.section_time_limit_seconds ?? null,
            position: question.position,
            overlay:
              isOverlayQuestion && question.answers_image_url
                ? {
                    answersImageUrl: question.answers_image_url,
                    answerCount,
                    gridColumns,
                    gridRows,
                  }
                : null,
            audio:
              question.section_key === "audio_memory" && question.prompt_audio_url
                ? {
                    promptAudioUrl: question.prompt_audio_url,
                    maxStimulusPlays: normalizeOverlayNumber(question.max_stimulus_plays, 1),
                    transitionDelayMs: normalizeOverlayNumber(question.transition_delay_ms, 1800),
                  }
                : null,
            options: isOverlayQuestion ? [] : optionsByQuestion.get(question.id) ?? [],
          };
        }),
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger la phase de test de logique depuis MySQL : ${message}`
          : "Impossible de charger cette phase du test de logique pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

async function prepareIqAttemptAnswer(
  connection: mysql.Connection,
  token: string,
  payload: SaveIqAttemptAnswerPayload
): Promise<{ prepared: PreparedIqAnswer | null; error: string | null }> {
  const hasSelectedOption = Number.isInteger(payload.selectedOptionId);
  const hasSelectedPosition = Number.isInteger(payload.selectedPosition);

  if (!Number.isInteger(payload.questionId)) {
    return { prepared: null, error: "RÃ©ponse invalide." };
  }

  const baseQuery = `SELECT a.id AS attempt_id, a.test_id, q.section_id, s.section_key, a.user_id, q.id AS question_id,
                            q.difficulty_level, q.weight, q.question_format,
                            selected.id AS selected_option_id, selected.is_correct,
                            correct.id AS correct_option_id,
                            selected.position AS selected_position,
                            correct.position AS correct_position,
                            overlay.correct_position AS overlay_correct_position,
                            overlay.answer_count AS overlay_answer_count
                     FROM iq_attempts a
                     INNER JOIN iq_tests t ON t.id = a.test_id
                     INNER JOIN iq_questions q ON q.test_id = COALESCE(t.question_bank_test_id, a.test_id)
                     INNER JOIN iq_sections s ON s.id = q.section_id
                     LEFT JOIN iq_question_options selected ON selected.question_id = q.id AND selected.id = ? AND selected.is_active = 1
                     LEFT JOIN iq_question_options correct ON correct.question_id = q.id AND correct.is_correct = 1 AND correct.is_active = 1
                     LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
                     WHERE a.attempt_token = ?
                       AND a.status = 'started'
                       AND q.id = ?
                       AND q.is_active = 1
                       AND s.is_active = 1
                       AND s.section_key IN ('verbal', 'logic', 'quantitative', 'spatial', 'memory', 'audio_memory', 'long_memory', 'speed')
                     LIMIT 1`;
  const [answerRows] = await connection.execute<mysql.RowDataPacket[]>(baseQuery, [
    hasSelectedOption ? Number(payload.selectedOptionId) : null,
    token,
    payload.questionId,
  ]);
  const rawAnswerData = (answerRows as PreparedIqAnswerRow[])[0];

  const isOverlayQuestion =
    rawAnswerData?.question_format === "visual_overlay" || rawAnswerData?.question_format === "spatial_overlay";
  const selectedPosition = hasSelectedPosition ? Number(payload.selectedPosition) : rawAnswerData?.selected_position ?? null;
  const isTimedOut = !hasSelectedOption && !hasSelectedPosition;
  const isMainSection =
    rawAnswerData?.section_key === "verbal" ||
    rawAnswerData?.section_key === "logic" ||
    rawAnswerData?.section_key === "quantitative" ||
    rawAnswerData?.section_key === "long_memory" ||
    rawAnswerData?.section_key === "spatial";
  const allowsTimeoutAnswer =
    isMainSection ||
    rawAnswerData?.section_key === "memory" ||
    rawAnswerData?.section_key === "audio_memory" ||
    rawAnswerData?.section_key === "speed";
  const answerCount = rawAnswerData?.overlay_answer_count ? Number(rawAnswerData.overlay_answer_count) : null;

  if (rawAnswerData && isTimedOut && !allowsTimeoutAnswer) {
    return { prepared: null, error: "RÃ©ponse invalide." };
  }

  const answerData =
    rawAnswerData && isTimedOut && allowsTimeoutAnswer
      ? {
          ...rawAnswerData,
          selected_option_id: null,
          is_correct: 0,
          correct_option_id: rawAnswerData.correct_option_id ?? null,
          selected_position: null,
          correct_position: isOverlayQuestion ? rawAnswerData.overlay_correct_position : rawAnswerData.correct_position ?? null,
        }
      : rawAnswerData && isOverlayQuestion
        ? {
            ...rawAnswerData,
            selected_option_id: null,
            is_correct: selectedPosition === rawAnswerData.overlay_correct_position ? 1 : 0,
            correct_option_id: null,
            selected_position: selectedPosition,
            correct_position: rawAnswerData.overlay_correct_position,
          }
        : rawAnswerData
          ? { ...rawAnswerData, correct_position: rawAnswerData.correct_position ?? null }
          : null;

  if (!answerData) {
    return { prepared: null, error: "Question ou rÃ©ponse introuvable pour cette tentative." };
  }

  if (!isTimedOut && isOverlayQuestion) {
    const numericSelectedPosition = Number(selectedPosition);

    if (!Number.isInteger(numericSelectedPosition) || !answerCount || numericSelectedPosition < 1 || numericSelectedPosition > answerCount || !answerData.correct_position) {
      return { prepared: null, error: "Zone de rÃ©ponse invalide pour cette question." };
    }
  } else if (!isTimedOut && !answerData.selected_option_id) {
    return { prepared: null, error: "Option de rÃ©ponse invalide pour cette question." };
  }

  const isCorrect = answerData.is_correct === 1;
  const weight = Number(answerData.weight);
  const pointsEarned = isCorrect ? weight : 0;
  const responseTimeMsInput = payload.responseTimeMs;
  const responseTimeMs =
    typeof responseTimeMsInput === "number" && Number.isInteger(responseTimeMsInput) && responseTimeMsInput >= 0
      ? responseTimeMsInput
      : null;
  const displayedAt = payload.displayedAt ? new Date(payload.displayedAt) : null;
  const safeDisplayedAt =
    displayedAt && !Number.isNaN(displayedAt.getTime()) ? displayedAt.toISOString().slice(0, 19).replace("T", " ") : null;

  return {
    prepared: {
      answerData,
      isCorrect,
      pointsEarned,
      responseTimeMs,
      safeDisplayedAt,
    },
    error: null,
  };
}

export async function saveIqAttemptAnswer(token: string, payload: SaveIqAttemptAnswerPayload): Promise<SaveIqAttemptAnswerResult> {
  let connection: mysql.Connection | undefined;

  const hasSelectedOption = Number.isInteger(payload.selectedOptionId);
  const hasSelectedPosition = Number.isInteger(payload.selectedPosition);

  if (!Number.isInteger(payload.questionId)) {
    return { answer: null, error: "Réponse invalide." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);

    const baseQuery = `SELECT a.id AS attempt_id, a.test_id, q.section_id, s.section_key, a.user_id, q.id AS question_id, q.question_key,
                              q.difficulty_level, q.weight, q.question_format,
                              selected.id AS selected_option_id, selected.is_correct,
                              correct.id AS correct_option_id,
                              selected.position AS selected_position,
                              correct.position AS correct_position,
                              overlay.correct_position AS overlay_correct_position,
                              overlay.answer_count AS overlay_answer_count
                       FROM iq_attempts a
                       INNER JOIN iq_tests t ON t.id = a.test_id
                       INNER JOIN iq_questions q ON q.test_id = COALESCE(t.question_bank_test_id, a.test_id)
                       INNER JOIN iq_sections s ON s.id = q.section_id
                       LEFT JOIN iq_question_options selected ON selected.question_id = q.id AND selected.id = ? AND selected.is_active = 1
                       LEFT JOIN iq_question_options correct ON correct.question_id = q.id AND correct.is_correct = 1 AND correct.is_active = 1
                       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
                       WHERE a.attempt_token = ?
                         AND a.status = 'started'
                         AND q.id = ?
                         AND q.is_active = 1
                         AND s.is_active = 1
                         AND s.section_key IN ('verbal', 'logic', 'quantitative', 'spatial', 'memory', 'audio_memory', 'long_memory', 'speed')
                       LIMIT 1`;
    const [answerRows] = await connection.execute<mysql.RowDataPacket[]>(baseQuery, [
      hasSelectedOption ? Number(payload.selectedOptionId) : null,
      token,
      payload.questionId,
    ]);
    const rawAnswerData = (answerRows as (IqAnswerCheckRow & { overlay_correct_position: number | null; overlay_answer_count: string | number | null })[])[0];

    const isOverlayQuestion =
      rawAnswerData?.question_format === "visual_overlay" || rawAnswerData?.question_format === "spatial_overlay";
    const selectedPosition = hasSelectedPosition ? Number(payload.selectedPosition) : rawAnswerData?.selected_position ?? null;
    const isTimedOut = !hasSelectedOption && !hasSelectedPosition;
    const isMainSection =
      rawAnswerData?.section_key === "verbal" ||
      rawAnswerData?.section_key === "logic" ||
      rawAnswerData?.section_key === "quantitative" ||
      rawAnswerData?.section_key === "long_memory" ||
      rawAnswerData?.section_key === "spatial";
    const allowsTimeoutAnswer =
      isMainSection ||
      rawAnswerData?.section_key === "memory" ||
      rawAnswerData?.section_key === "audio_memory" ||
      rawAnswerData?.section_key === "speed";
    const answerCount = rawAnswerData?.overlay_answer_count ? Number(rawAnswerData.overlay_answer_count) : null;

    if (rawAnswerData && isTimedOut && !allowsTimeoutAnswer) {
      return { answer: null, error: "Réponse invalide." };
    }

    const answerData =
      rawAnswerData && isTimedOut && allowsTimeoutAnswer
        ? {
            ...rawAnswerData,
            selected_option_id: null,
            is_correct: 0,
            correct_option_id: rawAnswerData.correct_option_id ?? null,
            selected_position: null,
            correct_position: isOverlayQuestion ? rawAnswerData.overlay_correct_position : rawAnswerData.correct_position ?? null,
          }
        : rawAnswerData && isOverlayQuestion
        ? {
            ...rawAnswerData,
            selected_option_id: null,
            is_correct: selectedPosition === rawAnswerData.overlay_correct_position ? 1 : 0,
            correct_option_id: null,
            selected_position: selectedPosition,
            correct_position: rawAnswerData.overlay_correct_position,
          }
        : rawAnswerData
          ? { ...rawAnswerData, correct_position: rawAnswerData.correct_position ?? null }
          : null;

    if (!answerData) {
      return { answer: null, error: "Question ou réponse introuvable pour cette tentative." };
    }

    if (!isTimedOut && isOverlayQuestion) {
      const numericSelectedPosition = Number(selectedPosition);

      if (!Number.isInteger(numericSelectedPosition) || !answerCount || numericSelectedPosition < 1 || numericSelectedPosition > answerCount || !answerData.correct_position) {
        return { answer: null, error: "Zone de réponse invalide pour cette question." };
      }
    } else if (!isTimedOut && !answerData.selected_option_id) {
      return { answer: null, error: "Option de réponse invalide pour cette question." };
    }

    const [existingRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT aa.is_correct, aa.points_earned, aa.correct_position, correct.id AS correct_option_id
       FROM iq_attempt_answers aa
       LEFT JOIN iq_question_options correct ON correct.question_id = aa.question_id AND correct.is_correct = 1 AND correct.is_active = 1
       WHERE aa.attempt_id = ? AND aa.question_id = ?
       LIMIT 1`,
      [answerData.attempt_id, answerData.question_id]
    );
    const existingAnswer = (existingRows as IqExistingAnswerRow[])[0];

    if (existingAnswer) {
      return {
        answer: {
          isCorrect: existingAnswer.is_correct === 1,
          correctOptionId: existingAnswer.correct_option_id,
          correctPosition: existingAnswer.correct_position,
          pointsEarned: Number(existingAnswer.points_earned),
        },
      };
    }

    const isCorrect = answerData.is_correct === 1;
    const weight = Number(answerData.weight);
    const pointsEarned = isCorrect ? weight : 0;
    const responseTimeMsInput = payload.responseTimeMs;
    const responseTimeMs =
      typeof responseTimeMsInput === "number" && Number.isInteger(responseTimeMsInput) && responseTimeMsInput >= 0
        ? responseTimeMsInput
        : null;
    const displayedAt = payload.displayedAt ? new Date(payload.displayedAt) : null;
    const safeDisplayedAt =
      displayedAt && !Number.isNaN(displayedAt.getTime()) ? displayedAt.toISOString().slice(0, 19).replace("T", " ") : null;

    await connection.execute(
      `INSERT INTO iq_attempt_answers
       (attempt_id, test_id, section_id, question_id, user_id, selected_option_id, selected_position,
        correct_position, is_correct, difficulty_level, weight, points_earned, response_time_ms, displayed_at, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        answerData.attempt_id,
        answerData.test_id,
        answerData.section_id,
        answerData.question_id,
        answerData.user_id,
        answerData.selected_option_id,
        answerData.selected_position,
        answerData.correct_position,
        isCorrect ? 1 : 0,
        answerData.difficulty_level,
        weight,
        pointsEarned,
        responseTimeMs,
        safeDisplayedAt,
      ]
    );

    await insertChoiceSiblingSentinelAnswers(connection, answerData);

    await connection.execute(
      `UPDATE iq_attempts
       SET answered_questions = (
             SELECT COUNT(DISTINCT question_id)
             FROM iq_attempt_answers
             WHERE attempt_id = ?
               AND (response_time_ms IS NULL OR response_time_ms <> ?)
           ),
           raw_score = (
             SELECT COALESCE(SUM(points_earned), 0)
             FROM iq_attempt_answers
             WHERE attempt_id = ?
           ),
           weighted_score = (
             SELECT COALESCE(SUM(points_earned), 0)
             FROM iq_attempt_answers
             WHERE attempt_id = ?
           ),
           average_response_time_ms = (
             SELECT ROUND(AVG(response_time_ms))
             FROM iq_attempt_answers
             WHERE attempt_id = ? AND response_time_ms IS NOT NULL AND response_time_ms <> ?
           ),
           updated_at = NOW()
       WHERE id = ?`,
      [
        answerData.attempt_id,
        NOT_PRESENTED_RESPONSE_TIME_MS,
        answerData.attempt_id,
        answerData.attempt_id,
        answerData.attempt_id,
        NOT_PRESENTED_RESPONSE_TIME_MS,
        answerData.attempt_id,
      ]
    );

    await markLongMemoryQuestionProgress(connection, answerData.attempt_id, answerData.section_key);

    return {
      answer: {
        isCorrect,
        correctOptionId: answerData.correct_option_id,
        correctPosition: answerData.correct_position,
        pointsEarned,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      answer: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible d'enregistrer la réponse de QI dans MySQL : ${message}`
          : "Impossible d'enregistrer cette réponse pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function previewIqAttemptAnswer(token: string, payload: SaveIqAttemptAnswerPayload): Promise<SaveIqAttemptAnswerResult> {
  let connection: mysql.Connection | undefined;

  const hasSelectedOption = Number.isInteger(payload.selectedOptionId);
  const hasSelectedPosition = Number.isInteger(payload.selectedPosition);

  if (!Number.isInteger(payload.questionId)) {
    return { answer: null, error: "RÃ©ponse invalide." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);

    const baseQuery = `SELECT a.id AS attempt_id, a.test_id, q.section_id, s.section_key, a.user_id, q.id AS question_id, q.question_key,
                              q.difficulty_level, q.weight, q.question_format,
                              selected.id AS selected_option_id, selected.is_correct,
                              correct.id AS correct_option_id,
                              selected.position AS selected_position,
                              correct.position AS correct_position,
                              overlay.correct_position AS overlay_correct_position,
                              overlay.answer_count AS overlay_answer_count
                       FROM iq_attempts a
                       INNER JOIN iq_tests t ON t.id = a.test_id
                       INNER JOIN iq_questions q ON q.test_id = COALESCE(t.question_bank_test_id, a.test_id)
                       INNER JOIN iq_sections s ON s.id = q.section_id
                       LEFT JOIN iq_question_options selected ON selected.question_id = q.id AND selected.id = ? AND selected.is_active = 1
                       LEFT JOIN iq_question_options correct ON correct.question_id = q.id AND correct.is_correct = 1 AND correct.is_active = 1
                       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
                       WHERE a.attempt_token = ?
                         AND a.status = 'started'
                         AND q.id = ?
                         AND q.is_active = 1
                         AND s.is_active = 1
                         AND s.section_key IN ('verbal', 'logic', 'quantitative', 'spatial', 'memory', 'audio_memory', 'long_memory', 'speed')
                       LIMIT 1`;
    const [answerRows] = await connection.execute<mysql.RowDataPacket[]>(baseQuery, [
      hasSelectedOption ? Number(payload.selectedOptionId) : null,
      token,
      payload.questionId,
    ]);
    const rawAnswerData = (answerRows as PreparedIqAnswerRow[])[0];

    const isOverlayQuestion =
      rawAnswerData?.question_format === "visual_overlay" || rawAnswerData?.question_format === "spatial_overlay";
    const selectedPosition = hasSelectedPosition ? Number(payload.selectedPosition) : rawAnswerData?.selected_position ?? null;
    const isTimedOut = !hasSelectedOption && !hasSelectedPosition;
    const isMainSection =
      rawAnswerData?.section_key === "verbal" ||
      rawAnswerData?.section_key === "logic" ||
      rawAnswerData?.section_key === "quantitative" ||
      rawAnswerData?.section_key === "long_memory" ||
      rawAnswerData?.section_key === "spatial";
    const allowsTimeoutAnswer =
      isMainSection ||
      rawAnswerData?.section_key === "memory" ||
      rawAnswerData?.section_key === "audio_memory" ||
      rawAnswerData?.section_key === "speed";
    const answerCount = rawAnswerData?.overlay_answer_count ? Number(rawAnswerData.overlay_answer_count) : null;

    if (rawAnswerData && isTimedOut && !allowsTimeoutAnswer) {
      return { answer: null, error: "RÃ©ponse invalide." };
    }

    const answerData =
      rawAnswerData && isTimedOut && allowsTimeoutAnswer
        ? {
            ...rawAnswerData,
            selected_option_id: null,
            is_correct: 0,
            correct_option_id: rawAnswerData.correct_option_id ?? null,
            selected_position: null,
            correct_position: isOverlayQuestion ? rawAnswerData.overlay_correct_position : rawAnswerData.correct_position ?? null,
          }
        : rawAnswerData && isOverlayQuestion
          ? {
              ...rawAnswerData,
              selected_option_id: null,
              is_correct: selectedPosition === rawAnswerData.overlay_correct_position ? 1 : 0,
              correct_option_id: null,
              selected_position: selectedPosition,
              correct_position: rawAnswerData.overlay_correct_position,
            }
          : rawAnswerData
            ? { ...rawAnswerData, correct_position: rawAnswerData.correct_position ?? null }
            : null;

    if (!answerData) {
      return { answer: null, error: "Question ou rÃ©ponse introuvable pour cette tentative." };
    }

    if (!isTimedOut && isOverlayQuestion) {
      const numericSelectedPosition = Number(selectedPosition);

      if (!Number.isInteger(numericSelectedPosition) || !answerCount || numericSelectedPosition < 1 || numericSelectedPosition > answerCount || !answerData.correct_position) {
        return { answer: null, error: "Zone de rÃ©ponse invalide pour cette question." };
      }
    } else if (!isTimedOut && !answerData.selected_option_id) {
      return { answer: null, error: "Option de rÃ©ponse invalide pour cette question." };
    }

    const [existingRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT aa.is_correct, aa.points_earned, aa.correct_position, correct.id AS correct_option_id
       FROM iq_attempt_answers aa
       LEFT JOIN iq_question_options correct ON correct.question_id = aa.question_id AND correct.is_correct = 1 AND correct.is_active = 1
       WHERE aa.attempt_id = ? AND aa.question_id = ?
       LIMIT 1`,
      [answerData.attempt_id, answerData.question_id]
    );
    const existingAnswer = (existingRows as IqExistingAnswerRow[])[0];

    if (existingAnswer) {
      return {
        answer: {
          isCorrect: existingAnswer.is_correct === 1,
          correctOptionId: existingAnswer.correct_option_id,
          correctPosition: existingAnswer.correct_position,
          pointsEarned: Number(existingAnswer.points_earned),
        },
      };
    }

    const isCorrect = answerData.is_correct === 1;
    const pointsEarned = isCorrect ? Number(answerData.weight) : 0;

    await markLongMemoryQuestionProgress(connection, answerData.attempt_id, answerData.section_key);

    return {
      answer: {
        isCorrect,
        correctOptionId: answerData.correct_option_id,
        correctPosition: answerData.correct_position,
        pointsEarned,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      answer: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de previsualiser la rÃ©ponse de QI dans MySQL : ${message}`
          : "Impossible de valider cette rÃ©ponse pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function persistIqAttemptDraft(token: string, payload: PersistIqAttemptDraftPayload) {
  if (!payload || !Array.isArray(payload.answers) || payload.answers.length === 0) {
    return { ok: false, error: "Aucune rÃ©ponse Ã  persister." };
  }

  const dedupedAnswers = payload.answers
    .filter((answer): answer is SaveIqAttemptAnswerPayload => Boolean(answer) && Number.isInteger(answer.questionId))
    .sort((left, right) => {
      const leftTime = left.displayedAt ? new Date(left.displayedAt).getTime() : 0;
      const rightTime = right.displayedAt ? new Date(right.displayedAt).getTime() : 0;

      return leftTime - rightTime;
    });

  for (const answer of dedupedAnswers) {
    const result = await saveIqAttemptAnswer(token, answer);

    if (result.error) {
      return { ok: false, error: result.error };
    }
  }

  return { ok: true, error: null as string | null };
}

export async function getIqMemoryIntroByAttemptToken(token: string): Promise<IqMemoryIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id AS attempt_id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title,
              s.id AS section_id, s.section_key, s.title AS section_title, s.description AS section_description,
              s.display_time_seconds, s.time_limit_seconds, COUNT(q.id) AS question_count
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       INNER JOIN iq_sections s ON s.test_id = COALESCE(t.question_bank_test_id, a.test_id)
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE a.attempt_token = ?
         AND s.section_key = 'memory'
         AND s.is_active = 1
       GROUP BY a.id, a.attempt_token, a.status, a.user_id, a.test_id, t.title,
                s.id, s.section_key, s.title, s.description, s.display_time_seconds, s.time_limit_seconds
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqMemoryIntroRow[])[0];
    const questionBankTestId = row ? await loadQuestionBankTestIdByTestId(connection, row.test_id) : null;
    const sequencePlan = row ? buildSequencePlan(await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, row.attempt_id)) : null;
    if (row && sequencePlan && sequencePlan.memoryEntryIndex === null) {
      return { data: null, error: "La sequence du test ne contient pas de phase memoire." };
    }
    const resolvedQuestions = row && sequencePlan && questionBankTestId ? await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan) : null;
    const memoryQuestionKeys = resolvedQuestions?.specialQuestionKeysByType.memory ?? null;

    if (!row) {
      return { data: null, error: "Introduction mémoire introuvable pour cette tentative." };
    }

    return {
      data: {
        attempt: {
          id: row.attempt_id,
          token: row.attempt_token,
          status: row.status,
          userId: row.user_id,
          testId: row.test_id,
          testTitle: row.test_title,
        },
        section: {
          id: row.section_id,
          key: row.section_key,
          title: row.section_title,
          description: row.section_description,
          questionCount: memoryQuestionKeys ? memoryQuestionKeys.length : row.question_count,
          displayTimeSeconds: row.display_time_seconds ?? 10,
          timeLimitSeconds: row.time_limit_seconds,
        },
        nextUrl: `/iq/attempt/${row.attempt_token}/phase/memory`,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger l'introduction mémoire depuis MySQL : ${message}`
          : "Impossible de charger l'introduction mémoire pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqAudioIntroByAttemptToken(token: string): Promise<IqAudioIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id AS attempt_id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title,
              s.id AS section_id, s.section_key, s.title AS section_title, s.description AS section_description,
              COUNT(q.id) AS question_count, MAX(audio.max_stimulus_plays) AS max_stimulus_plays
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       INNER JOIN iq_sections s ON s.test_id = COALESCE(t.question_bank_test_id, t.id)
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       LEFT JOIN iq_audio_memory_questions audio ON audio.question_id = q.id
       WHERE a.attempt_token = ?
         AND s.section_key = 'audio_memory'
         AND s.is_active = 1
       GROUP BY a.id, a.attempt_token, a.status, a.user_id, a.test_id, t.title, s.id, s.section_key, s.title, s.description
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqAudioIntroRow[])[0];

    const questionBankTestId = row ? await loadQuestionBankTestIdByTestId(connection, row.test_id) : null;
    const sequencePlan = row ? buildSequencePlan(await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, row.attempt_id)) : null;
    if (row && sequencePlan && sequencePlan.audioMemoryEntryIndex === null) {
      return { data: null, error: "La sequence du test ne contient pas de phase sonore." };
    }
    const resolvedQuestions = row && sequencePlan && questionBankTestId ? await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan) : null;
    const audioQuestionKeys = resolvedQuestions?.specialQuestionKeysByType.audio_memory ?? null;
    const previewQuestion =
      row && questionBankTestId && audioQuestionKeys?.[0]
        ? await loadPhaseQuestionByKey(connection, questionBankTestId, audioQuestionKeys[0])
        : null;

    if (!row) {
      return { data: null, error: "Introduction sonore introuvable pour cette tentative." };
    }

    return {
      data: {
        attempt: {
          id: row.attempt_id,
          token: row.attempt_token,
          status: row.status,
          userId: row.user_id,
          testId: row.test_id,
          testTitle: row.test_title,
        },
        section: {
          id: row.section_id,
          key: row.section_key,
          title: row.section_title,
          description: row.section_description,
          questionCount: audioQuestionKeys ? audioQuestionKeys.length : row.question_count,
          maxStimulusPlays: Math.max(Number(row.max_stimulus_plays ?? 1), 1),
          timeLimitSeconds:
            sequencePlan?.entries.find((entry): entry is Extract<SequenceEntry, { type: "audio_memory" }> => entry.type === "audio_memory")
              ?.timeLimitSeconds ?? null,
          previewAudioUrl: previewQuestion?.audio?.promptAudioUrl ?? null,
        },
        nextUrl: `/iq/attempt/${row.attempt_token}/phase/audio`,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger l'introduction sonore depuis MySQL : ${message}`
          : "Impossible de charger l'introduction sonore pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqSpeedIntroByAttemptToken(token: string): Promise<IqSpeedIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id AS attempt_id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title,
              s.id AS section_id, s.section_key, s.title AS section_title, s.description AS section_description,
              s.time_limit_seconds, COUNT(q.id) AS question_count
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       INNER JOIN iq_sections s ON s.test_id = COALESCE(t.question_bank_test_id, a.test_id)
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE a.attempt_token = ?
         AND s.section_key = 'speed'
         AND s.is_active = 1
       GROUP BY a.id, a.attempt_token, a.status, a.user_id, a.test_id, t.title,
                s.id, s.section_key, s.title, s.description, s.time_limit_seconds
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqSpeedIntroRow[])[0];
    const questionBankTestId = row ? await loadQuestionBankTestIdByTestId(connection, row.test_id) : null;
    const sequencePlan = row ? buildSequencePlan(await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, row.attempt_id)) : null;
    if (row && sequencePlan && sequencePlan.speedEntryIndex === null) {
      return { data: null, error: "La sequence du test ne contient pas de phase rapidite." };
    }
    const resolvedQuestions = row && sequencePlan && questionBankTestId ? await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan) : null;
    const speedQuestionKeys = resolvedQuestions?.specialQuestionKeysByType.speed ?? null;
    const speedEntry = sequencePlan?.entries.find((entry): entry is Extract<SequenceEntry, { type: "speed" }> => entry.type === "speed") ?? null;

    if (!row) {
      return { data: null, error: "Introduction rapidite introuvable pour cette tentative." };
    }

    return {
      data: {
        attempt: {
          id: row.attempt_id,
          token: row.attempt_token,
          status: row.status,
          userId: row.user_id,
          testId: row.test_id,
          testTitle: row.test_title,
        },
        section: {
          id: row.section_id,
          key: row.section_key,
          title: row.section_title,
          description: row.section_description,
          questionCount: speedQuestionKeys ? speedQuestionKeys.length : row.question_count,
          totalTimeLimitSeconds: speedEntry?.totalTimeLimitSeconds ?? row.time_limit_seconds ?? 120,
          timeLimitSeconds: speedEntry?.timeLimitSeconds ?? null,
        },
        nextUrl: `/iq/attempt/${row.attempt_token}/phase/speed`,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger l'introduction rapidite depuis MySQL : ${message}`
          : "Impossible de charger l'introduction rapidite pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function completeIqAttempt(token: string): Promise<CompleteIqAttemptResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, a.status, a.user_id, a.test_id
       FROM iq_attempts a
       WHERE a.attempt_token = ?
       LIMIT 1`,
      [token]
    );
    const attempt = (attemptRows as { id: number; attempt_token: string; status: string; user_id: number | null; test_id: number }[])[0];

    if (!attempt) {
      return { completion: null, error: "Tentative de test de logique introuvable." };
    }

    const questionBankTestId = await loadQuestionBankTestIdByTestId(connection, attempt.test_id);
    const resolvedSequence = await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, attempt.id);
    const sequencePlan = buildSequencePlan(resolvedSequence);
    const { totalQuestions } = await getSequenceQuestionCounts(
      connection,
      questionBankTestId,
      sequencePlan,
      getEnabledLongMemoryItems(resolvedSequence)
    );

    const [aggregateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
          COUNT(DISTINCT CASE WHEN aa.response_time_ms <> ? OR aa.response_time_ms IS NULL THEN aa.question_id END) AS answered_questions,
          COALESCE(SUM(aa.points_earned), 0) AS raw_score,
          COALESCE(SUM(aa.points_earned), 0) AS weighted_score,
          ROUND(AVG(CASE WHEN aa.response_time_ms <> ? THEN aa.response_time_ms END)) AS average_response_time_ms,
          COALESCE(SUM(CASE WHEN s.section_key = 'speed' THEN aa.points_earned ELSE 0 END), 0) AS speed_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'memory' THEN aa.points_earned ELSE 0 END), 0) AS memory_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'verbal' THEN aa.points_earned ELSE 0 END), 0) AS verbal_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'logic' THEN aa.points_earned ELSE 0 END), 0) AS logic_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'quantitative' THEN aa.points_earned ELSE 0 END), 0) AS quantitative_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'audio_memory' THEN aa.points_earned ELSE 0 END), 0) AS audio_memory_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'long_memory' THEN aa.points_earned ELSE 0 END), 0) AS long_memory_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'spatial' THEN aa.points_earned ELSE 0 END), 0) AS spatial_score
       FROM iq_attempt_answers aa
       INNER JOIN iq_sections s ON s.id = aa.section_id
       WHERE aa.attempt_id = ?`,
      [NOT_PRESENTED_RESPONSE_TIME_MS, NOT_PRESENTED_RESPONSE_TIME_MS, attempt.id]
    );
    const aggregates = (aggregateRows as mysql.RowDataPacket[])[0] as {
      answered_questions: number;
      raw_score: string | number;
      weighted_score: string | number;
      average_response_time_ms: number | null;
      speed_score: string | number;
      memory_score: string | number;
      verbal_score: string | number;
      logic_score: string | number;
      quantitative_score: string | number;
      audio_memory_score: string | number;
      long_memory_score: string | number;
      spatial_score: string | number;
    };

    await connection.execute(
      `UPDATE iq_attempts
       SET status = 'completed',
           completed_at = COALESCE(completed_at, NOW()),
           total_questions = ?,
           answered_questions = ?,
           raw_score = ?,
           weighted_score = ?,
           estimated_iq_score = NULL,
           speed_score = ?,
           memory_score = ?,
           verbal_score = ?,
           logic_score = ?,
           quantitative_score = ?,
           audio_memory_score = ?,
           long_memory_score = ?,
           spatial_score = ?,
           average_response_time_ms = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        totalQuestions,
        aggregates.answered_questions ?? 0,
        Number(aggregates.raw_score ?? 0),
        Number(aggregates.weighted_score ?? 0),
        Number(aggregates.speed_score ?? 0),
        Number(aggregates.memory_score ?? 0),
        Number(aggregates.verbal_score ?? 0),
        Number(aggregates.logic_score ?? 0),
        Number(aggregates.quantitative_score ?? 0),
        Number(aggregates.audio_memory_score ?? 0),
        Number(aggregates.long_memory_score ?? 0),
        Number(aggregates.spatial_score ?? 0),
        aggregates.average_response_time_ms ?? null,
        attempt.id,
      ]
    );

    return {
      completion: {
        attemptToken: attempt.attempt_token,
        userAttached: Boolean(attempt.user_id),
        redirectUrl: attempt.user_id ? `/iq/results/${attempt.attempt_token}` : null,
        guestResultReady: !attempt.user_id,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      completion: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de finaliser la tentative de test de logique depuis MySQL : ${message}`
          : "Impossible de finaliser cette tentative pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function cleanupAbandonedIqAttempts(olderThanHours = ABANDONED_ATTEMPT_CLEANUP_HOURS): Promise<CleanupAbandonedIqAttemptsResult> {
  let connection: mysql.Connection | undefined;
  const safeOlderThanHours = Number.isInteger(olderThanHours) && olderThanHours > 0 ? olderThanHours : ABANDONED_ATTEMPT_CLEANUP_HOURS;

  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [answersResult] = await connection.execute<mysql.ResultSetHeader>(
      `DELETE aa
       FROM iq_attempt_answers aa
       INNER JOIN iq_attempts a ON a.id = aa.attempt_id
       WHERE a.status IN (?, ?)
         AND a.started_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [...CLEANUP_ABANDONED_ATTEMPT_STATUSES, safeOlderThanHours]
    );

    const [attemptsResult] = await connection.execute<mysql.ResultSetHeader>(
      `DELETE FROM iq_attempts
       WHERE status IN (?, ?)
         AND started_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [...CLEANUP_ABANDONED_ATTEMPT_STATUSES, safeOlderThanHours]
    );

    await connection.commit();

    return {
      deletedAnswers: answersResult.affectedRows,
      deletedAttempts: attemptsResult.affectedRows,
      olderThanHours: safeOlderThanHours,
      statuses: CLEANUP_ABANDONED_ATTEMPT_STATUSES,
    };
  } catch (error) {
    await connection?.rollback();

    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      deletedAnswers: 0,
      deletedAttempts: 0,
      olderThanHours: safeOlderThanHours,
      statuses: CLEANUP_ABANDONED_ATTEMPT_STATUSES,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de nettoyer les tentatives QI abandonnees : ${message}`
          : "Impossible de nettoyer les tentatives QI abandonnees pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

async function computeIqAttemptScores(connection: mysql.Connection, attemptId: number) {
  const [answeredQuestionRows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT q.question_key
     FROM iq_attempt_answers aa
     INNER JOIN iq_questions q ON q.id = aa.question_id
     WHERE aa.attempt_id = ?
       AND (aa.response_time_ms IS NULL OR aa.response_time_ms <> ?)`,
    [attemptId, NOT_PRESENTED_RESPONSE_TIME_MS]
  );
  const answeredQuestionKeys = new Set((answeredQuestionRows as Array<{ question_key: string }>).map((row) => row.question_key));
  const resolvedSequenceDefinition = await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, attemptId);

  let answeredQuestions = 0;

  for (const step of resolvedSequenceDefinition.steps) {
    if (step.type === "question") {
      answeredQuestions += answeredQuestionKeys.has(step.questionKey) ? 1 : 0;
      continue;
    }

    if (step.type === "memory") {
      answeredQuestions += step.items.reduce((total, item) => {
        return total + (answeredQuestionKeys.has(item.questionKey) ? 1 : 0);
      }, 0);
      continue;
    }

    if ("questionKeys" in step && Array.isArray(step.questionKeys)) {
      answeredQuestions += step.questionKeys.reduce((total, questionKey) => total + (answeredQuestionKeys.has(questionKey) ? 1 : 0), 0);
    }
  }

  if (resolvedSequenceDefinition.longMemory?.enabled) {
    answeredQuestions += resolvedSequenceDefinition.longMemory.items.reduce(
      (total, item) => total + (answeredQuestionKeys.has(item.questionKey) ? 1 : 0),
      0
    );
  }

  const [aggregateRows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT
        COALESCE(SUM(CASE WHEN aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS raw_score,
        ROUND(AVG(CASE WHEN aa.response_time_ms <> ? THEN aa.response_time_ms END)) AS average_response_time_ms,
        COALESCE(SUM(CASE WHEN s.section_key = 'speed' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS speed_score,
        COALESCE(SUM(CASE WHEN s.section_key = 'memory' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS memory_score,
        COALESCE(SUM(CASE WHEN s.section_key = 'verbal' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS verbal_score,
        COALESCE(SUM(CASE WHEN s.section_key = 'logic' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS logic_score,
        COALESCE(SUM(CASE WHEN s.section_key = 'quantitative' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS quantitative_score,
        COALESCE(SUM(CASE WHEN s.section_key = 'audio_memory' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS audio_memory_score,
        COALESCE(SUM(CASE WHEN s.section_key = 'long_memory' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS long_memory_score,
        COALESCE(SUM(CASE WHEN s.section_key = 'spatial' AND aa.is_correct = 1 THEN q.weight ELSE 0 END), 0) AS spatial_score
     FROM iq_attempt_answers aa
     INNER JOIN iq_questions q ON q.id = aa.question_id
     INNER JOIN iq_sections s ON s.id = aa.section_id
     WHERE aa.attempt_id = ?`,
    [NOT_PRESENTED_RESPONSE_TIME_MS, attemptId]
  );

  const aggregate = (aggregateRows as IqComputedScoreRow[])[0];

  return {
    answeredQuestions,
    rawScore: Number(aggregate?.raw_score ?? 0),
    weightedScore: Number(aggregate?.raw_score ?? 0),
    averageResponseTimeMs: aggregate?.average_response_time_ms ?? null,
    sectionScoreByKey: {
      verbal: Number(aggregate?.verbal_score ?? 0),
      logic: Number(aggregate?.logic_score ?? 0),
      quantitative: Number(aggregate?.quantitative_score ?? 0),
      audio_memory: Number(aggregate?.audio_memory_score ?? 0),
      long_memory: Number(aggregate?.long_memory_score ?? 0),
      spatial: Number(aggregate?.spatial_score ?? 0),
      memory: Number(aggregate?.memory_score ?? 0),
      speed: Number(aggregate?.speed_score ?? 0),
    },
  };
}

async function insertChoiceSiblingSentinelAnswers(
  connection: mysql.Connection,
  answerData: PreparedIqAnswerRow
) {
  const sequenceDefinition = await loadTestSequenceDefinitionByTestId(connection, answerData.test_id);
  const siblingQuestionKeys = getChoiceSiblingQuestionKeys(sequenceDefinition, answerData.question_key);

  if (siblingQuestionKeys.length === 0) {
    return;
  }

  const placeholders = siblingQuestionKeys.map(() => "?").join(", ");
  const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT q.id AS question_id, q.section_id, q.difficulty_level, q.weight
     FROM iq_tests t
     INNER JOIN iq_questions q ON q.test_id = COALESCE(t.question_bank_test_id, t.id)
     INNER JOIN iq_sections s ON s.id = q.section_id
     WHERE t.id = ?
       AND q.is_active = 1
       AND s.is_active = 1
       AND q.question_key IN (${placeholders})`,
    [answerData.test_id, ...siblingQuestionKeys]
  );

  for (const row of questionRows as Array<{ question_id: number; section_id: number; difficulty_level: number; weight: string | number }>) {
    const [existingRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id
       FROM iq_attempt_answers
       WHERE attempt_id = ? AND question_id = ?
       LIMIT 1`,
      [answerData.attempt_id, row.question_id]
    );

    if ((existingRows as Array<{ id: number }>).length > 0) {
      continue;
    }

    await connection.execute(
      `INSERT INTO iq_attempt_answers
       (attempt_id, test_id, section_id, question_id, user_id, selected_option_id, selected_position,
        correct_position, is_correct, difficulty_level, response_time_ms, displayed_at, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        answerData.attempt_id,
        answerData.test_id,
        row.section_id,
        row.question_id,
        answerData.user_id,
        null,
        null,
        null,
        0,
        row.difficulty_level,
        NOT_PRESENTED_RESPONSE_TIME_MS,
        null,
      ]
    );
  }
}

export async function getIqResultByToken(token: string, userId: number): Promise<IqResultResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, a.test_id, t.title AS test_title, t.slug AS test_slug, a.status, a.user_id, a.started_at, a.completed_at,
              a.total_questions, a.answered_questions, a.raw_score, a.weighted_score, a.estimated_iq_score,
              a.speed_score, a.memory_score, a.verbal_score, a.logic_score, a.quantitative_score, a.audio_memory_score, a.long_memory_score, a.spatial_score,
              a.average_response_time_ms
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.attempt_token = ?
      LIMIT 1`,
      [token]
    );
    const row = (rows as IqResultRow[])[0];

    if (!row) {
      return { result: null, error: "not-found" };
    }

    if (!row.user_id) {
      return { result: null, error: "unattached" };
    }

    if (row.user_id !== userId) {
      return { result: null, error: "forbidden" };
    }

    const questionBankTestId = await loadQuestionBankTestIdByTestId(connection, row.test_id);
    const resolvedSequence = await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, row.id);
    const sequencePlan = buildSequencePlan(resolvedSequence);
    const resolvedQuestions = await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan);
    const orderedSectionKeys = getOrderedSequenceSectionKeys(
      sequencePlan,
      resolvedQuestions.questionSectionByKey,
      getEnabledLongMemoryItems(resolvedSequence)
    );
    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.section_key, s.title AS section_title
       FROM iq_sections s
       WHERE s.test_id = ?
         AND s.is_active = 1`,
      [questionBankTestId]
    );
    const maxScoreBySection = await getSequenceSectionMaxScores(
      connection,
      questionBankTestId,
      sequencePlan,
      getEnabledLongMemoryItems(resolvedSequence)
    );
    const computedScores = await computeIqAttemptScores(connection, row.id);
    const sectionScoreByKey = computedScores.sectionScoreByKey;
    const sectionRowsByKey = new Map((sectionRows as IqSectionBreakdownRow[]).map((section) => [section.section_key, section]));
    const sectionBreakdown = orderedSectionKeys.map((sectionKey) => {
      const section = sectionRowsByKey.get(sectionKey);

      if (!section) {
        return null;
      }

      const key = section.section_key as keyof typeof sectionScoreByKey;
      const maxScore = maxScoreBySection.get(section.section_key) ?? 0;
      const score = sectionScoreByKey[key] ?? 0;

      return {
        key: section.section_key,
        label: section.section_title,
        score,
        maxScore,
        percentage: maxScore > 0 ? clampPercentage((score / maxScore) * 100) : 0,
      };
    }).filter((section): section is IqResultSectionBreakdown => Boolean(section));

    return {
      result: {
        attemptToken: row.attempt_token,
        testTitle: row.test_title,
        testSlug: row.test_slug,
        status: row.status,
        userId: row.user_id,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        totalQuestions: row.total_questions,
        answeredQuestions: computedScores.answeredQuestions,
        rawScore: computedScores.rawScore,
        weightedScore: computedScores.weightedScore,
        estimatedIqScore: row.estimated_iq_score === null ? null : Number(row.estimated_iq_score),
        speedScore: computedScores.sectionScoreByKey.speed,
        memoryScore: computedScores.sectionScoreByKey.memory,
        verbalScore: computedScores.sectionScoreByKey.verbal,
        logicScore: computedScores.sectionScoreByKey.logic,
        quantitativeScore: computedScores.sectionScoreByKey.quantitative,
        audioMemoryScore: computedScores.sectionScoreByKey.audio_memory,
        longMemoryScore: computedScores.sectionScoreByKey.long_memory,
        spatialScore: computedScores.sectionScoreByKey.spatial,
        averageResponseTimeMs: computedScores.averageResponseTimeMs,
        sectionBreakdown,
      },
    };
  } catch {
    return { result: null, error: "load-error" };
  } finally {
    await connection?.end();
  }
}

async function loadIqSondageReviewByAttempt(
  connection: mysql.Connection,
  attempt: IqSondageReviewAttemptRow
): Promise<IqSondageReviewResult> {
  const orderedSectionKeys = ["logic", "spatial", "verbal", "quantitative", "memory", "long_memory", "audio_memory"] as const;
  const [answerRows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT q.id AS question_id, s.section_key, s.title AS section_title, q.question_key, q.question_text, q.answer_prompt_text, q.stimulus_text,
            q.question_format, COALESCE(overlay.question_image_url, q.question_image_url) AS question_image_url,
            overlay.answers_image_url, audio.prompt_audio_url,
            selected.option_key AS selected_option_key, selected.option_text AS selected_option_text,
            correct.option_key AS correct_option_key, correct.option_text AS correct_option_text,
            aa.selected_position, aa.correct_position, aa.is_correct, aa.response_time_ms
     FROM iq_attempt_answers aa
     INNER JOIN iq_questions q ON q.id = aa.question_id
     INNER JOIN iq_sections s ON s.id = aa.section_id
     LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
     LEFT JOIN iq_audio_memory_questions audio ON audio.question_id = q.id
     LEFT JOIN iq_question_options selected ON selected.id = aa.selected_option_id
     LEFT JOIN iq_question_options correct ON correct.question_id = aa.question_id AND correct.is_correct = 1 AND correct.is_active = 1
     WHERE aa.attempt_id = ?
       AND s.section_key IN ('logic', 'spatial', 'verbal', 'quantitative', 'memory', 'long_memory', 'audio_memory')
       AND (aa.response_time_ms IS NULL OR aa.response_time_ms <> ?)
     ORDER BY FIELD(s.section_key, 'logic', 'spatial', 'verbal', 'quantitative', 'memory', 'long_memory', 'audio_memory'),
              q.position,
              aa.id`,
    [attempt.id, NOT_PRESENTED_RESPONSE_TIME_MS]
  );

  const questionIds = Array.from(new Set((answerRows as IqSondageReviewRow[]).map((row) => row.question_id)));
  const optionsByQuestionId = new Map<number, IqSondageReviewQuestion["options"]>();

  if (questionIds.length > 0) {
    const placeholders = questionIds.map(() => "?").join(", ");
    const [optionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT question_id, option_key, option_text, position, option_image_url
       FROM iq_question_options
       WHERE is_active = 1
         AND question_id IN (${placeholders})
       ORDER BY question_id, position`,
      questionIds
    );

    for (const option of optionRows as IqSondageReviewOptionRow[]) {
      const existing = optionsByQuestionId.get(option.question_id) ?? [];
      existing.push({
        key: option.option_key,
        text: option.option_text,
        position: option.position,
        audioUrl: option.option_image_url,
      });
      optionsByQuestionId.set(option.question_id, existing);
    }
  }

  const sectionMap = new Map<string, IqSondageReviewSection>();

  for (const row of answerRows as IqSondageReviewRow[]) {
    const existingSection = sectionMap.get(row.section_key);
    const section =
      existingSection ??
      {
        key: row.section_key,
        label: row.section_title,
        questions: [],
      };

    section.questions.push({
      sectionKey: row.section_key,
      sectionTitle: row.section_title,
      questionKey: row.question_key,
      questionText: row.question_text,
      answerPromptText: row.answer_prompt_text,
      stimulusText: row.stimulus_text,
      format: row.question_format,
      imageUrl: row.question_image_url,
      answersImageUrl: row.answers_image_url,
      promptAudioUrl: row.prompt_audio_url,
      selectedOptionKey: row.selected_option_key,
      selectedOptionText: row.selected_option_text,
      correctOptionKey: row.correct_option_key,
      correctOptionText: row.correct_option_text,
      selectedPosition: row.selected_position,
      correctPosition: row.correct_position,
      isCorrect: row.is_correct === 1,
      responseTimeMs: row.response_time_ms,
      options: optionsByQuestionId.get(row.question_id) ?? [],
    });

    if (!existingSection) {
      sectionMap.set(row.section_key, section);
    }
  }

  const sections = orderedSectionKeys
    .map((sectionKey) => sectionMap.get(sectionKey))
    .filter((section): section is IqSondageReviewSection => Boolean(section && section.questions.length > 0));

  if (sections.length === 0) {
    return { review: null, error: "not-found" };
  }

  return {
    review: {
      email: attempt.email,
      userPseudo: attempt.pseudo,
      attemptToken: attempt.attempt_token,
      sections,
    },
  };
}

export async function getIqSondageReviewByEmail(email: string): Promise<IqSondageReviewResult> {
  let connection: mysql.Connection | undefined;

  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { review: null, error: "not-found" };
    }

    connection = await mysql.createConnection(dbConfig);

    const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, u.email, u.pseudo
       FROM users u
       INNER JOIN iq_attempts a ON a.user_id = u.id
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE LOWER(u.email) = ?
         AND t.slug = 'sondage'
         AND a.status = 'completed'
       ORDER BY a.completed_at DESC, a.id DESC
       LIMIT 1`,
      [normalizedEmail]
    );
    const attempt = (attemptRows as IqSondageReviewAttemptRow[])[0];

    if (!attempt) {
      return { review: null, error: "not-found" };
    }

    return await loadIqSondageReviewByAttempt(connection, attempt);
  } catch {
    return { review: null, error: "load-error" };
  } finally {
    await connection?.end();
  }
}

export async function getIqSondageReviewByToken(token: string): Promise<IqSondageReviewResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, u.email, u.pseudo
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.attempt_token = ?
         AND t.slug = 'sondage'
         AND a.status = 'completed'
       LIMIT 1`,
      [token]
    );
    const attempt = (attemptRows as IqSondageReviewAttemptRow[])[0];

    if (!attempt) {
      return { review: null, error: "not-found" };
    }

    return await loadIqSondageReviewByAttempt(connection, attempt);
  } catch {
    return { review: null, error: "load-error" };
  } finally {
    await connection?.end();
  }
}

export async function getIqResultByTokenForEmail(token: string): Promise<IqResultResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, a.test_id, t.title AS test_title, t.slug AS test_slug, a.status, a.user_id, a.started_at, a.completed_at,
              a.total_questions, a.answered_questions, a.raw_score, a.weighted_score, a.estimated_iq_score,
              a.speed_score, a.memory_score, a.verbal_score, a.logic_score, a.quantitative_score, a.audio_memory_score, a.long_memory_score, a.spatial_score,
              a.average_response_time_ms
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.attempt_token = ?
         AND a.status = 'completed'
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqResultRow[])[0];

    if (!row) {
      return { result: null, error: "not-found" };
    }

    const questionBankTestId = await loadQuestionBankTestIdByTestId(connection, row.test_id);
    const resolvedSequence = await loadResolvedAttemptSequenceDefinitionByAttemptId(connection, row.id);
    const sequencePlan = buildSequencePlan(resolvedSequence);
    const resolvedQuestions = await resolveSequenceQuestionSections(connection, questionBankTestId, sequencePlan);
    const orderedSectionKeys = getOrderedSequenceSectionKeys(
      sequencePlan,
      resolvedQuestions.questionSectionByKey,
      getEnabledLongMemoryItems(resolvedSequence)
    );
    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.section_key, s.title AS section_title
       FROM iq_sections s
       WHERE s.test_id = ?
         AND s.is_active = 1`,
      [questionBankTestId]
    );
    const maxScoreBySection = await getSequenceSectionMaxScores(
      connection,
      questionBankTestId,
      sequencePlan,
      getEnabledLongMemoryItems(resolvedSequence)
    );
    const computedScores = await computeIqAttemptScores(connection, row.id);
    const sectionScoreByKey = computedScores.sectionScoreByKey;
    const sectionRowsByKey = new Map((sectionRows as IqSectionBreakdownRow[]).map((section) => [section.section_key, section]));
    const sectionBreakdown = orderedSectionKeys.map((sectionKey) => {
      const section = sectionRowsByKey.get(sectionKey);

      if (!section) {
        return null;
      }

      const key = section.section_key as keyof typeof sectionScoreByKey;
      const maxScore = maxScoreBySection.get(section.section_key) ?? 0;
      const score = sectionScoreByKey[key] ?? 0;

      return {
        key: section.section_key,
        label: section.section_title,
        score,
        maxScore,
        percentage: maxScore > 0 ? clampPercentage((score / maxScore) * 100) : 0,
      };
    }).filter((section): section is IqResultSectionBreakdown => Boolean(section));

    return {
      result: {
        attemptToken: row.attempt_token,
        testTitle: row.test_title,
        testSlug: row.test_slug,
        status: row.status,
        userId: row.user_id,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        totalQuestions: row.total_questions,
        answeredQuestions: computedScores.answeredQuestions,
        rawScore: computedScores.rawScore,
        weightedScore: computedScores.weightedScore,
        estimatedIqScore: row.estimated_iq_score === null ? null : Number(row.estimated_iq_score),
        speedScore: computedScores.sectionScoreByKey.speed,
        memoryScore: computedScores.sectionScoreByKey.memory,
        verbalScore: computedScores.sectionScoreByKey.verbal,
        logicScore: computedScores.sectionScoreByKey.logic,
        quantitativeScore: computedScores.sectionScoreByKey.quantitative,
        audioMemoryScore: computedScores.sectionScoreByKey.audio_memory,
        longMemoryScore: computedScores.sectionScoreByKey.long_memory,
        spatialScore: computedScores.sectionScoreByKey.spatial,
        averageResponseTimeMs: computedScores.averageResponseTimeMs,
        sectionBreakdown,
      },
    };
  } catch {
    return { result: null, error: "load-error" };
  } finally {
    await connection?.end();
  }
}
