import React, { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Premium card chips
const CATEGORIES = [
  { label: 'All Collection',  emoji: '🛍️', value: '', color: 'from-amber-100 to-amber-50' },
  { label: 'Royal Wedding',   emoji: '💍', value: 'Wedding', color: 'from-purple-100 to-purple-50' },
  { label: 'Party Glam',      emoji: '🎉', value: 'Party Wear', color: 'from-blue-100 to-blue-50' },
  { label: 'Festive Vibes',   emoji: '🪔', value: 'Festive', color: 'from-amber-100 to-amber-50' },
  { label: 'Daily Office',    emoji: '☀️', value: 'Daily Wear', color: 'from-emerald-100 to-emerald-50' },
  { label: 'Hot Sale',        emoji: '🏷️', value: 'Sale', href: '/sale', color: 'from-red-100 to-red-50' },
  { label: 'Just In',         emoji: '✨', value: 'New', href: '/new-arrivals', color: 'from-cyan-100 to-cyan-50' },
];

const MobileCategoryBar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

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
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value && !cat.href;
          return (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(cat)}
              className={`flex-shrink-0 relative group transition-all duration-300 w-[68px] h-[60px] rounded-2xl overflow-hidden ${
                isActive ? 'glass-chip-active scale-105 z-10' : 'glass-chip'
              }`}
            >
              {/* Background gradient for inactive chips */}
              {!isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-40 group-hover:opacity-70 transition-opacity`} />
              )}
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-1.5">
                <span className={`text-xl mb-0.5 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110'}`}>
                  {cat.emoji}
                </span>
                <span className={`text-[8px] font-black uppercase text-center leading-[1.1] tracking-tighter w-full truncate ${
                  isActive ? 'text-white' : 'text-stone-800'
                }`}>
                  {cat.label.split(' ')[0]}<br/>{cat.label.split(' ')[1] || ''}
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
