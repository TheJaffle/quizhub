import { IqAudioQuestionPage, type IqAudioQuestionData } from "@/components/iq/iq-audio-question-page";

export const dynamic = "force-dynamic";

const previewQuestion: IqAudioQuestionData = {
  questionText: "Ecoutez attentivement.",
  answerPromptText: "Quelle sequence avez-vous entendue ?",
  promptAudioUrl: "/iq/audio-memory/audio-memory-001-stimulus.wav",
  maxStimulusPlays: 1,
  transitionDelayMs: 1800,
  options: [
    { key: "A", audioUrl: "/iq/audio-memory/audio-memory-001-a.wav" },
    { key: "B", audioUrl: "/iq/audio-memory/audio-memory-001-b.wav" },
    { key: "C", audioUrl: "/iq/audio-memory/audio-memory-001-c.wav" },
    { key: "D", audioUrl: "/iq/audio-memory/audio-memory-001-d.wav" },
  ],
};

export default function IqAudioPreviewQuestionRoute() {
  return <IqAudioQuestionPage data={previewQuestion} />;
}
