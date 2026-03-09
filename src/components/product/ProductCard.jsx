// src/components/ProductCard.jsx
import React, { useState, useRef } from "react";
import { HiOutlineHeart, HiHeart, HiStar, HiShoppingBag, HiCheck } from "react-icons/hi";
import { useCart } from "../../hooks/useCart.jsx";
import { gsap } from "gsap";
import { formatPrice } from "../../utils/currency";

export default function ProductCard({ product, onView }) {
  const { toggleWishlist, isInWishlist, addToCart, isInCart, removeFromCart } = useCart();
  const [isLiked, setIsLiked] = useState(isInWishlist(product.suitId));
  const heartRef = useRef(null);

  // Robust image parsing
  const getSafeImageUrl = (images, fallback) => {
    if (Array.isArray(images) && images.length > 0) return images[0];
    if (typeof images === 'string' && images.length > 0) {
      return images.replace(/[\[\]"]/g, '').split(',')[0] || fallback;
    }
    return fallback;
  };

  const mainImage = getSafeImageUrl(product.images || product.image, "https://via.placeholder.com/300x400");
  const discount = Math.round(product.discount || (product.mrp && product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0));
  const rawRating = parseFloat(product.rating) || 4.1;
  const rating = (rawRating > 5 ? rawRating / 2 : rawRating).toFixed(1);

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
    setIsLiked(!isLiked);
    if (!isLiked) {
      gsap.fromTo(heartRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1.5, opacity: 1, duration: 0.3, yoyo: true, repeat: 1 }
      );
    }
  };

  const handleDoubleClick = (e) => { e.stopPropagation(); handleWishlistToggle(e); };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isInCart(product.suitId)) { removeFromCart(product.suitId); }
    else { addToCart(product); }
  };

  const inCart = isInCart(product.suitId);
  const inWishlist = isInWishlist(product.suitId);

  return (
    <div
      className="group relative bg-white cursor-pointer rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-400"
      onClick={() => onView(product)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={mainImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Heart animation overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <HiHeart ref={heartRef} className="text-red-500 opacity-0" size={80} />
        </div>

        {/* Discount badge — top left, always visible on mobile */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md">
            {discount}% OFF
          </div>
        )}

        {/* Wishlist button — always visible on mobile, hover on desktop */}
        <button
          onClick={handleWishlistToggle}
          title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-300 z-20 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 ${
            inWishlist
              ? "bg-red-50 text-red-500"
              : "bg-white/90 backdrop-blur-sm text-stone-400 hover:text-red-500"
          }`}
        >
          {inWishlist ? <HiHeart size={18} /> : <HiOutlineHeart size={18} />}
        </button>

        {/* Rating chip */}
        {rating && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 flex items-center gap-1 text-[10px] text-primary shadow-sm rounded-md">
            <span className="font-bold">{rating}</span>
            <HiStar className="text-yellow-400" size={11} />
            <span className="text-secondary font-light border-l border-stone-300 pl-1 ml-0.5">({product.reviews || 26})</span>
          </div>
        )}

        {/* ADD / IN BAG button — slide up on desktop hover, always visible on mobile */}
        <div className="absolute inset-x-0 bottom-0 z-10 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
              inCart
                ? "bg-amber-50 text-amber-700 border-t border-amber-200"
                : "bg-gradient-to-r from-accent to-highlight text-white"
            }`}
          >
            {inCart ? (
              <><HiCheck size={14} /> In Bag</>
            ) : (
              <><HiShoppingBag size={14} /> Add to Bag</>
            )}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3 bg-white">
        <h3 className="text-sm sm:text-base font-serif text-primary line-clamp-2 leading-tight overflow-hidden h-[2.5rem] mb-1">
          {product.title.replace(/suit/gi, '').trim()}
        </h3>


        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-primary">
            {formatPrice(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-[10px] text-stone-400 line-through">
                {formatPrice(product.mrp)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">
                {discount}% off
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}