/**
 * Pre-configured SEO for each page route.
 * Import and drop in at the top of any page component.
 */
export { default as SEO } from "./SEO";

export const PAGE_SEO = {
  home: {
    title: "Kindai Estimating Suite | AI-Powered Quoting for Australian Trades",
    description: "AI estimating software for Australian tradies and builders. Scan plans with your phone, get instant takeoffs, send branded quotes with GST in 60 seconds. 20 trades covered.",
    canonical: "/",
    keywords: "construction estimating software Australia, AI estimating software, trade quoting software Australia, builder quoting app, electrical estimating, plumbing estimating, tradie quoting, construction takeoff software, AI takeoff, GST quoting software",
  },
  pricing: {
    title: "Pricing | Kindai Estimating Suite",
    description: "Affordable AI estimating software for Australian trades. From solo tradies to $100M builders. Free trial available. Plans from $149/month. Replace your $120K estimator.",
    canonical: "/pricing",
    keywords: "construction estimating software price Australia, estimating software cost, trade quoting software pricing, builder software subscription Australia",
  },
  demo: {
    title: "Try Free Demo | AI Estimating Software Australia",
    description: "Try Kindai's AI estimating software free — no sign-up required. See how AI reads your plans and generates a full quote with materials, labour, and GST in under 60 seconds.",
    canonical: "/demo",
    keywords: "free estimating software demo Australia, AI takeoff demo, construction quoting demo, try builder software free",
  },
  aiTakeoff: {
    title: "AI Vision Takeoff | Scan Plans & Get Instant Quotes",
    description: "Upload or photograph your construction plans. Kindai AI reads every symbol, counts every fixture, and generates a full materials and labour quote with GST automatically.",
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
  beta: {
    title: "Free Beta Access | Kindai Estimating Suite",
    description: "Join 25 Australian tradies and builders testing AI-powered estimating software free. Scan plans, get instant quotes with GST. Claim your founding member spot.",
    canonical: "/beta",
    keywords: "free estimating software Australia, AI quoting software free trial, tradie software beta, builder estimating app free",
  },
} as const;
