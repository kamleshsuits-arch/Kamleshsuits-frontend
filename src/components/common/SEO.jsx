import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  schemaData 
}) => {
  const siteName = "Kamlesh Suits";
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Premium Indian Ethnic Wear`;
  const defaultDescription = "Discover the finest Indian ladies suits and ethnic wear in Gurugram. High-quality unstitched suits, silk collections, and festive wear at Kamlesh Suits.";
  const siteUrl = "https://kamleshsuits.com";
  const instagramUser = "@kamleshsuits";

  // Base Schema for Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": siteName,
    "url": siteUrl,
    "logo": `${siteUrl}/assets/logo.png`,
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
      <link rel="canonical" href={url ? `${siteUrl}${url}` : siteUrl} />

      {/* Layer 2: Social Media SEO (Instagram Preview) */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title || siteName} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url ? `${siteUrl}${url}` : siteUrl} />
      <meta property="og:image" content={image || `${siteUrl}/preview.jpg`} />
      
      {/* Twitter/Instagram Card hints */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={instagramUser} />
      <meta name="twitter:creator" content={instagramUser} />

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
