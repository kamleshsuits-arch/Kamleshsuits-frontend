import { useMemo } from 'react';
import ProductCard from "../product/ProductCard";
import { getRelatedProducts } from '../../utils/productRecommendations';

const YouMayAlsoLike = ({ currentProduct, allProducts, onProductSelect, maxResults = 8, selectedColor, className = '' }) => {
  const recommendations = useMemo(() => getRelatedProducts(currentProduct, allProducts, { selectedColor, limit: maxResults }),
    [currentProduct, allProducts, selectedColor, maxResults]);

  if (recommendations.length === 0) return null;

  return (
    <section aria-label="You May Also Like" className={`w-full ${className}`}>
      <div className="flex flex-col items-center mb-6 sm:mb-12">
        <span className="text-accent text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Recommended Products</span>
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
    </section>
  );
};

export default YouMayAlsoLike;
