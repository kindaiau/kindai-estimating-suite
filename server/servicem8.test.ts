import { describe, it, expect } from "vitest";

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

describe("ServiceM8 API key validation", () => {
  it("should authenticate successfully against ServiceM8 /companycontact endpoint", async () => {
    const { status, ok } = await sm8Get("companycontact");
    // 200 = valid key, 401/403 = bad key
    expect(status).not.toBe(401);
    expect(status).not.toBe(403);
    expect(ok).toBe(true);
  }, 15000);
});
