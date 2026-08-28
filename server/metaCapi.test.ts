import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLeadEvent,
  buildMetaEventPayload,
  createMetaEventId,
  sendMetaConversionEvent,
} from "./metaCapi";

const ORIGINAL_ENV = { ...process.env };

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

describe("Meta Conversions API", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.META_PIXEL_ID;
    delete process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
    delete process.env.VITE_META_PIXEL_ID;
    delete process.env.FB_PIXEL_ID;
    delete process.env.FB_ACCESS_TOKEN;
    delete process.env.META_TEST_EVENT_CODE;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("builds valid deduplication event IDs", () => {
    const eventId = createMetaEventId("Lead Capture", "Lead #42");
    expect(eventId).toMatch(/^lead_capture_lead_42_\d+_[a-f0-9]{12}$/);
  });

  it("hashes normalized user data and includes event metadata", () => {
    const payload = buildMetaEventPayload(
      buildLeadEvent({
        email: "  TEST@Kindai.com.AU ",
        name: "Matt Symons",
        phone: "+61 400 123 456",
        eventSourceUrl: "https://kindaibook-55hbndtb.manus.space/",
        eventId: "lead-event-123",
        clientIpAddress: "203.0.113.10",
        clientUserAgent: "vitest-agent",
        fbp: "fb.1.123.456",
        fbc: "fb.1.123.click",
      }),
      "lead-event-123"
    );

    expect(payload).toMatchObject({
      event_name: "Lead",
      event_id: "lead-event-123",
      action_source: "website",
      event_source_url: "https://kindaibook-55hbndtb.manus.space/",
    });
    expect(payload.user_data).toMatchObject({
      em: [sha256("test@kindai.com.au")],
      ph: [sha256("61400123456")],
      fn: [sha256("matt")],
      ln: [sha256("symons")],
      external_id: [sha256("test@kindai.com.au")],
      client_ip_address: "203.0.113.10",
      client_user_agent: "vitest-agent",
      fbp: "fb.1.123.456",
      fbc: "fb.1.123.click",
    });
  });

  it("skips safely when server-side Meta config is missing", async () => {
    const result = await sendMetaConversionEvent({
      eventName: "Lead",
      eventId: "lead-no-config",
      eventSourceUrl: "https://kindaibook-55hbndtb.manus.space/",
      userData: { email: "lead@kindai.com.au" },
    });

    expect(result).toEqual({
      sent: false,
      skipped: true,
      eventId: "lead-no-config",
      reason: "missing_meta_capi_config",
    });
  });

  it("posts events to the Graph API v19 endpoint using requested FB env aliases", async () => {
    process.env.FB_PIXEL_ID = "1223641749636127";
    process.env.FB_ACCESS_TOKEN = "test_placeholder_access_token";
    process.env.META_TEST_EVENT_CODE = "TEST123";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ events_received: 1 })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendMetaConversionEvent({
      eventName: "CompleteRegistration",
      eventId: "registration-123",
      eventSourceUrl: "https://kindaiestimator.com/",
      userData: { email: "new-user@kindai.com.au" },
    });

    expect(result.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("https://graph.facebook.com/v19.0/1223641749636127/events");
    expect(String(url)).toContain("access_token=test_placeholder_access_token");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body);
    expect(body.test_event_code).toBe("TEST123");
    expect(body.data[0]).toMatchObject({
      event_name: "CompleteRegistration",
      event_id: "registration-123",
      action_source: "website",
      event_source_url: "https://kindaiestimator.com/",
    });
  });
});
