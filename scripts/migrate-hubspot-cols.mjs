/**
 * Migration: add hubspotContactId and hubspotDealId to beta_signups
 */
import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2/promise";

const conn = await createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

try {
  await conn.execute(
    "ALTER TABLE `beta_signups` ADD COLUMN IF NOT EXISTS `hubspotContactId` varchar(64)"
  );
  console.log("✓ Added hubspotContactId");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("✓ hubspotContactId already exists");
  } else {
    throw e;
  }
}

try {
  await conn.execute(
    "ALTER TABLE `beta_signups` ADD COLUMN IF NOT EXISTS `hubspotDealId` varchar(64)"
  );
  console.log("✓ Added hubspotDealId");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("✓ hubspotDealId already exists");
  } else {
    throw e;
  }
}

await conn.end();
console.log("Migration complete!");
