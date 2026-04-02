import { Helmet } from 'react-helmet-async';
import { useTranslation, Language } from '@/lib/i18n';

const SITE_URL = 'https://studio-pdf.site';

const LANG_KEYWORDS: Record<Language, string> = {
  en: 'pdf converter, pdf to word, pdf to excel, pdf to powerpoint, pdf to image, pdf to png, pdf to jpg, pdf to text, convert pdf online, free pdf converter, pdf matrix',
  ar: 'تحويل pdf, محول pdf, pdf إلى وورد, pdf إلى إكسل, pdf إلى صورة, تحويل ملفات pdf مجاناً',
  fr: 'convertir pdf, convertisseur pdf, pdf en word, pdf en excel, pdf en image, convertir pdf en ligne gratuit',
  es: 'convertir pdf, convertidor pdf, pdf a word, pdf a excel, pdf a imagen, convertir pdf gratis online',
  tr: 'pdf dönüştürücü, pdf çevirici, pdf word dönüştür, pdf excel dönüştür, pdf resme dönüştür, ücretsiz pdf dönüştür',
  ur: 'پی ڈی ایف تبدیل, پی ڈی ایف کنورٹر, پی ڈی ایف سے ورڈ, پی ڈی ایف سے ایکسل, مفت پی ڈی ایف',
};

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
}

export function SEO({ title, description, path = '' }: SEOProps) {
  const { language, t } = useTranslation();

  const siteTitle = 'PDF Matrix';
  const fullTitle = title
    ? `${title} | ${siteTitle}`
    : `${siteTitle} – Free PDF Converter to Word, Excel, PowerPoint, PNG`;
  const metaDescription = description || t.heroSubtitle;
  const canonicalUrl = `${SITE_URL}${path}`;
  const isRTL = language === 'ar' || language === 'ur';

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": siteTitle,
    "url": SITE_URL,
    "description": "Free online PDF converter. Convert PDF to DOCX, XLSX, PPTX, PNG, JPG, TXT instantly. No signup required.",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "All",
    "inLanguage": ["en", "ar", "fr", "es", "tr", "ur"],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "PDF to Word (DOCX)",
      "PDF to Excel (XLSX)",
      "PDF to PowerPoint (PPTX)",
      "PDF to PNG image",
      "PDF to JPG image",
      "PDF to Text (TXT)"
    ]
  };

  return (
    <Helmet>
      <html lang={language} dir={isRTL ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={LANG_KEYWORDS[language]} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={language} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />

      <link rel="alternate" hrefLang="en" href={`${SITE_URL}/?lang=en`} />
      <link rel="alternate" hrefLang="ar" href={`${SITE_URL}/?lang=ar`} />
      <link rel="alternate" hrefLang="fr" href={`${SITE_URL}/?lang=fr`} />
      <link rel="alternate" hrefLang="es" href={`${SITE_URL}/?lang=es`} />
      <link rel="alternate" hrefLang="tr" href={`${SITE_URL}/?lang=tr`} />
      <link rel="alternate" hrefLang="ur" href={`${SITE_URL}/?lang=ur`} />
      <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
