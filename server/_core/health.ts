import { getEnvironmentStatus } from "./env";
import { checkDatabaseReadiness } from "../db";

export async function getHealthSnapshot() {
  const environment = getEnvironmentStatus();
  const database = await checkDatabaseReadiness();
  const startupReady = environment.auth.ready && environment.database.ready;

  return {
    ok: startupReady && database.ready,
    timestamp: new Date().toISOString(),
    environment,
    database,
  };
}
