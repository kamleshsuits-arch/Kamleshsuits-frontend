import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProductTaxonomy } from '../../hooks/useProductTaxonomy';
import blanketIcon from '../../assets/category-icons/blanket.webp';
import dupattaIcon from '../../assets/category-icons/dupatta.webp';
import kurtaPajamaIcon from '../../assets/category-icons/kurta-pajama.webp';
import parnaIcon from '../../assets/category-icons/parna.webp';
import pillowsIcon from '../../assets/category-icons/pillows.webp';
import suitInnerIcon from '../../assets/category-icons/suit-inner.webp';

const CATEGORY_VISUALS = {
  suits: { emoji: '👗' },
  'bed-khat-sheets': { emoji: '🛏️' },
  blankets: { image: blanketIcon },
  pillows: { image: pillowsIcon },
  dupatta: { image: dupattaIcon },
  'suit-inners': { image: suitInnerIcon },
  'kurta-pajama-men': { image: kurtaPajamaIcon },
  parna: { image: parnaIcon },
  'mens-unstitched': { emoji: '🧵' },
};

const MobileCategoryBar = () => {
  const { taxonomy } = useProductTaxonomy();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const categories = [
    { label: 'All Products', emoji: '🛍️', value: '', color: 'from-amber-100 to-amber-50' },
    ...taxonomy.map((category, index) => ({
      label: category.label,
      ...(CATEGORY_VISUALS[category.id] || { emoji: '📦' }),
      value: category.id,
      color: index % 2 ? 'from-amber-100 to-amber-50' : 'from-stone-100 to-white'
    })),
    { label: 'Hot Sale', emoji: '🏷️', value: 'Sale', href: '/sale', color: 'from-red-100 to-red-50' },
    { label: 'Just In', emoji: '✨', value: 'New', href: '/new-arrivals', color: 'from-cyan-100 to-cyan-50' },
  ];

  const handleCategoryClick = (cat) => {
    if (cat.href) { navigate(cat.href); return; }
    navigate(cat.value === '' ? '/' : `/?category=${encodeURIComponent(cat.value)}`);
    setTimeout(() => {
      document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div 
      className="md:hidden sticky top-14 z-40 bg-white border-b border-stone-100 h-[84px] overflow-hidden"
      id="mobile-category-bar"
    >
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3 items-center">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value && !cat.href;
          return (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(cat)}
              className={`flex-shrink-0 relative group transition-all duration-300 w-[78px] h-[60px] rounded-2xl overflow-hidden ${
                isActive ? 'glass-chip-active scale-105 z-10' : 'glass-chip'
              }`}
            >
              {/* Background gradient for inactive chips */}
              {!isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-40 group-hover:opacity-70 transition-opacity`} />
              )}
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-1.5">
                <span className={`mb-0.5 flex h-7 w-8 items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110'}`}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt=""
                      aria-hidden="true"
                      className="h-7 w-8 object-contain drop-shadow-sm"
                      loading="eager"
                    />
                  ) : (
                    <span aria-hidden="true" className="text-xl leading-none">{cat.emoji}</span>
                  )}
                </span>
                <span className={`line-clamp-2 w-full text-center text-[8px] font-black uppercase leading-[1.1] tracking-tighter ${
                  isActive ? 'text-white' : 'text-stone-800'
                }`}>
                  {cat.label}
                </span>
              </div>
              
              {/* Active accent dot */}
              {isActive && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileCategoryBar;
