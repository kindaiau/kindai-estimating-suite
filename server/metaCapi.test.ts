import { describe, it, expect } from "vitest";
import { sendMetaConversionEvent } from "./metaCapi";

describe("Meta Conversions API", () => {
  it("should have META_PIXEL_ID configured", () => {
    const pixelId = process.env.META_PIXEL_ID;
    expect(pixelId).toBeDefined();
    expect(pixelId!.length).toBeGreaterThan(5);
  });

  it("should have META_CONVERSIONS_API_ACCESS_TOKEN configured", () => {
    const token = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should successfully send a test event to Meta CAPI", async () => {
    const result = await sendMetaConversionEvent({
      eventName: "PageView",
      eventSourceUrl: "https://kindaiestimator.com",
      actionSource: "website",
      userData: {
        email: "test@kindai.com.au",
        clientIpAddress: "203.0.113.1",
        clientUserAgent: "vitest/meta-capi-validation",
      },
    });

    // If secrets are valid, it should send successfully (not skip)
    expect(result.skipped).toBe(false);
    expect(result.sent).toBe(true);

    // Parse the response body to check for success
    const body = JSON.parse(result.body as string);
    expect(body.events_received).toBeGreaterThanOrEqual(1);
  }, 15000);
});
