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
const DEFAULT_TITLE = "Kindai Estimating Suite | AI-Powered Quoting for Australian Trades";
const DEFAULT_DESCRIPTION =
  "AI-powered estimating and quoting software for Australian trades and builders. Scan plans, get instant takeoffs, send branded quotes with GST. 20 trades covered. Free beta access.";
const DEFAULT_KEYWORDS =
  "construction estimating software Australia, trade quoting software, AI estimating, building estimator Australia, electrical estimating software, plumbing estimating software, tradie quoting app, builder software Australia, construction takeoff software, quote builder Australia, GST quoting software, QBCC estimating";

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
  const fullTitle = title === DEFAULT_TITLE ? title : `${title} | Kindai Estimating Suite`;
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
