/**
 * Pre-configured SEO for each page route.
 * Import and drop in at the top of any page component.
 */
export { default as SEO } from "./SEO";

export const PAGE_SEO = {
  home: {
    title: "Kindai Estimating Suite | AI-Powered Quoting for Australian Trades",
    description: "AI-assisted estimating software that prepares structured drafts from supported plans, customer rates and business rules for an Australian estimator to review.",
    canonical: "/",
    keywords: "construction estimating software Australia, AI estimating software, trade quoting software Australia, builder quoting app, electrical estimating, plumbing estimating, tradie quoting, construction takeoff software, AI takeoff, GST quoting software",
  },
  pricing: {
    title: "Pricing | Kindai Estimating Suite",
    description: "KindAI pricing for the A$2,500 plus GST Founding Workflow Setup, A$149/month Sole Tradie plan and scoped team configurations.",
    canonical: "/pricing",
    keywords: "construction estimating software price Australia, estimating software cost, trade quoting software pricing, builder software subscription Australia",
  },
  demo: {
    title: "Interactive Estimating Sample | KindAI Australia",
    description: "Explore a representative estimating sample with adjustable labour, markup and GST assumptions. No private-plan upload and no open-ended free AI access.",
    canonical: "/demo",
    keywords: "free estimating software demo Australia, AI takeoff demo, construction quoting demo, try builder software free",
  },
  aiTakeoff: {
    title: "AI Vision Takeoff | Reviewable Plan Drafts",
    description: "Upload a supported plan and review candidate dimensions, counts, materials, source references and unresolved items before an estimate is approved.",
    canonical: "/ai-takeoff",
    keywords: "AI takeoff software Australia, construction plan scanning, automated quantity takeoff, AI estimating from plans, scan plans get quote",
  },
  dashboard: {
    title: "Dashboard | Kindai Estimating Suite",
    description: "Manage all your construction estimates, quotes, and projects in one place. Track win rates, revenue pipeline, and send branded quotes to clients.",
    canonical: "/dashboard",
    keywords: "construction estimating dashboard, quote management software, builder project management Australia",
    noIndex: true,
  },
  projects: {
    title: "Projects | Kindai Estimating Suite",
    description: "Manage your construction projects and estimates. Track all quotes, variations, and project status in one place.",
    canonical: "/projects",
    keywords: "construction project management, builder projects, trade project tracking",
    noIndex: true,
  },

} as const;
