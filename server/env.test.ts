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
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    delete process.env.DATABASE_URL;

    const status = getEnvironmentStatus();

    expect(status.auth.ready).toBe(false);
    expect(status.auth.missingRequired).toHaveLength(2);
    expect(status.database.ready).toBe(false);
    expect(status.database.missingRequired).toEqual(["DATABASE_URL"]);
  });

  it("throws when startup-required variables are missing", () => {
    delete process.env.VITE_APP_ID;
    delete process.env.JWT_SECRET;
    delete process.env.OAUTH_SERVER_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    delete process.env.DATABASE_URL;

    expect(() => validateServerEnv()).toThrow(
      "Missing required startup environment variables"
    );
  });

  it("treats Supabase configuration as valid startup auth configuration", () => {
    delete process.env.VITE_APP_ID;
    delete process.env.JWT_SECRET;
    delete process.env.OAUTH_SERVER_URL;
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon";
    process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/kindai";

    expect(() => validateServerEnv()).not.toThrow();
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
