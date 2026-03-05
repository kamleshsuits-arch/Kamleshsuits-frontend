// src/components/ProductCard.jsx
import React, { useState, useRef } from "react";
import { HiOutlineHeart, HiHeart, HiStar } from "react-icons/hi";
import { useCart } from "../../hooks/useCart.jsx";
import { gsap } from "gsap";
import { formatPrice } from "../../utils/currency";

export default function ProductCard({ product, onView }) {
  const { toggleWishlist, isInWishlist, addToCart, isInCart, removeFromCart } = useCart();
  const [isLiked, setIsLiked] = useState(isInWishlist(product.suitId));
  const heartRef = useRef(null);

  // Robust image parsing to handle Arrays, JSON strings, or plain strings
  const getSafeImageUrl = (images, fallback) => {
    if (Array.isArray(images) && images.length > 0) return images[0];
    if (typeof images === 'string' && images.length > 0) {
      // Handle potential JSON string format like ["url"] or plain url1,url2
      return images.replace(/[\[\]"]/g, '').split(',')[0] || fallback;
    }
    return fallback;
  };

  const mainImage = getSafeImageUrl(product.images || product.image, "https://via.placeholder.com/300x400");

  const discount = Math.round(product.discount || 0);

  // Normalize rating to 5
  const rawRating = parseFloat(product.rating) || 4.1;
  const rating = (rawRating > 5 ? rawRating / 2 : rawRating).toFixed(1);

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
    setIsLiked(!isLiked);
    
    // Animation
    if (!isLiked) {
      gsap.fromTo(heartRef.current, 
        { scale: 0.5, opacity: 0 },
        { scale: 1.5, opacity: 1, duration: 0.3, yoyo: true, repeat: 1 }
      );
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    handleWishlistToggle(e);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isInCart(product.suitId)) {
      removeFromCart(product.suitId);
    } else {
      addToCart(product);
    }
  };

  return (
    <div 
      className="group relative bg-white cursor-pointer transition-all duration-500 hover:shadow-xl rounded-2xl overflow-hidden border border-stone-100"
      onClick={() => onView(product)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted rounded-t-2xl">
        <img
          src={mainImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Heart Animation Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <HiHeart ref={heartRef} className="text-red-500 opacity-0" size={80} />
        </div>

        {/* Rating Chip - Minimalist */}
        {rating && (
           <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1 text-xs text-primary shadow-sm">
             <span className="font-bold">{rating}</span>
             <HiStar className="text-yellow-400" size={12} />
             <span className="text-secondary font-light border-l border-stone-300 pl-1 ml-1">({product.reviews || 26})</span>
           </div>
        )}

        {/* Wishlist Button - Floating on top right */}
        <button 
          onClick={handleWishlistToggle}
          title={isInWishlist(product.suitId) ? "Remove from Wishlist" : "Add to Wishlist"}
          className={`absolute top-3 right-3 p-2 rounded-full transition duration-300 z-20 ${
            isInWishlist(product.suitId) 
              ? "bg-white text-red-500 shadow-md opacity-100" 
              : "bg-white/80 backdrop-blur-sm text-secondary hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          }`}
        >
            {isInWishlist(product.suitId) ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
        </button>

        {/* Add to Cart Overlay - Appears on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/95 border-t border-stone-100 z-10">
            <button 
              onClick={handleAddToCart}
              className={`w-full py-3 bg-white border text-xs font-bold uppercase tracking-widest transition rounded-xl ${
                isInCart(product.suitId) 
                ? "text-red-500 border-red-500 hover:bg-red-50 shadow-inner" 
                : "text-primary border-primary hover:bg-slate-600 hover:text-slate-300 shadow-sm"
              }`}
            >
               {isInCart(product.suitId) ? "Remove from Cart" : "Add to Cart"}
            </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 bg-white text-center relative z-20">
        {/* Product Title (Swapped with Brand) */}
        <h3 className="text-base sm:text-lg font-serif text-primary truncate px-2">
          {product.title}
        </h3>
        
        {/* Fabric Name (Swapped with Title/Description) */}
        <p className="text-[10px] sm:text-xs text-secondary uppercase tracking-[0.15em] truncate mt-1 mb-3 font-medium opacity-80">
          {product.material || product.type || "Premium Fabric"}
        </p>

        {/* Price Section */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-xs text-secondary line-through decoration-stone-400">
                {formatPrice(product.mrp)}
              </span>
              <span className="text-xs text-highlight font-medium">
                ({(product.discount || (product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0)).toString()}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}