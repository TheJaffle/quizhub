import { IqAudioIntroPage, type IqAudioIntroData } from "@/components/iq/iq-audio-intro-page";

export const dynamic = "force-dynamic";

const previewIntro: IqAudioIntroData = {
  title: "Memoire sonore",
  description:
    "Vous allez ecouter une courte sequence sonore, la memoriser, puis retrouver la bonne proposition parmi quatre lectures candidates.",
  questionCount: 1,
  maxStimulusPlays: 1,
  timeLimitSeconds: 20,
  nextUrl: "/iq/audio-preview/play",
};

export default function IqAudioPreviewIntroRoute() {
  return <IqAudioIntroPage data={previewIntro} />;
}
