import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { paidProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { teamMembers, auditLogs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// Helper: write to audit log
async function writeAudit(params: {
  userId: number;
  userName: string;
  userEmail: string;
  action: "create" | "update" | "delete" | "view" | "export" | "login" | "logout" | "invite" | "accept" | "award";
  entityType: string;
  entityId?: number;
  entityName?: string;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    beforeData: params.beforeData as any,
    afterData: params.afterData as any,
    ipAddress: params.ipAddress,
  });
}

export const teamRouter = router({
  // Get all team members for the current owner
  getTeam: paidProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.ownerId, ctx.user.id));
    return members;
  }),

  // Invite a new team member
  inviteMember: paidProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).max(255),
        role: z.enum(["estimator", "project_manager", "quantity_surveyor", "viewer"]),
      })
    )
    .mutation(() => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "The controlled founding launch includes one user. Team invitations are not enabled.",
      });
    }),

  // Update member role
  updateMemberRole: paidProcedure
    .input(
      z.object({
        memberId: z.number(),
        role: z.enum(["estimator", "project_manager", "quantity_surveyor", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const [member] = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));

      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Team member not found." });

      await db
        .update(teamMembers)
        .set({ role: input.role })
        .where(eq(teamMembers.id, input.memberId));

      await writeAudit({
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        userEmail: ctx.user.email || "",
        action: "update",
        entityType: "team_member",
        entityId: input.memberId,
        entityName: member.email,
        beforeData: { role: member.role },
        afterData: { role: input.role },
      });

      return { success: true };
    }),

  // Suspend or reactivate a member
  setMemberStatus: paidProcedure
    .input(
      z.object({
        memberId: z.number(),
        status: z.enum(["active", "suspended"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const [member] = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));

      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Team member not found." });

      await db
        .update(teamMembers)
        .set({ status: input.status })
        .where(eq(teamMembers.id, input.memberId));

      await writeAudit({
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        userEmail: ctx.user.email || "",
        action: "update",
        entityType: "team_member",
        entityId: input.memberId,
        entityName: member.email,
        beforeData: { status: member.status },
        afterData: { status: input.status },
      });

      return { success: true };
    }),

  // Remove a team member
  removeMember: paidProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const [member] = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));

      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Team member not found." });

      await db.delete(teamMembers).where(eq(teamMembers.id, input.memberId));

      await writeAudit({
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        userEmail: ctx.user.email || "",
        action: "delete",
        entityType: "team_member",
        entityId: input.memberId,
        entityName: member.email,
        beforeData: { email: member.email, role: member.role },
      });

      return { success: true };
    }),

  // Resend invite
  resendInvite: paidProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const [member] = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));

      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Team member not found." });

      const inviteToken = crypto.randomBytes(32).toString("hex");
      const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db
        .update(teamMembers)
        .set({ inviteToken, inviteExpiresAt, status: "pending" })
        .where(eq(teamMembers.id, input.memberId));

      return { success: true, inviteToken };
    }),
});
