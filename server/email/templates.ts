import {
  brandedCta,
  brandedEmailWrap,
  brandedH2,
  brandedP,
  brandedSignature,
} from "../emailBrand";

export type TransactionalTemplate =
  | "auth_welcome"
  | "onboarding"
  | "quote_delivery"
  | "quote_followup"
  | "crm_notification";

type TemplateInput = {
  name?: string;
  industryName?: string;
  quoteTitle?: string;
  quoteUrl?: string;
  message?: string;
  nextAction?: string;
};

export function buildTransactionalEmail(
  template: TransactionalTemplate,
  input: TemplateInput
) {
  const firstName = input.name?.split(" ")[0] || "there";
  const industryName = input.industryName || "your trade";

  if (template === "auth_welcome") {
    return {
      subject: "Welcome to Kindai Estimator",
      html: brandedEmailWrap({
        bodyHtml: `
          ${brandedH2(`Welcome, ${firstName}.`)}
          ${brandedP(`Your Kindai workspace is ready. Next step is choosing your trade so the dashboard, estimator, CRM, and templates match how your business quotes work.`)}
          ${brandedCta("Set up your workspace", "https://kindaiestimator.com/onboarding")}
          ${brandedSignature()}
        `,
      }),
    };
  }

  if (template === "onboarding") {
    return {
      subject: `Your ${industryName} workspace is ready`,
      html: brandedEmailWrap({
        bodyHtml: `
          ${brandedH2(`Your ${industryName} system is set up.`)}
          ${brandedP(`Kindai has configured your estimating prompts, quote templates, CRM terminology, and workflow steps around ${industryName}.`)}
          ${brandedP(input.nextAction || "Start by adding your first lead or creating a quote draft.")}
          ${brandedCta("Open dashboard", "https://kindaiestimator.com/dashboard")}
          ${brandedSignature()}
        `,
      }),
    };
  }

  if (template === "quote_delivery") {
    return {
      subject: input.quoteTitle ? `Your quote: ${input.quoteTitle}` : "Your Kindai quote",
      html: brandedEmailWrap({
        bodyHtml: `
          ${brandedH2(input.quoteTitle || "Your quote is ready.")}
          ${brandedP(input.message || "Here is the quote we prepared for your review.")}
          ${input.quoteUrl ? brandedCta("View quote", input.quoteUrl) : ""}
          ${brandedSignature()}
        `,
      }),
    };
  }

  if (template === "quote_followup") {
    return {
      subject: input.quoteTitle ? `Checking in on ${input.quoteTitle}` : "Checking in on your quote",
      html: brandedEmailWrap({
        bodyHtml: `
          ${brandedH2(`Quick check-in, ${firstName}.`)}
          ${brandedP(input.message || "Just checking whether you had any questions about the quote or wanted to adjust the scope.")}
          ${input.quoteUrl ? brandedCta("Reopen quote", input.quoteUrl) : ""}
          ${brandedSignature()}
        `,
      }),
    };
  }

  return {
    subject: "Kindai CRM notification",
    html: brandedEmailWrap({
      bodyHtml: `
        ${brandedH2("CRM update")}
        ${brandedP(input.message || "A lead or workflow needs attention in Kindai.")}
        ${input.nextAction ? brandedP(`Next action: ${input.nextAction}`) : ""}
        ${brandedCta("Open CRM", "https://kindaiestimator.com/crm")}
        ${brandedSignature()}
      `,
    }),
  };
}
