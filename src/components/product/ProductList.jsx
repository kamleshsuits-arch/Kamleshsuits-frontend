
// src/components/ProductList.jsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { fetchProducts } from "../../api/products";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "./ProductCard";
import ProductFilter from "./ProductFilter";
import { useCart } from "../../hooks/useCart.jsx";
import { HiFilter, HiSortAscending, HiX, HiCheck, HiChevronUp } from "react-icons/hi";
import Loader from "../common/Loader";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: null,
    type: [],
    color: [],
    sort: "",
    minDiscount: 0,
    showAllTypes: false,
    showAllColors: false,
  });

  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { addToCart } = useCart();
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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToCollection = () => {
    document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Sync filters with URL search params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setFilters(prev => ({
        ...prev,
        type: [categoryParam]
      }));
    }
  }, [searchParams]);

  // --- Lazy loading / paging state ---
  const PAGE_SIZE = 12; // items per "page" loaded
  const [page, setPage] = useState(1); // current page (1-indexed)
  const [displayed, setDisplayed] = useState([]); // currently displayed products (subset)
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  useEffect(() => {
    const loadProducts = async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const data = await fetchProducts();
        setProducts(data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        if (showLoader) setLoading(false);
      }
    };

    loadProducts();

    // Focus-based re-fetch for "real-time" feel
    const handleFocus = () => loadProducts(false);
    window.addEventListener('focus', handleFocus);

    // Poll every 30s so badge/price changes from admin reflect automatically
    const pollInterval = setInterval(() => loadProducts(false), 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  // compute filtered and sorted list
  const filteredAndSorted = useMemo(() => {
    let result = (products || [])
      .filter((p) => {
      if (!p) return false;

      const price = Number(p.price ?? 0);
      const min = filters.minPrice ?? 0;
      const max = filters.maxPrice ?? Infinity;
      if (price < min || price > max) return false;

      if (filters.type && filters.type.length > 0) {
        const pCategories = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
        const pTags = [p.type, p.session, ...pCategories].filter(Boolean);
        const hasMatch = pTags.some(tag => filters.type.includes(tag));
        if (!hasMatch) return false;
      }

      if (filters.color && filters.color.length > 0) {
        const pColors = Array.isArray(p.colors)
          ? p.colors
          : String(p.colors || "")
              .split(",")
              .map((x) => x.trim());
        const hasMatch = pColors.some((c) => filters.color.includes(c));
        if (!hasMatch) return false;
      }

      const discount = Number(p.discount ?? 0);
      if (filters.minDiscount && discount < filters.minDiscount) return false;

      return true;
    });

    if (filters.sort) {
      result.sort((a, b) => {
        switch (filters.sort) {
          case "price_asc":
            return (a.price || 0) - (b.price || 0);
          case "price_desc":
            return (b.price || 0) - (a.price || 0);
          case "discount":
            return (b.discount || 0) - (a.discount || 0);
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "newest":
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [products, filters]);

  // Reset paging when filters or product list change
  useEffect(() => {
    setPage(1);
    setDisplayed(filteredAndSorted.slice(0, PAGE_SIZE));
  }, [filteredAndSorted]);

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    // simulate small delay for UX (optional)
    setTimeout(() => {
      setPage((prev) => {
        const next = prev + 1;
        const nextItems = filteredAndSorted.slice(0, next * PAGE_SIZE);
        setDisplayed(nextItems);
        return next;
      });
      setIsLoadingMore(false);
    }, 250);
  }, [filteredAndSorted, isLoadingMore]);

  // IntersectionObserver to auto-load when sentinel is visible
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return; // fallback: user can click "Load more"
    // disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Only load more if there are more items to show
            const currentlyShown = displayed.length;
            if (currentlyShown < filteredAndSorted.length) {
              loadMore();
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [displayed.length, filteredAndSorted.length, loadMore]);

  if (loading) return (
    <Loader message="Fetching Silk Collection..." />
  );



  return (
    <div className="bg-background min-h-screen relative pb-20 md:pb-0">
      
      {/* Mobile Sticky Filter & Sort Bar — pill style. top is sum(Navbar 56px + CategoryBar 84px) = 140px = 8.75rem */}
      <div className="lg:hidden sticky top-[8.75rem] z-30 bg-white border-b border-stone-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2 px-3 py-2">
          {/* Filter button with active count badge */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border-2 border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 transition relative"
          >
            <HiFilter size={15} /> Filter
            {/* Active filter count */}
            {(filters.type?.length > 0 || filters.color?.length > 0 || filters.minDiscount > 0) && (
              <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-accent to-highlight text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {(filters.type?.length || 0) + (filters.color?.length || 0) + (filters.minDiscount > 0 ? 1 : 0)}
              </span>
            )}
          </button>
          {/* Sort button showing current sort */}
          <button
            onClick={() => setShowMobileSort(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border-2 border-stone-200 text-stone-600 bg-white hover:border-accent/40 hover:text-accent transition"
          >
            <HiSortAscending size={15} />
            {filters.sort
              ? { price_asc: 'Low→High', price_desc: 'High→Low', discount: 'Discount', rating: 'Rating', newest: 'Newest' }[filters.sort] || 'Sort'
              : 'Sort By'}
          </button>
        </div>
      </div>

      <div className="px-4 py-8 lg:py-12 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
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

          {filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white border border-stone-100 rounded-sm">
              <p className="text-secondary text-lg font-light">No products match these filters.</p>
              <button 
                onClick={() => setFilters({})} 
                className="mt-6 text-primary border-b border-primary hover:text-accent hover:border-accent transition pb-1"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid - 2 Columns on Mobile */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-12">
                {displayed.map((product) => (
                  <ProductCard key={product.suitId} product={product} onView={(p) => {
                    // Navigate to dedicated product page
                    navigate(`/product/${p.suitId}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }} />
                ))}
              </div>

              {/* Sentinel that triggers loading more when visible */}
              <div ref={sentinelRef} className="h-10" />

              {/* Loading indicator or "Load more" fallback */}
              <div className="mt-12 flex justify-center items-center">
                {displayed.length < filteredAndSorted.length ? (
                  isLoadingMore ? (
                    <div className="py-3 px-8 bg-white border border-stone-200 text-secondary text-sm tracking-widest uppercase animate-pulse">Loading...</div>
                  ) : (
                    <button
                      onClick={loadMore}
                      className="py-3 px-8 bg-white border border-stone-300 text-primary text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition duration-300"
                    >
                      Load More
                    </button>
                  )
                ) : (
                  <div className="py-3 text-sm text-secondary italic font-serif">You've reached the end of the collection</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl transform transition-transform duration-300 overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b border-stone-100 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-lg text-primary">Filter</h3>
              <button onClick={() => setShowMobileFilter(false)} className="p-1 text-secondary">
                <HiX size={24} />
              </button>
            </div>
            <div className="p-4">
              <ProductFilter products={products} filters={filters} setFilters={setFilters} isMobile={true} />
            </div>
            <div className="p-4 border-t border-stone-100 sticky bottom-0 bg-white">
              <button 
                onClick={() => setShowMobileFilter(false)}
                className="w-full py-3 bg-primary text-white uppercase tracking-widest text-sm font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Drawer */}
      {showMobileSort && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSort(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl transform transition-transform duration-300 max-h-[50vh] overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b border-stone-100">
              <h3 className="font-serif text-lg text-primary">Sort By</h3>
              <button onClick={() => setShowMobileSort(false)} className="p-1 text-secondary">
                <HiX size={24} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: "Featured", value: "" },
                { label: "Newest First", value: "newest" },
                { label: "Price: Low to High", value: "price_asc" },
                { label: "Price: High to Low", value: "price_desc" },
                { label: "Better Discount", value: "discount" },
                { label: "Customer Rating", value: "rating" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sort: option.value }));
                    setShowMobileSort(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-sm text-left ${
                    filters.sort === option.value ? "bg-muted text-primary font-bold" : "text-secondary"
                  }`}
                >
                  <span>{option.label}</span>
                  {filters.sort === option.value && <HiCheck size={20} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scroll Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToCollection}
          className="fixed bottom-24 right-6 z-50 p-4 bg-white/30 backdrop-blur-lg border border-primary/20 text-primary rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-10"
          aria-label="Scroll to top of collection"
        >
          <HiChevronUp size={24} />
        </button>
      )}
    </div>
  );
};

export default ProductList;
