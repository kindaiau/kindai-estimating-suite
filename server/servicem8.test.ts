import { describe, it, expect } from "vitest";

const runExternalIntegrationTests = process.env.RUN_EXTERNAL_INTEGRATION_TESTS === "true";
const integrationIt = runExternalIntegrationTests ? it : it.skip;
const SM8_KEY = process.env.SERVICEM8_API_KEY ?? "";
const BASE = "https://api.servicem8.com/api_1.0";

async function sm8Get(endpoint: string) {
  const res = await fetch(`${BASE}/${endpoint}.json`, {
    headers: {
      Authorization: `Bearer ${SM8_KEY}`,
      Accept: "application/json",
    },
  });
  return { status: res.status, ok: res.ok };
}

describe("ServiceM8 client-owned integration", () => {
  integrationIt("authenticates with a customer-authorized ServiceM8 API key", async () => {
    const { status, ok } = await sm8Get("companycontact");
    // 200 = valid key, 401/403 = bad key
    expect(status).not.toBe(401);
    expect(status).not.toBe(403);
    expect(ok).toBe(true);
  }, 15000);
});
