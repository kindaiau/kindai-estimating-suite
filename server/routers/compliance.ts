import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { COMPLIANCE_DATA, TRADES } from "../../shared/trades";

export const complianceRouter = router({
  getProfile: publicProcedure.input(z.object({
    trade: z.string(),
    state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
  })).query(({ input }) => {
    const profile = COMPLIANCE_DATA[input.trade];
    if (!profile) return null;
    const licensing = input.state ? profile.licensingBodies[input.state] : null;
    return {
      trade: input.trade,
      state: input.state,
      licensing,
      standards: profile.standards,
      whsNotice: profile.whsNotice,
      quoteDisclaimer: profile.quoteDisclaimer,
    };
  }),

  getTrades: publicProcedure.query(() => TRADES),
});
