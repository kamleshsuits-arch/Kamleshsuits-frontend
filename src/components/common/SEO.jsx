import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  price,
  currency = 'INR',
  availability = 'in stock',
  schemaData 
}) => {
  const siteName = "Kamlesh Suits";
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Premium Indian Ethnic Wear`;
  const defaultDescription = "Discover the finest Indian ladies suits and ethnic wear in Gurugram. High-quality unstitched suits, silk collections, and festive wear at Kamlesh Suits.";
  const siteUrl = "https://kamleshsuits.com";
  const canonicalUrl = url?.startsWith('http') ? url : `${siteUrl}${url || ''}`;
  const socialImage = image
    ? (image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`)
    : `${siteUrl}/icons/pwa-512.png`;

  // Base Schema for Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": siteName,
    "url": siteUrl,
    "logo": `${siteUrl}/icons/pwa-512.png`,
    "sameAs": [
      "https://www.instagram.com/kamleshsuits/"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Khandewla, Pataudi",
      "addressLocality": "Gurugram",
      "addressRegion": "Haryana",
      "postalCode": "122504",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-99928-92775",
      "contactType": "customer service"
    }
  };

  return (
    <Helmet>
      {/* Layer 1: Google SEO */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="me" href="https://www.instagram.com/kamleshsuits/" />

      {/* Layer 2: Open Graph for WhatsApp, Facebook, Instagram and other previews */}
      <meta property="og:locale" content="en_IN" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:secure_url" content={socialImage} />
      <meta property="og:image:alt" content={title ? `${title} by Kamlesh Suits` : 'Kamlesh Suits premium ethnic wear'} />
      {type === 'product' && price != null && <meta property="product:price:amount" content={String(price)} />}
      {type === 'product' && price != null && <meta property="product:price:currency" content={currency} />}
      {type === 'product' && <meta property="product:availability" content={availability} />}
      
      {/* X/Twitter and compatible large-image card previews */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={socialImage} />
      <meta name="twitter:image:alt" content={title ? `${title} by Kamlesh Suits` : 'Kamlesh Suits premium ethnic wear'} />

      {/* Layer 3: AI SEO (Structured Data) */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
