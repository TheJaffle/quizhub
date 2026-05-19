"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from "next/dynamic";
import type { IqTestIntro } from "@/lib/iq-tests";

const IqIntroPage = dynamic(
  () => import("@/components/iq/iq-intro-page").then((module) => module.IqIntroPage),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-3xl py-10">
        <Alert>
          <AlertTitle>Chargement du test</AlertTitle>
          <AlertDescription>Preparation de l&apos;ecran de demarrage...</AlertDescription>
        </Alert>
      </div>
    ),
  }
);

type IqIntroPageNoSsrProps = {
  test: IqTestIntro | null;
  error?: string;
};

export function IqIntroPageNoSsr({ test, error }: IqIntroPageNoSsrProps) {
  return <IqIntroPage test={test} error={error} />;
}
