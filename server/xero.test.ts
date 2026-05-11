import { describe, it, expect } from "vitest";

const runExternalIntegrationTests = process.env.RUN_EXTERNAL_INTEGRATION_TESTS === "true";
const integrationIt = runExternalIntegrationTests ? it : it.skip;

describe("Xero client-owned integration", () => {
  integrationIt("platform OAuth client ID is configured for customer account connections", () => {
    const clientId = process.env.XERO_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId!.length).toBeGreaterThan(10);
    // Xero client IDs are hex strings
    expect(/^[A-Fa-f0-9]+$/.test(clientId!)).toBe(true);
  });

  integrationIt("platform OAuth client secret is configured for customer account connections", () => {
    const clientSecret = process.env.XERO_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret!.length).toBeGreaterThan(10);
  });
});
