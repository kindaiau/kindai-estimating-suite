/**
 * PostHogPageTracker
 *
 * Fires a PostHog $pageview event on every route change.
 * Must be rendered inside the Router to access the current location.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { capturePageView } from "@/lib/posthog";

export default function PostHogPageTracker() {
  const [location] = useLocation();

  useEffect(() => {
    capturePageView(window.location.href);
  }, [location]);

  return null;
}
