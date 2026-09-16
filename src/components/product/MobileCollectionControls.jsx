import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const slotRef = useRef(null);
  const [toolbarPinned, setToolbarPinned] = useState(false);
  const [toolbarTop, setToolbarTop] = useState(56);

  useEffect(() => {
    const marker = toolbarMarkerRef.current;
    const slot = slotRef.current;
    const header = document.querySelector('[data-store-header]');
    if (!marker || !slot) return;
    let frame = 0;
    let pinned = false;
    let offset = 0;
    const update = () => {
      frame = 0;
      const top = marker.getBoundingClientRect().top;
      // A small release margin avoids flickering at the sticky boundary.
      const nextPinned = slot.getClientRects().length > 0 && top <= offset + (pinned ? 8 : 0);
      if (nextPinned !== pinned) {
        pinned = nextPinned;
        setToolbarPinned(pinned);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      // Measure the header once per resize, including PWA safe-area padding.
      // Never derive the fixed layer's position from moving page content.
      offset = header?.getBoundingClientRect().height || (window.matchMedia('(min-width: 768px)').matches ? 80 : 56);
      setToolbarTop(previous => previous === offset ? previous : offset);
      schedule();
    };
    const headerObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    // Safe-area padding changes the border box even when content height is unchanged.
    if (header) headerObserver?.observe(header, { box: 'border-box' });
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      headerObserver?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, []);


  const controls = (
      <div data-pinned={toolbarPinned} data-collection-toolbar
        style={toolbarPinned ? { top: toolbarTop } : undefined}
        className={`lg:hidden ${toolbarPinned ? 'fixed inset-x-0 z-[90] isolate [transform:translateZ(0)]' : ''}`}>
        <div data-collection-surface className="border-b border-stone-200 bg-white shadow-sm">
        <div className={`mx-auto flex max-w-3xl gap-3 px-3 ${toolbarPinned ? 'py-1.5' : 'py-3'}`}>
          <button type="button" onClick={() => setShowMobileFilter(true)} aria-haspopup="dialog" aria-expanded={showMobileFilter}
            className={`flex flex-1 items-center justify-center gap-2 bg-[#681f3b] px-3 font-bold text-white transition-colors hover:bg-[#51172e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#681f3b] ${toolbarPinned ? 'h-11 rounded-lg text-xs' : 'h-12 rounded-xl text-sm'}`}>
            <HiFilter size={toolbarPinned ? 16 : 18} aria-hidden="true" /> Filters
            {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs text-[#681f3b]">{activeFilterCount}</span>}
          </button>
          <button type="button" onClick={() => setShowMobileSort(true)} aria-haspopup="dialog" aria-expanded={showMobileSort} aria-label={`Sort by: ${selectedSort?.label}`} title={`Sort by: ${selectedSort?.label}`}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 border border-stone-200 bg-white px-3 text-primary transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#681f3b] ${toolbarPinned ? 'h-11 rounded-lg text-xs' : 'h-12 rounded-xl text-sm'}`}>
            <HiSortAscending size={toolbarPinned ? 16 : 18} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0 text-left"><span className="block font-bold">Sort by</span><span className={`${toolbarPinned ? 'hidden' : 'block'} truncate text-[11px] text-stone-500`}>{selectedSort?.label}</span></span>
          </button>
        </div>
        </div>
      </div>

  );

  return <>
      {/* The fixed-height slot keeps products and the scroll anchor stationary. */}
      <div ref={toolbarMarkerRef} className="h-px lg:hidden" aria-hidden="true" />
      <div ref={slotRef} data-collection-slot className="h-[73px] lg:hidden">
        {!toolbarPinned && controls}
      </div>
      {toolbarPinned && createPortal(controls, document.body)}

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
