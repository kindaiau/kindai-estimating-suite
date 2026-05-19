import { and, eq } from "drizzle-orm";
import { getIndustryConfig, type IndustryKey } from "../../config/industries";
import {
  organizations,
  promptTemplates,
  users,
  type Organization,
} from "../../drizzle/schema";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

export async function getOrCreateOrganization(
  db: Db,
  userId: number,
  input?: {
    name?: string | null;
    industryKey?: IndustryKey | string | null;
    phone?: string | null;
    website?: string | null;
  }
): Promise<Organization> {
  const [existing] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.ownerUserId, userId))
    .limit(1);

  if (existing) return existing;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const industry = getIndustryConfig(input?.industryKey ?? user?.defaultTrade);
  const orgName =
    input?.name?.trim() ||
    user?.companyName ||
    user?.name ||
    `${industry.shortName} Business`;

  const result = await db.insert(organizations).values({
    ownerUserId: userId,
    name: orgName,
    industryKey: industry.key,
    tradeId: industry.tradeId,
    phone: input?.phone ?? user?.phone ?? undefined,
    website: input?.website ?? undefined,
    abn: user?.abn ?? undefined,
    state: user?.state ?? undefined,
    settings: {
      onboardingComplete: false,
      createdFrom: "auto",
    },
  });

  const id = Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0);
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);

  if (!created) {
    throw new Error("Failed to create organization");
  }

  await seedPromptTemplates(db, created.id, created.industryKey);
  return created;
}

export async function updateOrganizationIndustry(
  db: Db,
  userId: number,
  industryKey: IndustryKey,
  input: {
    name?: string;
    phone?: string;
    website?: string;
  }
) {
  const organization = await getOrCreateOrganization(db, userId, {
    name: input.name,
    phone: input.phone,
    website: input.website,
    industryKey,
  });
  const industry = getIndustryConfig(industryKey);

  await db
    .update(organizations)
    .set({
      name: input.name || organization.name,
      phone: input.phone || organization.phone,
      website: input.website || organization.website,
      industryKey: industry.key,
      tradeId: industry.tradeId,
      status: "active",
      settings: {
        ...(typeof organization.settings === "object" && organization.settings ? organization.settings : {}),
        onboardingComplete: true,
        selectedIndustryAt: new Date().toISOString(),
      },
    })
    .where(and(eq(organizations.id, organization.id), eq(organizations.ownerUserId, userId)));

  await db
    .update(users)
    .set({
      companyName: input.name || undefined,
      phone: input.phone || undefined,
      defaultTrade: industry.tradeId,
    })
    .where(eq(users.id, userId));

  await seedPromptTemplates(db, organization.id, industry.key);
}

async function seedPromptTemplates(db: Db, organizationId: number, industryKey: string) {
  const industry = getIndustryConfig(industryKey);

  for (const [agent, systemPrompt] of Object.entries({
    acquisition: industry.prompts.acquisition,
    conversion: industry.prompts.conversion,
    delivery: industry.prompts.delivery,
    estimator: industry.prompts.estimatorSystem,
  }) as Array<["acquisition" | "conversion" | "delivery" | "estimator", string]>) {
    const [existing] = await db
      .select({ id: promptTemplates.id })
      .from(promptTemplates)
      .where(
        and(
          eq(promptTemplates.organizationId, organizationId),
          eq(promptTemplates.industryKey, industry.key),
          eq(promptTemplates.agent, agent)
        )
      )
      .limit(1);

    if (existing) continue;

    await db.insert(promptTemplates).values({
      organizationId,
      industryKey: industry.key,
      agent,
      name: `${industry.shortName} ${agent} prompt`,
      systemPrompt,
    });
  }
}
