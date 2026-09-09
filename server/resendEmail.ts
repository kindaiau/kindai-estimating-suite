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
    from:
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Kindai Team <noreply@kindaiestimator.com>",
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
    process.env.OWNER_NOTIFICATION_EMAIL?.trim() ||
    process.env.MATTHEW_NOTIFICATION_EMAIL?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    "support@kindaiestimator.com"
  );
}

export async function sendPilotLeadEmails(input: PilotLeadInput) {
  const notificationEmail =
    getOwnerNotificationEmail();

  const leadText = `Hey ${input.name},

Thanks for requesting a Kindai pilot spot.

I’m personally reviewing each founding pilot because we’re keeping the first group small.

The goal is simple: help you quote faster without missing key costs, GST, supplier pricing, or margin checks.

I’ll be in touch shortly to confirm if there’s a good fit.

– Matt`;

  const matthewText = `New Kindai pilot lead received.

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || "Not provided"}
Trade: ${input.tradeType || "Not provided"}
Intent: ${input.intent}

Follow up today. This is a revenue lead.`;

  const [leadSent, ownerSent] = await Promise.all([
    sendResendEmail({
      to: input.email,
      subject: "Your Kindai pilot spot request",
      text: leadText,
    }),
    sendResendEmail({
      to: notificationEmail,
      subject: `New Kindai pilot lead: ${input.name}`,
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

Your Kindai founding pilot setup is paid and secured.

Next step: Matt will personally follow up to book your setup sprint and confirm the quoting workflow we should build first.

Your setup includes one founder-led setup sprint, your first quoting workflow, margin and GST checks, supplier pricing structure, 7 days of support, and your first 6 months of Kindai.

Amount paid: ${formattedAmount}

– Matt`;

  const ownerText = `Paid Kindai founding pilot setup received.

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || "Not provided"}
Trade: ${input.tradeType || "Not provided"}
Amount paid: ${formattedAmount}
Stripe checkout session: ${input.stripeSessionId}

Action: follow up today and book the setup sprint.`;

  const [customerSent, ownerSent] = await Promise.all([
    sendResendEmail({
      to: input.email,
      subject: "Your Kindai founding pilot setup is secured",
      text: customerText,
    }),
    sendResendEmail({
      to: notificationEmail,
      subject: `Paid Kindai pilot setup: ${input.name}`,
      text: ownerText,
    }),
  ]);

  return { customerSent, ownerSent };
}
