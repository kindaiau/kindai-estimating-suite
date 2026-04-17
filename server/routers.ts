import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { projectsRouter } from "./routers/projects";
import { estimatesRouter } from "./routers/estimates";
import { materialsRouter } from "./routers/materials";
import { labourRouter } from "./routers/labour";
import { complianceRouter } from "./routers/compliance";
import { aiRouter } from "./routers/ai";
import { profileRouter } from "./routers/profile";
import { billingRouter } from "./routers/billing";
import { tradeProfilesRouter } from "./routers/tradeProfiles";
import { demoRouter } from "./routers/demo";
import { emailFollowupRouter } from "./routers/emailFollowup";
import { suppliersRouter } from "./routers/suppliers";
import { helpAssistantRouter } from "./routers/helpAssistant";
import { quoteTokensRouter } from "./routers/quoteTokens";
import { teamRouter } from "./routers/team";
import { variationsRouter } from "./routers/variations";
import { betaRouter } from "./routers/beta";
import { betaNurtureRouter } from "./routers/betaNurture";
import { fbLeadsRouter } from "./routers/fbLeads";
import { companyMemoryRouter } from "./routers/companyMemory";
import { correctionsRouter } from "./routers/corrections";
import { xeroRouter } from "./routers/xero";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  projects: projectsRouter,
  estimates: estimatesRouter,
  materials: materialsRouter,
  labour: labourRouter,
  compliance: complianceRouter,
  ai: aiRouter,
  profile: profileRouter,
  billing: billingRouter,
  tradeProfiles: tradeProfilesRouter,
  demo: demoRouter,
  emailFollowup: emailFollowupRouter,
  suppliers: suppliersRouter,
  helpAssistant: helpAssistantRouter,
  quoteTokens: quoteTokensRouter,
  team: teamRouter,
  variations: variationsRouter,
  beta: betaRouter,
  betaNurture: betaNurtureRouter,
  fbLeads: fbLeadsRouter,
  companyMemory: companyMemoryRouter,
  corrections: correctionsRouter,
  xero: xeroRouter,
});

export type AppRouter = typeof appRouter;
