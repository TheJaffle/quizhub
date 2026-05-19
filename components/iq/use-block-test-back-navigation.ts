"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useBlockTestBackNavigation(redirectUrl = "/iq") {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl = window.location.href;
    window.history.pushState({ iqBlockBack: true }, "", currentUrl);

    const handlePopState = () => {
      router.replace(redirectUrl);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [redirectUrl, router]);
}
