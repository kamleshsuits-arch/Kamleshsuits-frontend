// src/pages/Home.jsx
import React from "react";
import Hero from "../components/home/Hero";
import ProductList from "../components/product/ProductList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <div id="collection-section" className="container mx-auto">
        <ProductList />
      </div>
    </div>
  );
}