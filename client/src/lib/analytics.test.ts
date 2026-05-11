import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("client analytics", () => {
  it("sends privacy-filtered product events to an existing Plausible tracker", async () => {
    const plausible = vi.fn();

    vi.stubGlobal("window", { plausible });

    const { trackEvent } = await import("./analytics");

    trackEvent("pricing_plan_clicked", {
      plan: "Pro",
      email: "matthew@example.com",
      filename: "plans.pdf",
      quoteValue: 1234.567,
    });

    expect(plausible).toHaveBeenCalledWith("pricing_plan_clicked", {
      props: {
        plan: "Pro",
        quoteValue: 1234.57,
      },
    });
  });

  it("queues events until a supported tracker is available", async () => {
    const win: { umami?: { track: ReturnType<typeof vi.fn> } } = {};

    vi.stubGlobal("window", win);

    const { flushAnalyticsQueue, trackEvent } = await import("./analytics");

    trackEvent("demo_takeoff_started", { trade: "electrical" });

    const track = vi.fn();
    win.umami = { track };
    flushAnalyticsQueue();

    expect(track).toHaveBeenCalledWith("demo_takeoff_started", {
      trade: "electrical",
    });
  });
});
