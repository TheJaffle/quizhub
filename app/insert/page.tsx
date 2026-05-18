"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type IqTest = {
  id: number;
  title: string;
  slug: string;
};

type IqSection = {
  id: number;
  test_id: number;
  section_key: string;
  title: string;
  section_type: string;
};

type OptionForm = {
  key: string;
  text: string;
  imageUrl: string;
  isCorrect: boolean;
};

type InsertData = {
  tests: IqTest[];
  sections: IqSection[];
  formats: string[];
};

const DEFAULT_OPTIONS: OptionForm[] = ["A", "B", "C", "D", "E", "F"].map((key, index) => ({
  key,
  text: "",
  imageUrl: "",
  isCorrect: index === 0,
}));

function isOverlayFormat(format: string) {
  return format === "visual_overlay" || format === "spatial_overlay";
}

export default function InsertIqQuestionPage() {
  const [data, setData] = useState<InsertData>({ tests: [], sections: [], formats: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testId, setTestId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [questionFormat, setQuestionFormat] = useState("text");
  const [questionKey, setQuestionKey] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [stimulusText, setStimulusText] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("1");
  const [weight, setWeight] = useState("1");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState("");
  const [displayTimeSeconds, setDisplayTimeSeconds] = useState("");
  const [hideStimulusAfterSeconds, setHideStimulusAfterSeconds] = useState("");
  const [options, setOptions] = useState<OptionForm[]>(DEFAULT_OPTIONS);
  const [answersImageUrl, setAnswersImageUrl] = useState("");
  const [answerCount, setAnswerCount] = useState("4");
  const [gridColumns, setGridColumns] = useState("2");
  const [gridRows, setGridRows] = useState("2");
  const [correctPosition, setCorrectPosition] = useState("1");
  const [correctionText, setCorrectionText] = useState("");

  useEffect(() => {
    async function loadInsertData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/iq/insert-question", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger la page d'insertion.");
        }

        setData(payload);
        setTestId(payload.tests[0]?.id ? String(payload.tests[0].id) : "");
        setSectionId(payload.sections[0]?.id ? String(payload.sections[0].id) : "");
        setQuestionFormat(payload.formats[0] ?? "text");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger la page d'insertion.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadInsertData();
  }, []);

  const availableSections = useMemo(() => data.sections.filter((section) => String(section.test_id) === testId), [data.sections, testId]);
  const overlayMode = isOverlayFormat(questionFormat);

  useEffect(() => {
    if (!availableSections.some((section) => String(section.id) === sectionId)) {
      setSectionId(availableSections[0]?.id ? String(availableSections[0].id) : "");
    }
  }, [availableSections, sectionId]);

  useEffect(() => {
    if (answerCount === "6") {
      setGridColumns("3");
      setGridRows("2");
      return;
    }

    setGridColumns("2");
    setGridRows("2");
  }, [answerCount]);

  const updateOption = (index: number, patch: Partial<OptionForm>) => {
    setOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) => {
        if (optionIndex !== index) return option;

        return {
          ...option,
          ...patch,
        };
      })
    );
  };

  const markCorrectOption = (index: number) => {
    setOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      }))
    );
  };

  const resetQuestionOnly = () => {
    setQuestionKey("");
    setQuestionText("");
    setStimulusText("");
    setQuestionImageUrl("");
    setExplanation("");
    setTimeLimitSeconds("");
    setDisplayTimeSeconds("");
    setHideStimulusAfterSeconds("");
    setOptions(DEFAULT_OPTIONS);
    setAnswersImageUrl("");
    setAnswerCount("4");
    setGridColumns("2");
    setGridRows("2");
    setCorrectPosition("1");
    setCorrectionText("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/iq/insert-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: Number(testId),
          sectionId: Number(sectionId),
          questionFormat,
          questionKey,
          questionText,
          stimulusText,
          questionImageUrl,
          explanation,
          difficultyLevel: Number(difficultyLevel),
          weight: Number(weight),
          timeLimitSeconds: timeLimitSeconds ? Number(timeLimitSeconds) : null,
          displayTimeSeconds: displayTimeSeconds ? Number(displayTimeSeconds) : null,
          hideStimulusAfterSeconds: hideStimulusAfterSeconds ? Number(hideStimulusAfterSeconds) : null,
          options,
          overlay: {
            questionImageUrl,
            answersImageUrl,
            answerCount: Number(answerCount),
            gridColumns: Number(gridColumns),
            gridRows: Number(gridRows),
            correctPosition: Number(correctPosition),
            correctionText,
          },
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Insertion impossible.");
      }

      setMessage(`Question ajoutee : id ${payload.questionId}, cle ${payload.questionKey}, position ${payload.position}.`);
      resetQuestionOnly();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Insertion impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Page temporaire sans login pour insertion locale des questions de raisonnement. A supprimer quand la saisie est terminee.
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Insérer des questions de logique</h1>
          <p className="mt-2 text-slate-600">Ajout rapide de questions avec ou sans image, pour toutes les sections de raisonnement.</p>
        </div>

        {isLoading ? <p className="rounded-xl bg-white p-4 shadow-sm">Chargement...</p> : null}
        {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-5 shadow-sm md:p-8">
          <section className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">Test</span>
              <select className="w-full rounded-lg border p-3" value={testId} onChange={(event) => setTestId(event.target.value)} required>
                {data.tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Categorie / section</span>
              <select className="w-full rounded-lg border p-3" value={sectionId} onChange={(event) => setSectionId(event.target.value)} required>
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title} ({section.section_key})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Format</span>
              <select className="w-full rounded-lg border p-3" value={questionFormat} onChange={(event) => setQuestionFormat(event.target.value)} required>
                {data.formats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">Cle question optionnelle</span>
              <input className="w-full rounded-lg border p-3" value={questionKey} onChange={(event) => setQuestionKey(event.target.value)} placeholder="auto si vide" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Difficulte</span>
              <input className="w-full rounded-lg border p-3" type="number" min="1" max="10" value={difficultyLevel} onChange={(event) => setDifficultyLevel(event.target.value)} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Poids / points</span>
              <input className="w-full rounded-lg border p-3" type="number" min="0.1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Question</span>
              <textarea className="min-h-28 w-full rounded-lg border p-3" value={questionText} onChange={(event) => setQuestionText(event.target.value)} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Stimulus memoire si besoin</span>
              <textarea className="min-h-28 w-full rounded-lg border p-3" value={stimulusText} onChange={(event) => setStimulusText(event.target.value)} />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Image question URL</span>
              <input className="w-full rounded-lg border p-3" value={questionImageUrl} onChange={(event) => setQuestionImageUrl(event.target.value)} placeholder="/iq/spatial/question.png" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Explication optionnelle</span>
              <input className="w-full rounded-lg border p-3" value={explanation} onChange={(event) => setExplanation(event.target.value)} />
            </label>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">time_limit_seconds</span>
              <input className="w-full rounded-lg border p-3" type="number" min="1" value={timeLimitSeconds} onChange={(event) => setTimeLimitSeconds(event.target.value)} placeholder="vide = NULL" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">display_time_seconds</span>
              <input className="w-full rounded-lg border p-3" type="number" min="1" value={displayTimeSeconds} onChange={(event) => setDisplayTimeSeconds(event.target.value)} placeholder="memoire" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">hide_stimulus_after_seconds</span>
              <input className="w-full rounded-lg border p-3" type="number" min="1" value={hideStimulusAfterSeconds} onChange={(event) => setHideStimulusAfterSeconds(event.target.value)} placeholder="optionnel" />
            </label>
          </section>

          {overlayMode ? (
            <section className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <h2 className="text-lg font-semibold">Parametres visual/spatial overlay</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium">Image reponses URL</span>
                  <input className="w-full rounded-lg border p-3" value={answersImageUrl} onChange={(event) => setAnswersImageUrl(event.target.value)} placeholder="/iq/logique/answers.png" />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Texte correction optionnel</span>
                  <input className="w-full rounded-lg border p-3" value={correctionText} onChange={(event) => setCorrectionText(event.target.value)} />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium">Nombre reponses</span>
                  <select className="w-full rounded-lg border p-3" value={answerCount} onChange={(event) => setAnswerCount(event.target.value)}>
                    <option value="4">4</option>
                    <option value="6">6</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Colonnes</span>
                  <input className="w-full rounded-lg border p-3" type="number" min="1" value={gridColumns} onChange={(event) => setGridColumns(event.target.value)} />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Lignes</span>
                  <input className="w-full rounded-lg border p-3" type="number" min="1" value={gridRows} onChange={(event) => setGridRows(event.target.value)} />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Bonne position</span>
                  <input className="w-full rounded-lg border p-3" type="number" min="1" max={answerCount} value={correctPosition} onChange={(event) => setCorrectPosition(event.target.value)} />
                </label>
              </div>
            </section>
          ) : (
            <section className="space-y-4 rounded-xl border p-4">
              <h2 className="text-lg font-semibold">Options de reponse</h2>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.key} className="grid gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-[70px_1fr_1fr_110px]">
                    <input className="rounded-lg border p-3" value={option.key} onChange={(event) => updateOption(index, { key: event.target.value })} />
                    <input className="rounded-lg border p-3" value={option.text} onChange={(event) => updateOption(index, { text: event.target.value })} placeholder={`Texte option ${option.key}`} />
                    <input className="rounded-lg border p-3" value={option.imageUrl} onChange={(event) => updateOption(index, { imageUrl: event.target.value })} placeholder="Image option URL" />
                    <label className="flex items-center justify-center gap-2 text-sm">
                      <input type="radio" name="correct-option" checked={option.isCorrect} onChange={() => markCorrectOption(index)} />
                      Correcte
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={isSaving || isLoading} className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-60">
              {isSaving ? "Insertion..." : "Ajouter la question"}
            </button>
            <button type="button" onClick={resetQuestionOnly} className="rounded-lg border px-5 py-3 font-semibold">
              Vider la question
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
