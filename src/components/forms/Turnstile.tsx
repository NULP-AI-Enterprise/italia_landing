"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: { sitekey: string; language?: string }) => string;
  remove: (widgetId: string) => void;
};

/**
 * Cloudflare Turnstile widget (only rendered when the keys are configured, see
 * src/server/forms/turnstile.ts); the token is posted as "cf-turnstile-response".
 */
export function Turnstile({ siteKey, locale }: { siteKey: string; locale: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && "turnstile" in window,
  );

  useEffect(() => {
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (!ready || !api || !container.current) return;
    const id = api.render(container.current, { sitekey: siteKey, language: locale });
    return () => api.remove(id);
  }, [siteKey, ready, locale]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={container} />
    </>
  );
}
