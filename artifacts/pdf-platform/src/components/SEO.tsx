import { Helmet } from 'react-helmet-async';
import { useTranslation } from '@/lib/i18n';

interface SEOProps {
  title?: string;
  description?: string;
}

export function SEO({ title, description }: SEOProps) {
  const { language, t } = useTranslation();
  
  const siteTitle = t.appTitle;
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const metaDescription = description || t.heroSubtitle;

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": siteTitle,
    "description": metaDescription,
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
      
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />

      <link rel="alternate" hrefLang="en" href="https://example.com/en" />
      <link rel="alternate" hrefLang="ar" href="https://example.com/ar" />
      <link rel="alternate" hrefLang="x-default" href="https://example.com/" />

      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
