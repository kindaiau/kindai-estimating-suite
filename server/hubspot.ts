/**
 * HubSpot CRM Integration
 * Creates contacts and deals for every Kindai beta sign-up
 */

const HUBSPOT_API_BASE = "https://api.hubapi.com";

function getToken(): string {
  const token = process.env.HUBSPOT_API_KEY;
  if (!token) throw new Error("HUBSPOT_API_KEY not set");
  return token;
}

async function hubspotFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    console.error("[HubSpot] API error:", res.status, JSON.stringify(body));
  }
  return { ok: res.ok, status: res.status, body };
}

export interface BetaSignupData {
  name: string;
  email: string;
  company?: string;
  trade?: string;
  state?: string;
  projectSize?: string;
  spotNumber: number;
}

/**
 * Upsert a contact in HubSpot and create a deal for the beta sign-up.
 * Returns { contactId, dealId } on success, or null on failure.
 */
export async function createBetaSignupInHubSpot(data: BetaSignupData): Promise<{ contactId: string; dealId: string } | null> {
  try {
    const [firstName, ...rest] = data.name.trim().split(" ");
    const lastName = rest.join(" ") || "-";

    // 1. Upsert contact by email
    const contactRes = await hubspotFetch("/crm/v3/objects/contacts", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          email: data.email,
          firstname: firstName,
          lastname: lastName,
          company: data.company ?? "",
          phone: "",
          hs_lead_status: "NEW",
          // Custom properties — stored as notes if they don't exist yet
          jobtitle: data.trade ?? "",
          state: data.state ?? "",
          // Tag as beta user
          lifecyclestage: "lead",
        },
      }),
    });

    let contactId: string;

    if (contactRes.ok) {
      contactId = (contactRes.body as { id: string }).id;
      console.log(`[HubSpot] Created contact ${contactId} for ${data.email}`);
    } else if (contactRes.status === 409) {
      // Contact already exists — get their ID
      const existingRes = await hubspotFetch(
        `/crm/v3/objects/contacts/${encodeURIComponent(data.email)}?idProperty=email`
      );
      if (!existingRes.ok) {
        console.error("[HubSpot] Failed to fetch existing contact");
        return null;
      }
      contactId = (existingRes.body as { id: string }).id;
      console.log(`[HubSpot] Found existing contact ${contactId} for ${data.email}`);
    } else {
      return null;
    }

    // 2. Create a deal linked to the contact
    const dealRes = await hubspotFetch("/crm/v3/objects/deals", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          dealname: `Beta Sign-up — ${data.name} (Spot #${data.spotNumber})`,
          pipeline: "default",
          dealstage: "appointmentscheduled", // "Beta Lead" stage — first stage in default pipeline
          amount: "0",
          closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          description: `Trade: ${data.trade ?? "N/A"} | State: ${data.state ?? "N/A"} | Company size: ${data.projectSize ?? "N/A"} | Founding member #${data.spotNumber}`,
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }],
          },
        ],
      }),
    });

    if (!dealRes.ok) {
      console.error("[HubSpot] Failed to create deal");
      // Still return contact ID even if deal fails
      return { contactId, dealId: "" };
    }

    const dealId = (dealRes.body as { id: string }).id;
    console.log(`[HubSpot] Created deal ${dealId} for contact ${contactId}`);

    return { contactId, dealId };
  } catch (err) {
    console.error("[HubSpot] Unexpected error:", err);
    return null;
  }
}

/**
 * Test the HubSpot connection — used in vitest
 */
export async function testHubSpotConnection(): Promise<boolean> {
  try {
    const res = await hubspotFetch("/account-info/v3/details");
    return res.ok;
  } catch {
    return false;
  }
}
