import { Helmet } from 'react-helmet-async';
import { useTranslation } from '@/lib/i18n';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
}

export function SEO({ title, description, path = '' }: SEOProps) {
  const { language, t } = useTranslation();

  const siteTitle = t.appTitle;
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDescription = description || t.heroSubtitle;

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : import.meta.env.VITE_SITE_URL || 'https://pdf-matrix.vercel.app';

  const canonicalUrl = `${origin}${path}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": siteTitle,
    "description": metaDescription,
    "url": origin,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <Helmet>
      <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />

      <link rel="alternate" hrefLang="en" href={`${origin}/?lang=en`} />
      <link rel="alternate" hrefLang="ar" href={`${origin}/?lang=ar`} />
      <link rel="alternate" hrefLang="x-default" href={origin} />

      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
