"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const IQ_BACK_REDIRECT_STORAGE_KEY = "brainspark_iq_back_redirect_url";
const DEFAULT_IQ_BACK_REDIRECT_URL = "/iq/sondage-light";

export function rememberIqBackRedirectUrl(redirectUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(IQ_BACK_REDIRECT_STORAGE_KEY, redirectUrl);
}

function getStoredIqBackRedirectUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_IQ_BACK_REDIRECT_URL;
  }

  return window.sessionStorage.getItem(IQ_BACK_REDIRECT_STORAGE_KEY) || DEFAULT_IQ_BACK_REDIRECT_URL;
}

export function useBlockTestBackNavigation(redirectUrl?: string) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl = window.location.href;
    window.history.pushState({ iqBlockBack: true }, "", currentUrl);

    const handlePopState = () => {
      router.replace(redirectUrl || getStoredIqBackRedirectUrl());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [redirectUrl, router]);
}
