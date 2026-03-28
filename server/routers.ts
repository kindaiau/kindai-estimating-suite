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
});

export type AppRouter = typeof appRouter;
