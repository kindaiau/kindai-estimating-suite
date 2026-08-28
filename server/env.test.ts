import { afterEach, describe, expect, it } from "vitest";
import {
  getEnvironmentStatus,
  requireEnvValue,
  validateServerEnv,
} from "./_core/env";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("environment validation", () => {
  it("reports missing startup configuration by feature", () => {
    delete process.env.VITE_APP_ID;
    delete process.env.JWT_SECRET;
    delete process.env.OAUTH_SERVER_URL;
    delete process.env.DATABASE_URL;

    const status = getEnvironmentStatus();

    expect(status.auth.ready).toBe(true);
    expect(status.auth.missingRequired).toEqual([]);
    expect(status.database.ready).toBe(false);
    expect(status.database.missingRequired).toEqual(["DATABASE_URL"]);
  });

  it("throws when startup-required variables are missing", () => {
    delete process.env.VITE_APP_ID;
    delete process.env.JWT_SECRET;
    delete process.env.OAUTH_SERVER_URL;
    delete process.env.DATABASE_URL;

    expect(() => validateServerEnv()).toThrow(
      "Missing required startup environment variables"
    );
  });

  it("returns a required env value when present", () => {
    expect(requireEnvValue("configured", "TEST_ENV")).toBe("configured");
  });

  it("reports billing as unavailable when Stripe webhook signing is missing", () => {
    process.env.STRIPE_SECRET_KEY = "<test-placeholder>";
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const status = getEnvironmentStatus();

    expect(status.billing.ready).toBe(false);
    expect(status.billing.missingRequired).toEqual(["STRIPE_WEBHOOK_SECRET"]);
  });
});
