/**
 * Apply the beta_nurture_emails table migration to production DB
 * Run: node scripts/apply-nurture-migration.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

try {
  // Check if table already exists
  const [rows] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'beta_nurture_emails'"
  );
  const exists = rows[0].cnt > 0;

  if (exists) {
    console.log("✅ beta_nurture_emails table already exists — no migration needed");
  } else {
    await conn.execute(`
      CREATE TABLE \`beta_nurture_emails\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`betaSignupId\` int NOT NULL,
        \`email\` varchar(320) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`trade\` varchar(64),
        \`spotNumber\` int NOT NULL,
        \`emailKey\` enum('day1_activation','day3_social_proof','day7_roi','day14_urgency') NOT NULL,
        \`scheduledAt\` bigint NOT NULL,
        \`sentAt\` bigint,
        \`status\` enum('scheduled','sent','failed','cancelled') NOT NULL DEFAULT 'scheduled',
        \`brevoMessageId\` varchar(255),
        \`errorMessage\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`beta_nurture_emails_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log("✅ Created beta_nurture_emails table");
  }

  // Also check hubspotContactId and hubspotDealId columns on beta_signups
  const [cols] = await conn.execute(
    "SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'beta_signups' AND COLUMN_NAME IN ('hubspotContactId', 'hubspotDealId')"
  );
  const existingCols = cols.map(r => r.COLUMN_NAME);

  if (!existingCols.includes("hubspotContactId")) {
    await conn.execute("ALTER TABLE `beta_signups` ADD COLUMN `hubspotContactId` varchar(64)");
    console.log("✅ Added hubspotContactId column to beta_signups");
  } else {
    console.log("✅ hubspotContactId already exists");
  }

  if (!existingCols.includes("hubspotDealId")) {
    await conn.execute("ALTER TABLE `beta_signups` ADD COLUMN `hubspotDealId` varchar(64)");
    console.log("✅ Added hubspotDealId column to beta_signups");
  } else {
    console.log("✅ hubspotDealId already exists");
  }

  console.log("\n🎉 All migrations applied successfully");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await conn.end();
}
