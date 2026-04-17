import { describe, it, expect } from "vitest";

describe("Xero credentials", () => {
  it("XERO_CLIENT_ID is set and looks like a valid hex string", () => {
    const clientId = process.env.XERO_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId!.length).toBeGreaterThan(10);
    // Xero client IDs are hex strings
    expect(/^[A-Fa-f0-9]+$/.test(clientId!)).toBe(true);
  });

  it("XERO_CLIENT_SECRET is set and non-empty", () => {
    const clientSecret = process.env.XERO_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret!.length).toBeGreaterThan(10);
  });
});
