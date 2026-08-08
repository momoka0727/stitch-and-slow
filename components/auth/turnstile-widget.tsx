"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      size: "flexible";
      theme: "light";
      callback(token: string): void;
      "expired-callback"(): void;
      "error-callback"(): void;
    },
  ): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-stitch-turnstile="true"]',
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile did not initialize"));
    };
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")), {
      once: true,
    });
    if (!existing) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.stitchTurnstile = "true";
      document.head.appendChild(script);
    }
  });
  return scriptPromise;
}

export function TurnstileWidget({
  siteKey,
  action,
  resetKey,
  onToken,
  onError,
}: {
  siteKey: string;
  action: string;
  resetKey: number;
  onToken: (token: string) => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let widgetId = "";
    onToken("");
    void loadTurnstile()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          size: "flexible",
          theme: "light",
          callback: (token) => active && onToken(token),
          "expired-callback": () => active && onToken(""),
          "error-callback": () => {
            if (!active) return;
            onToken("");
            onError();
          },
        });
      })
      .catch(() => active && onError());
    return () => {
      active = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action, onError, onToken, resetKey, siteKey]);

  return <div className="turnstile-widget" ref={containerRef} aria-label="人机验证" />;
}
