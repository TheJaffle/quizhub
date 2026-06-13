import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getIqDiagnosticAttempts } from "@/lib/iq-diagnostic";
import { AlertTriangle } from "lucide-react";
import { Fragment } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Diagnostic QI | Free Logic Test",
  robots: {
    index: false,
    follow: false,
  },
};

const sectionColumns = [
  { key: "verbal", label: "Verb" },
  { key: "logic", label: "Log" },
  { key: "spatial", label: "Spa" },
  { key: "quantitative", label: "Quant" },
  { key: "long_memory", label: "Long" },
  { key: "memory", label: "Mem" },
  { key: "audio_memory", label: "Audio" },
  { key: "speed", label: "Speed" },
];

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function compactText(value: string | null | undefined, maxLength = 90) {
  if (!value) return "-";

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function answerValue(key: string | null, text: string | null, position: number | null) {
  if (position) return `Position ${position}`;
  if (key && text) return `${key}. ${text}`;
  if (key) return key;

  return text ?? "-";
}

function sourceLabel(source: "recorded" | "expected_missing") {
  return source === "recorded" ? "enreg." : "manque";
}

export default async function IqDiagnosticPage() {
  const { attempts, error } = await getIqDiagnosticAttempts();
  const answers = attempts.flatMap((attempt) => attempt.answers);
  const recordedAnswers = answers.filter((answer) => answer.source === "recorded");
  const missingAnswers = answers.filter((answer) => answer.source === "expected_missing");
  const emailCount = new Set(attempts.map((attempt) => attempt.email).filter(Boolean)).size;

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Impossible de charger le diagnostic QI</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1800px] px-3 py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-2">
            Page provisoire
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Diagnostic des réponses QI</h1>
          <p className="text-sm text-muted-foreground">
            {emailCount} email(s), {attempts.length} tentative(s), {recordedAnswers.length} réponse(s) enregistrée(s),
            {" "}
            {missingAnswers.length} question(s) attendue(s) sans détail.
          </p>
        </div>
      </div>

      <section className="mb-5 overflow-x-auto rounded-lg border bg-background">
        <table className="w-full min-w-[1420px] border-collapse text-[8px] leading-tight">
          <thead className="sticky top-0 bg-muted text-left">
            <tr>
              <th className="border-b px-1.5 py-1">Date</th>
              <th className="border-b px-1.5 py-1">Email</th>
              <th className="border-b px-1.5 py-1">Pseudo</th>
              <th className="border-b px-1.5 py-1">Test</th>
              <th className="border-b px-1.5 py-1">Statut</th>
              <th className="border-b px-1.5 py-1">Réponses</th>
              {sectionColumns.map((section) => (
                <th key={section.key} className="border-b px-1.5 py-1 text-center" colSpan={3}>
                  {section.label}
                </th>
              ))}
              <th className="border-b px-1.5 py-1">Sections vues</th>
              <th className="border-b px-1.5 py-1">Token</th>
            </tr>
            <tr>
              <th className="border-b px-1.5 py-1" colSpan={6} />
              {sectionColumns.map((section) => (
                <Fragment key={`${section.key}-subhead`}>
                  <th className="border-b px-1.5 py-1 text-center">
                    R
                  </th>
                  <th className="border-b px-1.5 py-1 text-center">
                    E
                  </th>
                  <th className="border-b px-1.5 py-1 text-center">
                    S
                  </th>
                </Fragment>
              ))}
              <th className="border-b px-1.5 py-1" colSpan={2} />
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.attemptId} className="odd:bg-muted/20">
                <td className="border-b px-1.5 py-1 whitespace-nowrap">{formatDate(attempt.startedAt)}</td>
                <td className="border-b px-1.5 py-1">{attempt.email ?? "-"}</td>
                <td className="border-b px-1.5 py-1">{attempt.pseudo ?? "-"}</td>
                <td className="border-b px-1.5 py-1">{attempt.testTitle}</td>
                <td className="border-b px-1.5 py-1">{attempt.status}</td>
                <td className="border-b px-1.5 py-1 whitespace-nowrap">
                  {attempt.answers.filter((answer) => answer.source === "recorded").length} / {attempt.totalQuestions || attempt.answeredQuestions || "-"}
                </td>
                {sectionColumns.map((section) => {
                  const count = attempt.sectionCounts[section.key] ?? 0;
                  const expectedCount = attempt.expectedSectionCounts[section.key] ?? 0;
                  const score = attempt.sectionScores[section.key] ?? null;

                  return (
                    <Fragment key={section.key}>
                      <td className={`border-b px-1.5 py-1 text-center font-semibold ${count === 0 ? "text-red-500" : "text-emerald-700"}`}>
                        {count}
                      </td>
                      <td className={`border-b px-1.5 py-1 text-center font-semibold ${expectedCount > count ? "text-amber-700" : "text-slate-500"}`}>
                        {expectedCount || "-"}
                      </td>
                      <td className={`border-b px-1.5 py-1 text-center font-semibold ${score === null ? "text-muted-foreground" : score > 0 ? "text-blue-700" : "text-slate-500"}`}>
                        {score ?? "-"}
                      </td>
                    </Fragment>
                  );
                })}
                <td className="border-b px-1.5 py-1">{attempt.sections.join(", ") || "-"}</td>
                <td className="border-b px-1.5 py-1 font-mono">{attempt.attemptToken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full min-w-[1500px] border-collapse text-[8px] leading-tight">
          <thead className="sticky top-0 bg-muted text-left">
            <tr>
              <th className="border-b px-1.5 py-1">Date</th>
              <th className="border-b px-1.5 py-1">Email</th>
              <th className="border-b px-1.5 py-1">Pseudo</th>
              <th className="border-b px-1.5 py-1">Donnée</th>
              <th className="border-b px-1.5 py-1">Section</th>
              <th className="border-b px-1.5 py-1">Question</th>
              <th className="border-b px-1.5 py-1">Réponse donnée</th>
              <th className="border-b px-1.5 py-1">Bonne réponse</th>
              <th className="border-b px-1.5 py-1">Juste</th>
              <th className="border-b px-1.5 py-1">Pts</th>
              <th className="border-b px-1.5 py-1">Temps</th>
              <th className="border-b px-1.5 py-1">Token</th>
            </tr>
          </thead>
          <tbody>
            {answers.map((answer, index) => (
              <tr
                key={`${answer.attemptId}-${answer.questionKey}-${index}`}
                className={`${answer.source === "expected_missing" ? "bg-amber-50 text-slate-500" : "odd:bg-muted/20"}`}
              >
                <td className="border-b px-1.5 py-1 whitespace-nowrap">{formatDate(answer.answeredAt ?? answer.startedAt)}</td>
                <td className="border-b px-1.5 py-1">{answer.email ?? "-"}</td>
                <td className="border-b px-1.5 py-1">{answer.pseudo ?? "-"}</td>
                <td className={`border-b px-1.5 py-1 font-semibold ${answer.source === "recorded" ? "text-emerald-700" : "text-amber-700"}`}>
                  {sourceLabel(answer.source)}
                </td>
                <td className="border-b px-1.5 py-1 whitespace-nowrap">{answer.sectionKey ?? "-"}</td>
                <td className="border-b px-1.5 py-1">
                  <span className="font-mono">{answer.questionKey ?? "-"}</span> {compactText(answer.questionText)}
                </td>
                <td className="border-b px-1.5 py-1">
                  {answer.source === "expected_missing"
                    ? "Réponse non enregistrée dans iq_attempt_answers"
                    : compactText(answerValue(answer.selectedOptionKey, answer.selectedOptionText, answer.selectedPosition), 70)}
                </td>
                <td className="border-b px-1.5 py-1">{compactText(answerValue(answer.correctOptionKey, answer.correctOptionText, answer.correctPosition), 70)}</td>
                <td className={`border-b px-1.5 py-1 font-bold ${answer.isCorrect ? "text-emerald-700" : answer.isCorrect === false ? "text-red-600" : "text-slate-500"}`}>
                  {answer.isCorrect === null ? "-" : answer.isCorrect ? "OUI" : "NON"}
                </td>
                <td className="border-b px-1.5 py-1">{answer.pointsEarned}</td>
                <td className="border-b px-1.5 py-1 whitespace-nowrap">{answer.responseTimeMs === null ? "-" : `${answer.responseTimeMs} ms`}</td>
                <td className="border-b px-1.5 py-1 font-mono">{answer.attemptToken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
