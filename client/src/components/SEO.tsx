import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://kindaiestimator.com";
const DEFAULT_TITLE = "Kindai | AI Estimating for Australian Trades";
const DEFAULT_DESCRIPTION =
  "Scan plans, get instant AI takeoffs and GST-ready quotes in 60 seconds. Built for Australian tradies and builders.";
const DEFAULT_KEYWORDS =
  "AI estimating software Australia, construction quoting software, trade takeoff software, builder quoting app, AI construction estimating";
const META_DOMAIN_VERIFICATION = import.meta.env.VITE_META_DOMAIN_VERIFICATION as string | undefined;

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonical,
  keywords = DEFAULT_KEYWORDS,
  ogTitle,
  ogDescription,
  ogType = "website",
  noIndex = false,
}: SEOProps) {
  const fullTitle = title === DEFAULT_TITLE ? title : `${title} | Kindai`;
  const resolvedCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const resolvedOgTitle = ogTitle || fullTitle;
  const resolvedOgDescription = ogDescription || description;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={resolvedCanonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow" />}
      {META_DOMAIN_VERIFICATION ? (
        <meta name="facebook-domain-verification" content={META_DOMAIN_VERIFICATION} />
      ) : null}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:site_name" content="Kindai Estimating Suite" />
      <meta property="og:locale" content="en_AU" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDescription} />

      {/* Geo targeting for Australia */}
      <meta name="geo.region" content="AU" />
      <meta name="geo.placename" content="Australia" />
      <meta name="language" content="en-AU" />
    </Helmet>
  );
}
