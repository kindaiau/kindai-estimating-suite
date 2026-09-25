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
    "description": "AI-assisted estimating software for Australian trades and builders. KindAI prepares structured estimate drafts from supported plans and business rules for estimator review.",
    "offers": [
      {
        "@type": "Offer",
        "name": "Interactive Estimating Sample",
        "price": "0",
        "priceCurrency": "AUD",
        "description": "Representative sample with no private-plan upload or open-ended free AI account"
      },
      {
        "@type": "Offer",
        "name": "Cabinet and Joinery Founding Workflow Setup",
        "price": "2750",
        "priceCurrency": "AUD",
        "description": "A$2,750 including GST for one configured workflow, two reviewed jobs and the first six months of Sole Tradie; application approval required"
      },
      {
        "@type": "Offer",
        "name": "Sole Tradie",
        "price": "149",
        "priceCurrency": "AUD",
        "billingIncrement": "P1M",
        "description": "One included user and 20 AI Vision takeoffs per month"
      }
    ],
    "featureList": [
      "AI Vision Takeoff from construction plans",
      "Trade-specific estimating workflows",
      "GST calculation and review",
      "Configurable labour and material rates",
      "Branded PDF quote generation",
      "Supplier and company price-book inputs",
      "Variations register",
      "Human approval before quote issue"
    ],
    "screenshot": "https://kindaiestimator.com/og-image.png",
    "softwareVersion": "1.0",
    "releaseNotes": "Controlled cabinet and joinery launch with human-reviewed plan reading and company inputs",
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
          "text": "KindAI Estimating Suite is AI-assisted estimating software for Australian trades and builders. It prepares a structured draft from supported plans, rates and business rules. A qualified estimator reviews quantities, assumptions, exclusions, pricing and compliance before a quote is issued."
        }
      },
      {
        "@type": "Question",
        "name": "Which Australian trades does Kindai support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "KindAI contains multiple trade workflow modules, but the current Founding Workflow Setup is limited to one cabinet-making or commercial-joinery workflow. Other trades require separate fit and product verification before purchase."
        }
      },
      {
        "@type": "Question",
        "name": "Is Kindai GST compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "KindAI can calculate and display 10% GST in an estimate or quote. The issuing business remains responsible for reviewing its GST registration details, tax treatment and final document requirements."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Kindai cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The cabinet and joinery Founding Workflow Setup costs A$2,750 including GST. It includes the first six months of Sole Tradie. After that period, the customer may choose Sole Tradie at A$149 per month or stop; there is no automatic setup renewal."
        }
      },
      {
        "@type": "Question",
        "name": "Does Kindai offer team or enterprise plans?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Not during the controlled founding launch. The public offer covers one agreed cabinet or joinery workflow and one user. Team permissions, seat limits, integrations and support must be validated before any broader offer is sold."
        }
      },
      {
        "@type": "Question",
        "name": "What states does Kindai cover in Australia?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "KindAI can record state or territory context for Australian estimating workflows. Users remain responsible for checking the current licensing, workplace, tax and technical requirements that apply to each job."
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
