import ProductCard from "../product/ProductCard";

const YouMayAlsoLike = ({ currentProduct, allProducts, onProductSelect, maxResults = 8 }) => {
  if (!allProducts) return null;

  // Recommendation logic: 
  // If currentProduct exists: same type or brand, excluding current.
  // If no currentProduct (e.g. Wishlist page): just show top items (first N).
  let recommendations = [];

  if (currentProduct) {
    recommendations = allProducts
      .filter((p) => {
        if (p.suitId === currentProduct.suitId) return false;
        
        // Match based on multiple criteria for "Related" feel
        const matchesType = p.type === currentProduct.type;
        const matchesFabric = p.fabric_family === currentProduct.fabric_family;
        const matchesCategory = p.fabric_category === currentProduct.fabric_category;
        const matchesBrand = p.brand === currentProduct.brand;
        
        return matchesType && (matchesFabric || matchesCategory || matchesBrand);
      })
      .slice(0, maxResults);
      
    // If we don't have enough matches, add some generic ones
    if (recommendations.length < 2) {
      const extra = allProducts
        .filter(p => p.suitId !== currentProduct.suitId && !recommendations.find(r => r.suitId === p.suitId))
        .slice(0, maxResults - recommendations.length);
      recommendations = [...recommendations, ...extra];
    }
  } else {
    // Fallback / Trending logic
    recommendations = allProducts.slice(0, maxResults);
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-6 sm:mb-12">
        <span className="text-accent text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Curated For You</span>
        <h2 className="text-xl sm:text-2xl md:text-4xl font-serif text-primary text-center">You May Also Like</h2>
        <div className="w-12 sm:w-16 md:w-24 h-1 bg-accent mt-3 sm:mt-4"></div>
      </div>
      
      {/* Mobile: Horizontal Scroll | Desktop: Grid */}
      <div className="flex overflow-x-scroll snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-12 md:pb-0 scrollbar-default">
        {recommendations.map((product) => (
          <div key={product.suitId} className="flex-shrink-0 w-40 sm:w-48 md:w-auto snap-center">
            <ProductCard 
              product={product} 
              onView={onProductSelect} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouMayAlsoLike;