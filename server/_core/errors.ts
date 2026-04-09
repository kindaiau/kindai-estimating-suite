import { TRPCError } from "@trpc/server";

export function requireDatabase<T>(
  db: T | null | undefined,
  message = "Database unavailable"
): T {
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message,
    });
  }

  return db;
}
