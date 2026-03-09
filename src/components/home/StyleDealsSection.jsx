// StyleDealsSection.jsx — Fashion Deals inspired vibrant section (mobile-only)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiHeart, HiOutlineHeart, HiShoppingBag, HiChevronRight } from 'react-icons/hi';
import { fetchProducts } from '../../api/products';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/currency';

const PRICE_BANDS = [
  { label: 'Under ₹2K',  max: 2000 },
  { label: 'Under ₹5K',  max: 5000 },
  { label: 'Under ₹8K',  max: 8000 },
  { label: 'Under ₹12K', max: 12000 },
];

const StyleDealsSection = () => {
  const [products, setProducts] = useState([]);
  const [activeBand, setActiveBand] = useState(0);
  const { addToCart, isInCart, removeFromCart, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts().then(data => setProducts(data || [])).catch(() => {});
  }, []);

  const filtered = products
    .filter(p => p.price <= PRICE_BANDS[activeBand].max)
    .slice(0, 10);

  const getSafeImage = (p) => {
    const imgs = p.images || p.image;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
    if (typeof imgs === 'string' && imgs.length > 0) return imgs.replace(/[\[\]"]/g, '').split(',')[0];
    return 'https://via.placeholder.com/300x400';
  };

  if (products.length === 0) return null;

  return (
    <div className="md:hidden bg-rose-50/30 mt-1 pb-4">
      {/* Section Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl text-stone-900 leading-tight">
              Style <span className="text-rose-500 italic">Collection</span>
            </h2>
            <span className="text-xl">🛍️</span>
          </div>
          <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">Curated suits, every budget</p>
        </div>
        {/* "Everything Under" badge */}
        <div className="bg-rose-500 text-white rounded-xl px-2.5 py-1.5 text-right shadow-md">
          <p className="text-[8px] uppercase tracking-widest font-bold opacity-80">UPTO</p>
          <p className="text-sm font-black leading-none">{PRICE_BANDS[activeBand].label}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
        {PRICE_BANDS.map((band, idx) => {
          const count = products.filter(p => p.price <= band.max).length;
          return (
            <button
              key={band.label}
              onClick={() => setActiveBand(idx)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black border-2 transition-all duration-200 ${
                activeBand === idx
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                  : 'bg-white text-stone-700 border-stone-200'
              }`}
            >
              {band.label}
              <span className={`ml-1.5 text-[9px] ${activeBand === idx ? 'text-rose-100' : 'text-stone-400'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Horizontal product scroll */}
      {filtered.length === 0 ? (
        <div className="px-4 py-6 text-center text-stone-400 text-sm">
          No suits in this range yet — check back soon! 🛍️
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
          {filtered.map((product) => {
            const img = getSafeImage(product);
            const discount = Math.round(
              product.discount || (product.mrp && product.mrp > product.price
                ? ((product.mrp - product.price) / product.mrp) * 100 : 0)
            );
            const inCart = isInCart(product.suitId);
            const liked = isInWishlist(product.suitId);

            return (
              <div
                key={product.suitId}
                className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100"
              >
                {/* Image */}
                <div
                  className="relative w-full h-44 bg-stone-100 cursor-pointer"
                  onClick={() => { navigate(`/product/${product.suitId}`); window.scrollTo(0,0); }}
                >
                  <img src={img} alt={product.title} className="w-full h-full object-cover" />
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {discount}% OFF
                    </div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); toggleWishlist(product); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow"
                  >
                    {liked
                      ? <HiHeart size={14} className="text-red-500" />
                      : <HiOutlineHeart size={14} className="text-stone-400" />
                    }
                  </button>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-serif text-stone-800 line-clamp-2 leading-tight h-[2rem] overflow-hidden">
                    {product.title.replace(/suit/gi, '').trim()}
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-xs font-black text-stone-900">{formatPrice(product.price)}</span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-[9px] text-stone-400 line-through">{formatPrice(product.mrp)}</span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); inCart ? removeFromCart(product.suitId) : addToCart(product); }}
                    className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1 transition-all ${
                      inCart
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'text-white shadow-sm'
                    }`}
                    style={!inCart ? { background: 'linear-gradient(90deg, #fa709a, #f9d423)' } : {}}
                  >
                    <HiShoppingBag size={11} />
                    {inCart ? 'In Bag' : 'Add'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* See All card */}
          <div
            className="flex-shrink-0 w-28 bg-rose-100/50 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-rose-200 shadow-inner"
            onClick={() => {
              navigate('/');
              setTimeout(() => document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
              <HiChevronRight size={20} className="text-rose-600" />
            </div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-wide text-center px-2">See All →</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleDealsSection;
