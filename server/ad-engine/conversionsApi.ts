type ConversionEvent = {
  eventName: string;
  eventTime?: number;
  eventId?: string;
  actionSource?: "website" | "system_generated" | "business_messaging" | "email";
  userData?: Record<string, unknown>;
  customData?: Record<string, unknown>;
};

export class MetaConversionsApiClient {
  private readonly pixelId?: string;
  private readonly accessToken?: string;
  private readonly testEventCode?: string;

  constructor() {
    this.pixelId = process.env.META_PIXEL_ID;
    this.accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
    this.testEventCode = process.env.META_TEST_EVENT_CODE;
  }

  isConfigured() {
    return Boolean(this.pixelId && this.accessToken);
  }

  async sendEvent(event: ConversionEvent) {
    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          action_source: event.actionSource ?? "system_generated",
          user_data: event.userData ?? {},
          custom_data: event.customData ?? {},
        },
      ],
      ...(this.testEventCode ? { test_event_code: this.testEventCode } : {}),
    };

    if (!this.isConfigured()) {
      return { sent: false, monitorMode: true, payload };
    }

    const url = new URL(`https://graph.facebook.com/v21.0/${this.pixelId}/events`);
    url.searchParams.set("access_token", this.accessToken as string);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta Conversions API failed: ${response.status} ${errorText}`);
    }

    return { sent: true, response: await response.json() };
  }
}
