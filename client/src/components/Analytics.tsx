import { useEffect } from "react";
import { flushAnalyticsQueue } from "@/lib/analytics";

const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const ANALYTICS_WEBSITE_ID = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
const ANALYTICS_SCRIPT_URL = import.meta.env.VITE_ANALYTICS_SCRIPT_URL;
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SCRIPT_URL =
  import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL || "https://plausible.io/js/script.js";

type PlausibleWindow = Window & {
  plausible?: {
    (eventName: string, options?: { props?: Record<string, unknown> }): void;
    q?: unknown[];
  };
};

function resolveScriptUrl(endpoint: string) {
  const cleanEndpoint = endpoint.replace(/\/+$/, "");
  if (cleanEndpoint.endsWith(".js")) return cleanEndpoint;
  return `${cleanEndpoint}/script.js`;
}

function installPlausibleQueue() {
  const plausibleWindow = window as PlausibleWindow;
  plausibleWindow.plausible =
    plausibleWindow.plausible ||
    function plausible(...args: Parameters<NonNullable<PlausibleWindow["plausible"]>>) {
      (plausibleWindow.plausible!.q = plausibleWindow.plausible!.q || []).push(args);
    };
}

export default function Analytics() {
  useEffect(() => {
    const scripts: HTMLScriptElement[] = [];

    if (ANALYTICS_WEBSITE_ID && (ANALYTICS_ENDPOINT || ANALYTICS_SCRIPT_URL)) {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[data-website-id="${ANALYTICS_WEBSITE_ID}"]`
      );

      if (!existing) {
        const script = document.createElement("script");
        script.defer = true;
        script.src = ANALYTICS_SCRIPT_URL || resolveScriptUrl(ANALYTICS_ENDPOINT ?? "");
        script.setAttribute("data-website-id", ANALYTICS_WEBSITE_ID);
        script.addEventListener("load", flushAnalyticsQueue);
        document.body.appendChild(script);
        scripts.push(script);
      }
    }

    if (PLAUSIBLE_DOMAIN) {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[data-domain="${PLAUSIBLE_DOMAIN}"]`
      );

      installPlausibleQueue();

      if (!existing) {
        const script = document.createElement("script");
        script.defer = true;
        script.src = PLAUSIBLE_SCRIPT_URL;
        script.setAttribute("data-domain", PLAUSIBLE_DOMAIN);
        script.addEventListener("load", flushAnalyticsQueue);
        document.body.appendChild(script);
        scripts.push(script);
      }
    }

    return () => {
      for (const script of scripts) {
        script.removeEventListener("load", flushAnalyticsQueue);
        script.remove();
      }
    };
  }, []);

  return null;
}
