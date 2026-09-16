import React, { useId, useMemo, useState } from 'react';
import { HiCheck, HiChevronDown, HiOutlineSearch } from 'react-icons/hi';
import { useProductTaxonomy } from '../../hooks/useProductTaxonomy';
import { clearCollectionFilters, countActiveFilters, getCollectionColors, SORT_OPTIONS } from '../../utils/collectionFilters';

const OCCASIONS = ['Wedding', 'Party Wear', 'Festive', 'Outdoor', 'Karvachauth Spec.', 'Office', 'Casual', 'Daily Wear'];
const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#681f3b]';

const FilterSection = ({ title, count = 0, children }) => (
  <details open className="group border-b border-stone-100 py-5 last:border-0">
    <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg [&::-webkit-details-marker]:hidden ${focusStyle}`}>
      <span className="flex items-center gap-2 text-sm font-bold text-primary">
        {title}
        {count > 0 && <span className="rounded-full bg-[#681f3b]/10 px-2 py-0.5 text-xs text-[#681f3b]">{count}</span>}
      </span>
      <HiChevronDown className="text-stone-400 transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="pt-3">{children}</div>
  </details>
);

const ProductFilter = ({ filters, setFilters, products, isMobile = false }) => {
  const { taxonomy } = useProductTaxonomy();
  const id = useId();
  const [colorQuery, setColorQuery] = useState('');
  const [showAllColors, setShowAllColors] = useState(false);
  const colors = useMemo(() => getCollectionColors(products), [products]);
  const matchingColors = colors.filter(color => color.label.toLowerCase().includes(colorQuery.trim().toLowerCase()));
  const visibleColors = colorQuery || showAllColors ? matchingColors : matchingColors.slice(0, 8);
  const availableTags = new Set(products.flatMap(product => [product.type, product.session, ...(Array.isArray(product.categories) ? product.categories : [product.categories])]).filter(Boolean));
  const occasions = OCCASIONS.filter(occasion => availableTags.has(occasion));
  const activeCount = countActiveFilters(filters);
  const toggle = (key, value) => setFilters(previous => ({
    ...previous,
    [key]: (previous[key] || []).includes(value)
      ? previous[key].filter(item => item !== value)
      : [...(previous[key] || []), value],
  }));
  const priceInvalid = filters.maxPrice != null && filters.maxPrice < (filters.minPrice || 0);
  return (
    <div className={isMobile ? 'px-5' : 'rounded-2xl border border-stone-200 bg-white px-5 shadow-sm'}>
      {!isMobile && <div className="flex items-center justify-between gap-2 border-b border-stone-100 py-5">
        <div><h3 className="font-serif text-xl">Filters</h3><p className="mt-1 text-xs text-stone-500">Find your perfect style</p></div>
        <button type="button" disabled={!activeCount} onClick={() => setFilters(clearCollectionFilters)} className={`min-h-11 rounded-lg px-2 text-xs font-bold text-[#681f3b] disabled:opacity-40 ${focusStyle}`}>Clear all</button>
      </div>}
      {!isMobile && <div className="border-b border-stone-100 py-5">
        <label htmlFor={`${id}-sort`} className="mb-3 block text-sm font-bold text-primary">Sort by</label>
        <select id={`${id}-sort`} value={filters.sort || ''} onChange={event => setFilters(previous => ({ ...previous, sort: event.target.value }))} className={`min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm ${focusStyle}`}>
          {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>}
      <FilterSection title="Price range" count={filters.minPrice > 0 || filters.maxPrice != null ? 1 : 0}>
        <div className="grid grid-cols-2 gap-3">
          {[['minPrice', 'Minimum'], ['maxPrice', 'Maximum']].map(([key, label]) => <label key={key} className="min-w-0 text-xs text-stone-500">
            {label}
            <span className="mt-2 flex items-center rounded-xl border border-stone-200 bg-stone-50 px-3 focus-within:border-[#681f3b]">
              <span aria-hidden="true">₹</span>
              <input type="number" min="0" inputMode="numeric" aria-label={`${label} price`} aria-invalid={priceInvalid} aria-describedby={priceInvalid ? `${id}-price-error` : undefined} value={filters[key] ?? ''} placeholder={key === 'minPrice' ? '0' : 'Any'}
                onChange={event => { const value = event.target.value; setFilters(previous => ({ ...previous, [key]: value === '' ? null : Math.max(0, Number(value)) })); }}
                className="min-h-12 w-full min-w-0 bg-transparent pl-2 text-base text-primary outline-none" />
            </span>
          </label>)}
        </div>
        {priceInvalid && <p id={`${id}-price-error`} role="alert" className="mt-2 text-xs text-red-700">Maximum should be at least the minimum price.</p>}
      </FilterSection>
      <FilterSection title="Products" count={filters.productCategory?.length}>
        <div className="space-y-1">
          {taxonomy.map(category => <label key={category.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-stone-50">
            <input type="checkbox" checked={(filters.productCategory || []).includes(category.id)} onChange={() => toggle('productCategory', category.id)} className={`h-4 w-4 accent-[#681f3b] ${focusStyle}`} />
            {category.label}
          </label>)}
        </div>
      </FilterSection>
      {occasions.length > 0 && <FilterSection title="Occasion" count={filters.type?.length}>
        <div className="flex flex-wrap gap-2">
          {occasions.map(occasion => <button type="button" key={occasion} aria-pressed={(filters.type || []).includes(occasion)} onClick={() => toggle('type', occasion)} className={`min-h-11 rounded-xl border px-3 text-sm transition ${focusStyle} ${(filters.type || []).includes(occasion) ? 'border-[#681f3b] bg-[#681f3b]/5 font-bold text-[#681f3b]' : 'border-stone-200 text-secondary hover:border-stone-400'}`}>{occasion}</button>)}
        </div>
      </FilterSection>}
      <FilterSection title="Colors" count={filters.color?.length}>
        <p className="mb-3 text-xs text-stone-500">Pick one or mix your favorites.</p>
        {colors.length > 8 && <label className="mb-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 focus-within:border-[#681f3b]">
          <HiOutlineSearch aria-hidden="true" className="shrink-0 text-stone-400" />
          <input type="search" aria-label="Search colors" value={colorQuery} onChange={event => setColorQuery(event.target.value)} placeholder="Search colors" className="min-h-11 w-full min-w-0 bg-transparent text-base outline-none" />
        </label>}
        <div className="grid grid-cols-2 gap-2">
          {visibleColors.map(color => {
            const selected = (filters.color || []).includes(color.value);
            return <button type="button" key={color.value} aria-pressed={selected} onClick={() => toggle('color', color.value)} className={`relative flex min-h-14 items-center gap-2 rounded-xl border p-2 text-left transition ${focusStyle} ${selected ? 'border-[#681f3b] bg-[#681f3b]/5 text-[#681f3b]' : 'border-stone-200 hover:border-stone-400'}`}>
              <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full border border-black/10" style={{ background: color.swatch || 'repeating-linear-gradient(135deg, #e7e5e4 0 4px, #fafaf9 4px 8px)' }} />
              <span className="min-w-0 flex-1 break-words text-xs font-semibold capitalize">{color.label}</span>
              {selected && <HiCheck aria-hidden="true" className="h-4 w-4 shrink-0" />}
            </button>;
          })}
        </div>
        {matchingColors.length === 0 && <p className="py-2 text-sm text-stone-500">{colors.length ? 'No colors match your search.' : 'No colors available yet.'}</p>}
        {!colorQuery && colors.length > 8 && <button type="button" aria-expanded={showAllColors} onClick={() => setShowAllColors(previous => !previous)} className={`mt-2 min-h-11 rounded-lg text-xs font-bold text-[#681f3b] ${focusStyle}`}>{showAllColors ? 'Show fewer colors' : `View all ${colors.length} colors`}</button>}
      </FilterSection>
      <FilterSection title="Discount" count={filters.minDiscount > 0 ? 1 : 0}>
        <div className="space-y-1">
          {[0, 10, 20, 30, 40, 50].map(discount => <label key={discount} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-stone-50">
            <input type="radio" name={`${id}-discount`} checked={(filters.minDiscount || 0) === discount} onChange={() => setFilters(previous => ({ ...previous, minDiscount: discount }))} className={`h-4 w-4 accent-[#681f3b] ${focusStyle}`} />
            {discount ? `${discount}% or more` : 'All discounts'}
          </label>)}
        </div>
      </FilterSection>
    </div>
  );
};
export default ProductFilter;
