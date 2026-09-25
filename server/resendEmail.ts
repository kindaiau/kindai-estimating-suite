type ResendEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type PilotLeadInput = {
  name: string;
  email: string;
  phone?: string;
  tradeType?: string;
  intent: string;
  source?: string;
};

type PilotPaymentInput = {
  name: string;
  email: string;
  phone?: string;
  tradeType?: string;
  amountPaid: number;
  currency: string;
  stripeSessionId: string;
};

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim(),
    from: process.env.RESEND_FROM_EMAIL?.trim() || "Matt from Kindai <matt@kindaiestimator.com>",
  };
}

export async function sendResendEmail(email: ResendEmail): Promise<boolean> {
  const { apiKey, from } = getResendConfig();
  if (!apiKey) {
    console.warn(`[Resend] RESEND_API_KEY not set — skipping email to ${email.to}`);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[Resend] Failed to send email to ${email.to}: ${response.status} ${body}`);
    return false;
  }

  return true;
}

function getOwnerNotificationEmail() {
  return (
    process.env.MATTHEW_NOTIFICATION_EMAIL?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    "matt@kindaiestimator.com"
  );
}

export async function sendPilotLeadEmails(input: PilotLeadInput) {
  const notificationEmail =
    getOwnerNotificationEmail();
  const isFoundingSetupApplication = input.source === "live_plan_evaluation";

  const leadText = isFoundingSetupApplication
    ? `Hey ${input.name},

Thanks for applying for the KindAI Founding Workflow Setup.

The proposed setup is A$2,500 plus GST for one cabinet or joinery workflow, two reviewed jobs and the first six months of Sole Tradie.

No payment has been taken and no place is reserved yet. I’ll review the details and contact you to confirm fit. Please do not email private plans until we have agreed on the scope and secure handover process.

– Matt`
    : `Hey ${input.name},

Thanks for requesting a Kindai pilot spot.

I’m personally reviewing each founding pilot because we’re keeping the first group small.

The goal is simple: help you quote faster without missing key costs, GST, supplier pricing, or margin checks.

I’ll be in touch shortly to confirm if there’s a good fit.

– Matt`;

  const matthewText = `${isFoundingSetupApplication ? "New KindAI Founding Workflow Setup application" : "New KindAI pilot lead received"}.

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || "Not provided"}
Trade: ${input.tradeType || "Not provided"}
Intent: ${input.intent}

Follow up today. ${isFoundingSetupApplication ? "No payment has been taken. Confirm fixed-scope fit before requesting files or creating a payment invitation." : "This is a revenue lead."}`;

  const [leadSent, ownerSent] = await Promise.all([
    sendResendEmail({
      to: input.email,
      subject: isFoundingSetupApplication ? "Your KindAI Founding Workflow Setup application" : "Your KindAI pilot spot request",
      text: leadText,
    }),
    sendResendEmail({
      to: notificationEmail,
      subject: isFoundingSetupApplication
        ? `New KindAI setup application: ${input.name}`
        : `New KindAI pilot lead: ${input.name}`,
      text: matthewText,
    }),
  ]);

  return { leadSent, ownerSent };
}

export async function sendPilotPaymentEmails(input: PilotPaymentInput) {
  const notificationEmail = getOwnerNotificationEmail();
  const formattedAmount = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: input.currency.toUpperCase(),
  }).format(input.amountPaid / 100);

  const customerText = `Hey ${input.name},

Your KindAI Founding Workflow Setup payment is confirmed.

Next step: create or sign in to your KindAI account using this same email address at https://kindaiestimator.com/login. Matt will then contact you to book the 90-minute setup session.

Your setup includes one cabinet or joinery workflow, up to 150 price-book rows, up to 20 written rules, two reviewed real jobs, 30 days of email support, and six months of Sole Tradie for one user. The included access does not renew automatically.

Amount paid: ${formattedAmount}

– Matt`;

  const ownerText = `Paid KindAI Founding Workflow Setup received.

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || "Not provided"}
Trade: ${input.tradeType || "Not provided"}
Amount paid: ${formattedAmount}
Stripe checkout session: ${input.stripeSessionId}

Action: confirm the beta-signup record is active, verify the account uses the same email, then book the setup session.`;

  const [customerSent, ownerSent] = await Promise.all([
    sendResendEmail({
      to: input.email,
      subject: "Your KindAI Founding Workflow Setup payment is confirmed",
      text: customerText,
    }),
    sendResendEmail({
      to: notificationEmail,
      subject: `Paid KindAI workflow setup: ${input.name}`,
      text: ownerText,
    }),
  ]);

  return { customerSent, ownerSent };
}
