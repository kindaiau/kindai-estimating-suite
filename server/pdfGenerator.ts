import puppeteer from "puppeteer-core";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

export type LineItemRow = {
  description: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PdfQuoteData = {
  // Business info
  businessName: string;
  abn?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  state?: string;
  trade: string;
  brandColor?: string;
  // Quote info
  quoteNumber: string;
  quoteDate: string;
  quoteValidDays?: number;
  // Client info
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectAddress?: string;
  projectTitle: string;
  // Line items
  lineItems: LineItemRow[];
  // Financials
  subtotal: number;
  margin?: number;
  marginAmount?: number;
  gstAmount: number;
  total: number;
  // Compliance
  complianceState?: string;
  complianceNotes?: string;
  quoteTerms?: string;
  notes?: string;
  // AI info
  aiConfidenceScore?: number;
  aiAssumptions?: string[];
};

const TRADE_COMPLIANCE: Record<string, { body: string; disclaimer: string }> = {
  electrical: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / SA Consumer & Business Services / EnergySafety WA",
    disclaimer: "All electrical work must be carried out by a licensed electrical contractor. A Certificate of Compliance (Electrical Work) must be issued upon completion. Work must comply with AS/NZS 3000:2018 (Wiring Rules) and applicable state regulations.",
  },
  plumbing: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / SA Consumer & Business Services / Building & Energy WA",
    disclaimer: "All plumbing and drainage work must be carried out by a licensed plumber. A Certificate of Compliance must be issued upon completion. Work must comply with AS/NZS 3500 and the National Construction Code.",
  },
  carpentry: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / SA Consumer & Business Services / Building & Energy WA",
    disclaimer: "All structural carpentry work must be carried out by a licensed builder. Work must comply with AS 1684 (Residential Timber-Framed Construction) and the National Construction Code.",
  },
  concreting: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / SA Consumer & Business Services / Building & Energy WA",
    disclaimer: "Concrete work must comply with AS 3600 (Concrete Structures) and AS 3610 (Formwork for Concrete). Reinforcement must comply with AS/NZS 4671.",
  },
  hvac: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / ARC Refrigerant Handling Licence",
    disclaimer: "All HVAC and refrigeration work must be carried out by a licensed contractor. Refrigerant handling requires an ARC licence. Work must comply with AS/NZS 1668 and AS 3666.",
  },
  flooring: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / SA Consumer & Business Services",
    disclaimer: "Flooring installation must comply with manufacturer specifications and AS 1884 (Floor Coverings — Resilient Sheet and Tiles). Subfloor preparation must meet AS 1884 moisture requirements.",
  },
  landscaping: {
    body: "QBCC (QLD) / NSW Fair Trading / SA Consumer & Business Services",
    disclaimer: "Landscaping works must comply with local council requirements. Irrigation systems must comply with AS/NZS 3500.1. Retaining walls over 1m may require a building permit.",
  },
  cabinetry: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / SA Consumer & Business Services",
    disclaimer: "Cabinet making and joinery must comply with AS/NZS 4386 (Domestic Kitchen Assemblies) and AWISA standards. All sheet materials must comply with AS/NZS 1859 for formaldehyde emissions (E0/E1 rating). Commercial joinery must comply with relevant BCA/NCC requirements. All work is carried out by a licensed cabinetmaking contractor. Prices are valid for 30 days from the date of issue.",
  },
  rendering: {
    body: "QBCC (QLD) / VBA (VIC) / NSW Fair Trading / SA Consumer & Business Services",
    disclaimer: "Rendering and plastering must comply with AS 3700 (Masonry Structures) and manufacturer specifications. External renders must be suitable for the local climate zone.",
  },

};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
}

function buildHtml(data: PdfQuoteData): string {
  const compliance = TRADE_COMPLIANCE[data.trade] ?? TRADE_COMPLIANCE.carpentry;
  const brandColor = data.brandColor ?? "#FF2D78";
  const validUntil = data.quoteValidDays
    ? new Date(Date.now() + data.quoteValidDays * 86400000).toLocaleDateString("en-AU")
    : null;

  const groupedItems = data.lineItems.reduce((acc, item) => {
    const cat = item.category || "Materials";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, LineItemRow[]>);

  const itemRows = Object.entries(groupedItems).map(([category, items]) => `
    <tr class="category-row">
      <td colspan="5">${category}</td>
    </tr>
    ${items.map(item => `
    <tr>
      <td class="item-desc">${item.description}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-center">${item.unit}</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="text-right font-bold">${formatCurrency(item.total)}</td>
    </tr>
    `).join("")}
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quote ${data.quoteNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px;
    color: #1a1a2e;
    background: #fff;
    line-height: 1.5;
  }
  .page { padding: 32px 40px; max-width: 800px; margin: 0 auto; }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 3px solid ${brandColor};
  }
  .logo-section { display: flex; align-items: center; gap: 12px; }
  .logo-img { width: 52px; height: 52px; object-fit: contain; }
  .business-name { font-size: 20px; font-weight: 900; color: ${brandColor}; letter-spacing: -0.5px; }
  .business-sub { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 1px; }
  .business-details { font-size: 10px; color: #555; margin-top: 4px; line-height: 1.6; }
  .quote-meta { text-align: right; }
  .quote-number { font-size: 22px; font-weight: 900; color: ${brandColor}; }
  .quote-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 4px; }
  .quote-date { font-size: 10px; color: #555; margin-top: 6px; }

  /* Client section */
  .client-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
    background: #f8f9fc;
    border-radius: 10px;
    padding: 16px 20px;
    border-left: 4px solid ${brandColor};
  }
  .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 6px; }
  .client-name { font-size: 14px; font-weight: 800; color: #1a1a2e; }
  .client-detail { font-size: 10px; color: #555; line-height: 1.7; }
  .project-title { font-size: 14px; font-weight: 800; color: #1a1a2e; }

  /* AI badge */
  .ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: linear-gradient(135deg, #FF2D78, #FF6B35);
    color: white;
    font-size: 9px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 14px;
    letter-spacing: 0.5px;
  }

  /* Line items table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .items-table thead tr {
    background: ${brandColor};
    color: white;
  }
  .items-table thead th {
    padding: 9px 12px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: left;
  }
  .items-table thead th.text-right { text-align: right; }
  .items-table thead th.text-center { text-align: center; }
  .items-table tbody tr:nth-child(even) { background: #f8f9fc; }
  .items-table tbody tr:hover { background: #f0f2ff; }
  .items-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #eee;
    font-size: 10px;
    color: #333;
  }
  .category-row td {
    background: #f0f2ff !important;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${brandColor};
    padding: 5px 12px;
    border-bottom: none;
  }
  .item-desc { font-weight: 500; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }

  /* Totals */
  .totals-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
  }
  .totals-table { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; font-size: 11px; }
  .totals-row.markup { color: ${brandColor}; font-weight: 600; }
  .totals-row.gst { color: #555; }
  .totals-row.total {
    font-size: 15px;
    font-weight: 900;
    color: ${brandColor};
    border-top: 2px solid ${brandColor};
    border-bottom: none;
    padding-top: 8px;
    margin-top: 4px;
  }
  .totals-label { color: #555; }
  .totals-row.total .totals-label { color: #1a1a2e; }
  .trade-savings {
    font-size: 9px;
    color: #16a34a;
    font-weight: 600;
    text-align: right;
    margin-top: 4px;
  }

  /* Compliance */
  .compliance-section {
    background: #f0f7ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }
  .compliance-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; margin-bottom: 6px; }
  .compliance-text { font-size: 9px; color: #374151; line-height: 1.6; }

  /* Terms */
  .terms-section {
    background: #f8f9fc;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }
  .terms-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 6px; }
  .terms-text { font-size: 9px; color: #666; line-height: 1.6; }

  /* AI assumptions */
  .assumptions-section {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  .assumptions-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #c2410c; margin-bottom: 6px; }
  .assumptions-list { list-style: none; }
  .assumptions-list li { font-size: 9px; color: #666; padding: 1.5px 0; }
  .assumptions-list li::before { content: "✓ "; color: #c2410c; font-weight: 700; }

  /* Acceptance */
  .acceptance-section {
    border: 2px dashed ${brandColor}40;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 20px;
    text-align: center;
  }
  .acceptance-title { font-size: 12px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px; }
  .acceptance-sub { font-size: 9px; color: #888; }
  .signature-line { border-bottom: 1px solid #ccc; margin: 14px auto; width: 60%; }
  .signature-label { font-size: 9px; color: #aaa; }

  /* Footer */
  .footer {
    border-top: 1px solid #eee;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-brand { font-size: 9px; color: #aaa; }
  .footer-brand strong { color: ${brandColor}; }
  .footer-gst { font-size: 9px; color: #aaa; }
  .valid-badge {
    display: inline-block;
    background: #dcfce7;
    color: #16a34a;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    margin-left: 8px;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-section">
      <img src="${LOGO_URL}" alt="Kindai" class="logo-img" />
      <div>
        <div class="business-name">${data.businessName || "Kindai Estimating"}</div>
        <div class="business-sub">Estimating Suite · ${data.trade.charAt(0).toUpperCase() + data.trade.slice(1)}</div>
        <div class="business-details">
          ${data.abn ? `ABN: ${data.abn}<br>` : ""}
          ${data.licenseNumber ? `Licence: ${data.licenseNumber}<br>` : ""}
          ${data.phone ? `Ph: ${data.phone}<br>` : ""}
          ${data.email ? `${data.email}` : ""}
        </div>
      </div>
    </div>
    <div class="quote-meta">
      <div class="quote-label">Quote Number</div>
      <div class="quote-number">${data.quoteNumber}</div>
      <div class="quote-date">
        Date: ${data.quoteDate}
        ${validUntil ? `<span class="valid-badge">Valid until ${validUntil}</span>` : ""}
      </div>
    </div>
  </div>

  <!-- Client + Project -->
  <div class="client-section">
    <div>
      <div class="section-label">Prepared for</div>
      <div class="client-name">${data.clientName || "Client"}</div>
      <div class="client-detail">
        ${data.clientEmail ? `${data.clientEmail}<br>` : ""}
        ${data.clientPhone ? `${data.clientPhone}<br>` : ""}
        ${data.projectAddress ? `${data.projectAddress}` : ""}
      </div>
    </div>
    <div>
      <div class="section-label">Project</div>
      <div class="project-title">${data.projectTitle}</div>
      ${data.complianceState ? `<div class="client-detail" style="margin-top:4px">State: ${data.complianceState}</div>` : ""}
    </div>
  </div>

  ${data.aiConfidenceScore ? `
  <div class="ai-badge">
    ✦ AI Vision Takeoff · ${data.aiConfidenceScore}% confidence · Powered by Kindai AI
  </div>
  ` : ""}

  <!-- Line Items -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:45%">Description</th>
        <th class="text-center" style="width:8%">Qty</th>
        <th class="text-center" style="width:8%">Unit</th>
        <th class="text-right" style="width:15%">Unit Price</th>
        <th class="text-right" style="width:15%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px">No line items</td></tr>`}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-table">
      <div class="totals-row">
        <span class="totals-label">Subtotal (ex GST)</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.margin && data.marginAmount ? `
      <div class="totals-row markup">
        <span class="totals-label">Margin (${data.margin}%)</span>
        <span>+${formatCurrency(data.marginAmount)}</span>
      </div>
      ` : ""}
      <div class="totals-row gst">
        <span class="totals-label">GST (10%)</span>
        <span>${formatCurrency(data.gstAmount)}</span>
      </div>
      <div class="totals-row total">
        <span class="totals-label">TOTAL (inc GST)</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
    </div>
  </div>

  ${data.aiAssumptions && data.aiAssumptions.length > 0 ? `
  <!-- AI Assumptions -->
  <div class="assumptions-section">
    <div class="assumptions-title">AI Takeoff Assumptions</div>
    <ul class="assumptions-list">
      ${data.aiAssumptions.map(a => `<li>${a}</li>`).join("")}
    </ul>
  </div>
  ` : ""}

  <!-- Compliance -->
  <div class="compliance-section">
    <div class="compliance-title">Australian Compliance Notice · ${data.trade.charAt(0).toUpperCase() + data.trade.slice(1)}</div>
    <div class="compliance-text">
      <strong>Licensing:</strong> ${compliance.body}<br><br>
      ${compliance.disclaimer}
      ${data.complianceNotes ? `<br><br><strong>Project notes:</strong> ${data.complianceNotes}` : ""}
    </div>
  </div>

  <!-- Terms -->
  <div class="terms-section">
    <div class="terms-title">Terms & Conditions</div>
    <div class="terms-text">${data.quoteTerms || "Payment terms: 50% deposit required before commencement. Balance due within 14 days of completion. This quote is valid for 30 days from the date of issue. All prices include GST where applicable."}</div>
  </div>

  ${data.notes ? `
  <div class="terms-section">
    <div class="terms-title">Notes</div>
    <div class="terms-text">${data.notes}</div>
  </div>
  ` : ""}

  <!-- Acceptance -->
  <div class="acceptance-section">
    <div class="acceptance-title">Quote Acceptance</div>
    <div class="acceptance-sub">By signing below, you accept this quote and authorise commencement of works.</div>
    <div class="signature-line"></div>
    <div class="signature-label">Client Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">Generated by <strong>Kindai Estimating Suite</strong> · kindai.ai</div>
    <div class="footer-gst">All amounts in AUD · GST registered · ABN ${data.abn || "—"}</div>
  </div>

</div>
</body>
</html>`;
}

export async function generateQuotePdf(data: PdfQuoteData): Promise<Buffer> {
  const html = buildHtml(data);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
