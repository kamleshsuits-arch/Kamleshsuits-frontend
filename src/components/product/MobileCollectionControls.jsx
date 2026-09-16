import { useCallback, useEffect, useRef, useState } from 'react';
import { HiFilter, HiSortAscending, HiCheck } from 'react-icons/hi';
import ProductFilter from './ProductFilter';
import CollectionSheet from './CollectionSheet';
import { clearCollectionFilters, countActiveFilters, SORT_OPTIONS } from '../../utils/collectionFilters';

export default function MobileCollectionControls({ products, filters, setFilters, resultCount }) {
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const closeMobileFilter = useCallback(() => setShowMobileFilter(false), []);
  const closeMobileSort = useCallback(() => setShowMobileSort(false), []);
  const activeFilterCount = countActiveFilters(filters);
  const selectedSort = SORT_OPTIONS.find(option => option.value === (filters.sort || ''));
  const toolbarMarkerRef = useRef(null);
  const [toolbarPinned, setToolbarPinned] = useState(false);

  useEffect(() => {
    if (!toolbarMarkerRef.current || !("IntersectionObserver" in window)) return;
    let observer;
    const observe = () => {
      observer?.disconnect();
      const offset = window.matchMedia('(min-width: 768px)').matches ? 80 : 56;
      observer = new IntersectionObserver(([entry]) => {
        setToolbarPinned(!entry.isIntersecting && entry.boundingClientRect.top <= offset);
      }, { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 });
      observer.observe(toolbarMarkerRef.current);
    };
    observe();
    window.addEventListener('resize', observe);
    return () => { observer?.disconnect(); window.removeEventListener('resize', observe); };
  }, []);


  return <>
      {/* The marker stays in normal flow so shrinking the toolbar cannot toggle itself. */}
      <div ref={toolbarMarkerRef} className="h-px lg:hidden" aria-hidden="true" />
      <div data-pinned={toolbarPinned} className="lg:hidden sticky top-[calc(3.5rem+var(--app-safe-top,0px))] md:top-20 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-lg shadow-sm">
        <div className={`mx-auto flex max-w-3xl gap-3 px-3 transition-[padding] duration-200 motion-reduce:transition-none ${toolbarPinned ? 'py-2' : 'py-3'}`}>
          <button type="button" onClick={() => setShowMobileFilter(true)} aria-haspopup="dialog" aria-expanded={showMobileFilter}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#681f3b] px-3 text-sm font-bold text-white transition hover:bg-[#51172e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#681f3b]">
            <HiFilter size={18} aria-hidden="true" /> Filters
            {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs text-[#681f3b]">{activeFilterCount}</span>}
          </button>
          <button type="button" onClick={() => setShowMobileSort(true)} aria-haspopup="dialog" aria-expanded={showMobileSort} aria-label={`Sort by: ${selectedSort?.label}`}
            className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-primary transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#681f3b]">
            <HiSortAscending size={18} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0 text-left"><span className="block text-sm font-bold">Sort by</span><span className="block truncate text-[11px] text-stone-500">{selectedSort?.label}</span></span>
          </button>
        </div>
      </div>

      {showMobileFilter && (
        <CollectionSheet title="Filters" subtitle={activeFilterCount ? `${activeFilterCount} selected · Refine your collection` : 'Find your perfect style'} onClose={closeMobileFilter}
          footer={<div className="flex items-center gap-3">
            <button type="button" disabled={!activeFilterCount} onClick={() => setFilters(clearCollectionFilters)}className="min-h-12 rounded-xl border border-stone-200 px-4 text-sm font-bold text-primary disabled:opacity-40">Clear all</button>
            <button type="button" onClick={closeMobileFilter} className="min-h-12 flex-1 rounded-xl bg-[#681f3b] px-3 text-sm font-bold text-white">Show {resultCount} {resultCount === 1 ? 'product' : 'products'}</button>
          </div>}>
          <ProductFilter products={products} filters={filters} setFilters={setFilters} isMobile />
        </CollectionSheet>
      )}
      {showMobileSort && (
        <CollectionSheet title="Sort by" subtitle="Choose how you explore the collection" onClose={closeMobileSort}>
          <div role="group" aria-label="Sort options" className="space-y-2 p-5">
            {SORT_OPTIONS.map(option => <button type="button" key={option.value} aria-pressed={(filters.sort || '') === option.value}
              onClick={() => { setFilters(previous => ({ ...previous, sort: option.value })); closeMobileSort(); }}
              className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-[#681f3b] ${(filters.sort || '') === option.value ? 'border-[#681f3b]/30 bg-[#681f3b]/5 font-bold text-[#681f3b]' : 'border-stone-100 text-secondary hover:bg-stone-50'}`}>
              <span>{option.label}</span>
              {(filters.sort || '') === option.value ? <HiCheck size={18} aria-hidden="true" /> : <span aria-hidden="true" className="h-4 w-4 rounded-full border border-stone-300" />}
            </button>)}
          </div>
        </CollectionSheet>
      )}

  </>;
}
