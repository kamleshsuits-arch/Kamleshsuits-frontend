
// src/components/ProductList.jsx
import React, { useEffect, useEffectEvent, useState, useMemo, useRef, useCallback } from "react";
import { fetchProducts } from "../../api/products";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "./ProductCard";
import ProductFilter from "./ProductFilter";
import MobileCollectionControls from "./MobileCollectionControls";
import { clearCollectionFilters, filterCollectionProducts } from "../../utils/collectionFilters";
import { HiChevronUp } from "react-icons/hi";
import Loader from "../common/Loader";
import { useProductTaxonomy } from "../../hooks/useProductTaxonomy";

const PAGE_SIZE = 12;

const ProductList = ({ onInitialReady }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestAttempt, setRequestAttempt] = useState(0);
  const notifyInitialReady = useEffectEvent(() => onInitialReady?.());
  const navigate = useNavigate();
  const { taxonomy } = useProductTaxonomy();

  // Filters
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: null,
    type: [],
    productCategory: [],
    color: [],
    sort: "",
    minDiscount: 0,
  });

  const [searchParams] = useSearchParams();
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Show scroll top button after 800px (roughly 8 items)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToCollection = () => {
    document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Sync filters with URL search params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const isProductCategory = taxonomy.some(category => category.id === categoryParam);
      setFilters(prev => ({
        ...prev,
        productCategory: isProductCategory ? [categoryParam] : [],
        type: isProductCategory ? [] : [categoryParam]
      }));
    } else {
      setFilters(prev => ({ ...prev, productCategory: [], type: [] }));
    }
  }, [searchParams, taxonomy]);

  // Keep the browsing session stable: only an explicit retry fetches again.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchProducts();
        if (active) setProducts(data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (active) setError(true);
      } finally {
        if (active) {
          setLoading(false);
          notifyInitialReady();
        }
      }
    };

    loadProducts();

    return () => { active = false; };
  }, [requestAttempt]);

  // compute filtered and sorted list
  const filteredAndSorted = useMemo(() => filterCollectionProducts(products, filters), [products, filters]);

  // Reset only for a meaningful filter/sort change, never a new data reference.
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterKey]);

  const displayed = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;

  const loadMore = useCallback(() => {
    setVisibleCount(count => Math.min(count + PAGE_SIZE, filteredAndSorted.length));
  }, [filteredAndSorted.length]);

  // Append before the next rows enter view; existing keyed cards stay mounted.
  useEffect(() => {
    if (loading || !hasMore || !sentinelRef.current || !("IntersectionObserver" in window)) return;
    let triggered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!triggered && entries.some(entry => entry.isIntersecting)) {
          triggered = true;
          observer.disconnect();
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "600px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, displayed.length, filterKey, loadMore]);

  if (loading) return (
    <Loader message="Fetching Silk Collection..." />
  );



  return (
    <div className="bg-background min-h-screen relative pb-20 md:pb-0">
      
      <MobileCollectionControls products={products} filters={filters} setFilters={setFilters} resultCount={filteredAndSorted.length} />

      <div className="px-3 sm:px-4 py-6 sm:py-8 lg:py-12 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <ProductFilter products={products} filters={filters} setFilters={setFilters} />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-end mb-6 lg:mb-8 border-b border-stone-200 pb-4">
            <h2 className="text-xl lg:text-2xl font-serif text-primary">
              Collection <span className="text-secondary text-base lg:text-lg font-sans font-normal ml-2">({filteredAndSorted.length} items)</span>
            </h2>
          </div>

          {error ? (
            <div role="alert" className="py-20 text-center">
              <p className="text-secondary">We couldn't load the collection. Please try again.</p>
              <button type="button" onClick={() => setRequestAttempt(attempt => attempt + 1)}
                className="mt-4 min-h-12 rounded-xl bg-[#681f3b] px-6 font-bold text-white">
                Try again
              </button>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white border border-stone-100 rounded-sm">
              <p className="text-secondary text-lg font-light">No products match these filters.</p>
              <button 
                onClick={() => setFilters(clearCollectionFilters)}
                className="mt-6 text-primary border-b border-primary hover:text-accent hover:border-accent transition pb-1"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid - 2 Columns on Mobile */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-2 min-[380px]:gap-x-3 sm:gap-x-4 gap-y-6 sm:gap-y-8 lg:gap-x-6 lg:gap-y-12">
                {displayed.map((product) => (
                  <ProductCard key={product.suitId} product={product} onView={(p) => {
                    // Navigate to dedicated product page
                    navigate(`/product/${p.suitId}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }} />
                ))}
              </div>

              {/* Sentinel that triggers loading more when visible */}
              {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}

              {/* Manual fallback also supports keyboard-only browsing. */}
              <div className="mt-12 flex justify-center items-center">
                {hasMore ? (
                    <button
                      type="button"
                      onClick={loadMore}
                      className="py-3 px-8 bg-white border border-stone-300 text-primary text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition duration-300"
                    >
                      Load More
                    </button>
                ) : (
                  <div className="py-3 text-sm text-secondary italic font-serif">You've reached the end of the collection</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scroll Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToCollection}
          className="fixed bottom-24 right-6 z-50 hidden p-4 bg-white/30 backdrop-blur-lg border border-primary/20 text-primary rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-10 md:block"
          aria-label="Scroll to top of collection"
        >
          <HiChevronUp size={24} />
        </button>
      )}
    </div>
  );
};

export default ProductList;
