import { PRO_OFFER } from '@shared/kindaiOffer';
import { Helmet } from "react-helmet-async";

/**
 * Injects JSON-LD structured data into the page <head>.
 * Used for Google Rich Results: SoftwareApplication, Organization, FAQPage.
 */
export function SoftwareAppSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Kindai Estimating Suite",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": "https://kindaiestimator.com",
    "description": "AI-powered estimating and quoting software for Australian trades and builders. Scan construction plans, get instant takeoffs with materials, labour, and GST. Covers 20 Australian trades.",
    "offers": [
      {
        "@type": "Offer",
        "name": "One free sheet",
        "price": "0",
        "priceCurrency": "AUD",
        "description": "One lifetime drawing-sheet scan per verified user. No credit card."
      },
      ...(["monthly", "yearly"] as const).map(interval => ({
        "@type": "Offer",
        "name": `Pro (${interval})`,
        "price": String((interval === "monthly" ? PRO_OFFER.monthlyCents : PRO_OFFER.yearlyCents) / 100),
        "priceCurrency": PRO_OFFER.currency.toUpperCase(),
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": String((interval === "monthly" ? PRO_OFFER.monthlyCents : PRO_OFFER.yearlyCents) / 100),
          "priceCurrency": PRO_OFFER.currency.toUpperCase(),
          "billingDuration": interval === "monthly" ? "P1M" : "P1Y",
          "valueAddedTaxIncluded": true,
        },
        "description": "Pro subscription. Prices include GST."
      }))
    ],
    "featureList": [
      "AI Vision Takeoff from construction plans",
      "20 Australian trade modules",
      "GST-compliant quoting",
      "Fair Work Act labour rates",
      "Branded PDF quote generation",
      "Supplier integration (Reece, Middy's, Bowens, Boral)",
      "Market benchmarking",
      "Automated quote follow-up emails",
      "Variations register",
      "All 8 Australian states and territories"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "47",
      "bestRating": "5"
    },
    "screenshot": "https://kindaiestimator.com/og-image.png",
    "softwareVersion": "1.0",
    "releaseNotes": "AI estimating suite for Australian trades — plan reading, company memory, auto-SWMS",
    "inLanguage": "en-AU",
    "availableOnDevice": "Desktop, Mobile, Tablet",
    "countriesSupported": "AU"
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kindai",
    "url": "https://kindaiestimator.com",
    "logo": "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png",
    "description": "Kindai builds AI-powered tools for Australian trades and construction businesses.",
    "foundingDate": "2026",
    "areaServed": "AU",
    "knowsAbout": [
      "Construction estimating",
      "Trade quoting software",
      "AI takeoff",
      "Australian building compliance",
      "GST quoting"
    ],
    "sameAs": [
      "https://www.facebook.com/kindaiestimating",
      "https://www.instagram.com/kindaiestimating",
      "https://www.linkedin.com/company/kindai"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Kindai Estimating Suite?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Kindai Estimating Suite is AI-powered estimating and quoting software for Australian trades and builders. You photograph or upload your construction plans, and the AI reads every symbol, counts every fixture, and generates a full quote with materials, labour, markup, and GST in under 60 seconds."
        }
      },
      {
        "@type": "Question",
        "name": "Which Australian trades does Kindai support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Kindai covers 20 Australian trades: Electrical, Plumbing, Carpentry, Concreting, HVAC, Flooring, Landscaping, Cabinet Making & Joinery, Rendering, Painting, Bricklaying, Roofing, Tiling, Waterproofing, Fire Protection, Glazing, Quantity Surveying, Demolition, Swimming Pool Construction, and Steel Fabrication."
        }
      },
      {
        "@type": "Question",
        "name": "Is Kindai GST compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All Kindai quotes automatically include 10% GST with a full GST breakdown. Quotes are compliant with Australian tax requirements and include ABN fields, GST registration details, and proper invoice formatting."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Kindai cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Kindai Pro is A$${PRO_OFFER.monthlyCents / 100}/month or A$${PRO_OFFER.yearlyCents / 100}/year, including GST. Annual billing saves A$${PRO_OFFER.annualSavingAud} (${PRO_OFFER.annualSavingPercent}%) versus twelve monthly payments.`
        }
      },
      {
        "@type": "Question",
        "name": "Does Kindai work for large construction companies?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Kindai is designed to scale from solo tradies to $100M+ construction companies. Enterprise features include multi-user access, variations registers, supplier integration, automated follow-up sequences, and market benchmarking."
        }
      },
      {
        "@type": "Question",
        "name": "What states does Kindai cover in Australia?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Kindai covers all 8 Australian states and territories: NSW, VIC, QLD, SA, WA, TAS, NT, and ACT. Compliance requirements, licensing bodies (QBCC, VBA, NSW Fair Trading), and labour rates are tailored per state."
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
