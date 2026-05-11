import { useEffect } from "react";

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const META_PIXEL_DISABLED = import.meta.env.VITE_META_PIXEL_DISABLED === "true";

declare global {
  interface Window {
    _fbq?: unknown;
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
  }
}

function loadMetaPixel(pixelId: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
        return;
      }
      fbq.queue?.push(args);
    } as NonNullable<Window["fbq"]>;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

export default function MetaPixel() {
  const pixelId = META_PIXEL_ID?.trim();

  useEffect(() => {
    if (!pixelId || META_PIXEL_DISABLED) return;
    loadMetaPixel(pixelId);
  }, [pixelId]);

  if (!pixelId || META_PIXEL_DISABLED) return null;

  return (
    <noscript>
      <img
        alt=""
        height="1"
        src={`https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`}
        style={{ display: "none" }}
        width="1"
      />
    </noscript>
  );
}
