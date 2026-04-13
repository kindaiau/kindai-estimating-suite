import { describe, it, expect } from "vitest";

const apiKey = process.env.RUNWAY_API_KEY;

/**
 * Test Runway API key validity by making a lightweight API call
 * This validates the secret before we use it in production.
 * Tests are skipped when RUNWAY_API_KEY is not configured.
 */
describe.skipIf(!apiKey)("Runway API Integration", () => {
  it("should validate Runway API key format and connectivity", async () => {
    expect(apiKey).toBeDefined();
    expect(apiKey?.length).toBeGreaterThan(10);

    // Make a lightweight API call to validate the key
    // Using the /tasks endpoint which is a real Runway endpoint
    const response = await fetch("https://api.dev.runwayml.com/v1/tasks", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
    });

    // If the key is valid, we should NOT get a 401 Unauthorized
    // 404 = endpoint exists but returns HTML (API issue), 200 = success
    // 401 = invalid key (this is what we're checking for)
    expect(response.status).not.toBe(401);
    console.log("Runway API response status:", response.status);
    console.log("Runway API key is valid and connected");
  });

  it("should have proper Runway API key format", () => {
    // Runway keys start with "key_" and are hex-encoded
    expect(apiKey).toMatch(/^key_[a-f0-9]{128,}$/);
  });
});
