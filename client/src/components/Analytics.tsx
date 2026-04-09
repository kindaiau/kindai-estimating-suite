import { useEffect } from "react";

const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const ANALYTICS_WEBSITE_ID = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

export default function Analytics() {
  useEffect(() => {
    if (!ANALYTICS_ENDPOINT || !ANALYTICS_WEBSITE_ID) {
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-website-id="${ANALYTICS_WEBSITE_ID}"]`
    );
    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.defer = true;
    script.src = `${ANALYTICS_ENDPOINT.replace(/\/+$/, "")}/umami`;
    script.setAttribute("data-website-id", ANALYTICS_WEBSITE_ID);
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
