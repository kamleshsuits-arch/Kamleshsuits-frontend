// src/pages/Home.jsx
import React from "react";
import Hero from "../components/home/Hero";
import LocationBar from "../components/common/LocationBar";
import MobileCategoryBar from "../components/home/MobileCategoryBar";
import StyleDealsSection from "../components/home/StyleDealsSection";
import ProductList from "../components/product/ProductList";
import SEO from "../components/common/SEO";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 page-home">
      <SEO
        title="Home"
        description="Shop the latest Indian style ladies suits and ethnic wear at Kamlesh Suits, Gurugram. From festive silk to daily cotton suits, discover premium high-end fashion."
        keywords="ladies suits, ethnic wear, gurugram suits, cotton suits, silk suits, kamlesh suits home"
        url="/"
        schemaData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Kamlesh Suits",
          "url": "https://kamleshsuits.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://kamleshsuits.com/?s={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />

      {/* Hero banner (includes LocationBar on Mobile) */}
      <Hero />

      {/* Mobile-only: Zepto-style category card chips */}
      <MobileCategoryBar />

      {/* Mobile-only: Fashion Deals style collection section */}
      <StyleDealsSection />

      {/* Full product grid */}
      <div id="collection-section" className="container mx-auto">
        <ProductList />
      </div>
    </div>
  );
}