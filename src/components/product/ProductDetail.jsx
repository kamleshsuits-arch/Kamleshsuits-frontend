// src/components/ProductDetail.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineShoppingBag, 
  HiOutlineHeart, 
  HiHeart,
  HiStar, 
  HiArrowLeft, 
  HiOutlineShare,
  HiChevronLeft,
  HiChevronRight,
  HiX
} from "react-icons/hi";
import { useCart } from "../../hooks/useCart.jsx";
import YouMayAlsoLike from "../home/YouMayAlsoLike";
import { gsap } from "gsap";
import { useCallback } from "react";
import { formatPrice } from "../../utils/currency";
import { getColorDisplay } from "../../utils/colors";

export default function ProductDetail({ product, onBack, allProducts = [], onProductSelect }) {
  console.log("Rendering ProductDetail", { product });
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, isInCart, removeFromCart } = useCart();
  const [isLiked, setIsLiked] = useState(isInWishlist(product.suitId));
  const heartRefs = useRef([]);
  
  const [selectedImage, setSelectedImage] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Initialize selected image
  useEffect(() => {
    if (product?.images?.length > 0) {
      setSelectedImage(product.images[0]);
    } else if (product?.image) {
      setSelectedImage(product.image);
    }
  }, [product]);

  const availableColors = Array.isArray(product.colors)
    ? product.colors
    : (product.colors ? product.colors.toString().split(",").map(c => c.trim()).filter(Boolean) : [product.color || "Multi"]);

  const [selectedColor, setSelectedColor] = useState(availableColors[0]);

  // Normalize rating
  const rawRating = parseFloat(product.rating) || 4.1;
  const rating = (rawRating > 5 ? rawRating / 2 : rawRating).toFixed(1);
  const discount = Math.round(product.discount || 0);

  const handleRelatedClick = (selectedProduct) => {
    if (onProductSelect) {
      onProductSelect(selectedProduct);
      return;
    }
    if (selectedProduct && selectedProduct.suitId) {
      navigate(`/product/${selectedProduct.suitId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
    setIsLiked(!isLiked);
    
    // Animation
    if (!isLiked) {
      heartRefs.current.forEach(el => {
        if (el) {
          gsap.fromTo(el, 
            { scale: 0.5, opacity: 0 },
            { scale: 1.5, opacity: 1, duration: 0.3, yoyo: true, repeat: 1 }
          );
        }
      });
    }
  };

  // Gallery Logic
  const getGalleryItems = () => {
    const items = [];
    const images = product.images || [];
    const colors = product.colors || [];

    // Try to match images with colors if possible, otherwise just fill
    for (let i = 0; i < 3; i++) {
      if (images[i]) {
        items.push({ type: 'image', src: images[i], id: i });
      } else if (colors[i]) {
        // If no image but we have a color, use a placeholder
        items.push({ type: 'color', color: colors[i], id: i, src: null }); 
      } else {
        // Fallback to main image or placeholder
        items.push({ type: 'image', src: product.image || product.images?.[0], id: i });
      }
    }
    return items;
  };

  const galleryItems = getGalleryItems();

  // Lightbox Handlers
  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryItems.length);
  }, [galleryItems.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  }, [galleryItems.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, nextImage, prevImage]);

  return (
    <div className="bg-background min-h-screen font-sans text-secondary pb-20">
      {/* --- Top Navigation --- */}
      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => {
              if (typeof onBack === "function") return onBack();
              navigate(-1);
            }} 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors"
          >
            <HiArrowLeft className="text-lg" /> Back
          </button>
          
          <button className="text-secondary hover:text-primary transition">
             <HiOutlineShare className="text-xl" />
          </button>
        </div>
      </div>

      {/* --- Main Layout --- */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
        
        {/* LEFT: Image Gallery */}
        <div className="flex flex-col gap-6">
          {/* Main View Container */}
          <div 
            className="relative overflow-hidden bg-muted cursor-zoom-in aspect-[3/4] rounded-2xl shadow-sm group max-h-[700px]"
            onClick={() => openLightbox(galleryItems.findIndex(i => i.src === selectedImage))}
            onDoubleClick={handleWishlistToggle}
          >
            <img
              src={selectedImage || product.image || product.images?.[0]}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Heart Animation Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <HiHeart ref={el => heartRefs.current[0] = el} className="text-red-500 opacity-0" size={100} />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                 <div className="bg-white/90 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                   <HiOutlineShoppingBag className="text-primary text-xl" />
                 </div>
            </div>
          </div>

          {/* Thumbnails Grid (3 Boxes) */}
          <div className="grid grid-cols-3 gap-4">
            {galleryItems.slice(0, 3).map((item, index) => {
              const isLast = index === 2 && galleryItems.length > 3;
              return (
                <div 
                  key={index}
                  onClick={() => {
                    if (isLast) {
                      openLightbox(2);
                    } else if (item.src) {
                      setSelectedImage(item.src);
                    }
                  }}
                  className={`relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                    (selectedImage === item.src && !isLast) ? 'border-primary ring-1 ring-primary/20' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={item.src} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-primary/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                      <span className="text-xl font-bold">+{galleryItems.length - 3}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">View All</span>
                    </div>
                  )}
                  {selectedImage === item.src && !isLast && (
                    <div className="absolute inset-0 bg-primary/5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="relative">
          <div className="sticky top-32 space-y-8">
            
            {/* Header */}
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-primary leading-tight">
                {product.title}
              </h2>
              <p className="text-sm text-accent mt-2 uppercase tracking-widest font-bold">
                {product.brand || "Kamlesh Collection"}
              </p>
              
              {/* Rating */}
              {rating && (
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <HiStar key={i} className={i < Math.round(rating) ? "fill-current" : "text-stone-200"} />
                    ))}
                  </div>
                  <span className="text-xs text-secondary">({product.reviews || 26} reviews)</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="border-t border-b border-stone-200 py-6">
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-serif text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <span className="text-lg text-stone-400 line-through font-light">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-sm font-bold text-highlight uppercase tracking-wide">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-2">Inclusive of all taxes</p>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
                Color: <span className="font-normal capitalize text-secondary">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                      selectedColor === color
                        ? "border-primary ring-1 ring-primary ring-offset-2"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                    title={color}
                  >
                    <div 
                      className="w-8 h-8 rounded-full border border-stone-100"
                      style={{ backgroundColor: getColorDisplay(color) }}
                    ></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  if (isInCart(product.suitId)) {
                    removeFromCart(product.suitId);
                  } else {
                    addToCart(product);
                  }
                }}
                className={`w-full py-4 px-6 text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                  isInCart(product.suitId)
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-primary text-white hover:bg-accent hover:bg-blue-300"
                }`}
              >
                <HiOutlineShoppingBag size={20} />
                {isInCart(product.suitId) ? "Remove from Cart" : "Add to Cart"}
              </button>
              
              <button 
                onClick={handleWishlistToggle}
                className={`w-full border py-4 px-6 text-sm font-bold uppercase tracking-widest hover:bg-red-400 transition-all duration-300 flex items-center justify-center gap-3 ${
                  isInWishlist(product.suitId)
                    ? "border-red-500 text-red-500 hover:bg-red-50"
                    : "border-stone-300 text-primary hover:border-primary"
                }`}
              >
                {isInWishlist(product.suitId) ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
                {isInWishlist(product.suitId) ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Details Accordion-ish */}
            <div className="space-y-6 pt-6">
              <div>
                <h3 className="font-serif text-lg text-primary mb-3">Description</h3>
                <p className="text-secondary text-sm leading-relaxed font-light">
                  {product.description || product.summary || "Elegant design crafted for comfort and style. Perfect for casual outings and festive occasions. Made with premium materials to ensure durability and a luxurious feel."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm border-t border-stone-100 pt-6">
                <div>
                  <span className="block text-stone-600 text-xs uppercase tracking-widest mb-1">Material</span>
                  <span className="font-medium text-primary">{product.material || "Silk Blend"}</span>
                </div>
                <div>
                  <span className="block text-stone-600 text-xs uppercase tracking-widest mb-1">Type</span>
                  <span className="font-medium text-primary">{product.type || "Suit Set"}</span>
                </div>
                <div>
                  <span className="block text-stone-600 text-xs uppercase tracking-widest mb-1">Pattern</span>
                  <span className="font-medium text-primary">Self Design</span>
                </div>
                <div>
                  <span className="block text-stone-600 text-xs uppercase tracking-widest mb-1">Occasion</span>
                  <span className="font-medium text-primary">{product.session || "Festive"}</span>
                </div>
              </div>
            </div>

            {/* Offers */}
            <div className="bg-muted/50 p-6 border border-stone-100">
              <h4 className="font-serif text-primary mb-3">Available Offers</h4>
              <ul className="text-xs text-secondary space-y-2 list-disc pl-4 font-light">
                 <li>5% Instant Discount on HDFC Credit Cards.</li>
                 <li>Free shipping on orders above {formatPrice(4999)}.</li>
                 <li>Easy 5 days return and exchange.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* --- Related products --- */}
      <div className="mt-20 border-t border-stone-200 pt-16">
        <YouMayAlsoLike
          currentProduct={product}
          allProducts={allProducts}
          onProductSelect={handleRelatedClick}
          maxResults={4}
        />
      </div>

      {/* --- Lightbox Gallery Popup --- */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
          {/* Controls */}
          <button 
            onClick={closeLightbox}
            className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors z-20 p-2"
          >
            <HiX size={32} />
          </button>
          
          <div className="absolute top-8 left-8 text-white/50 text-xs font-black tracking-widest uppercase">
            {currentImageIndex + 1} / {galleryItems.length}
          </div>

          {/* Main Display */}
          <div className="relative w-full h-full flex items-center justify-center px-4 md:px-20">
            <button 
              onClick={prevImage}
              className="absolute left-4 md:left-10 text-white/30 hover:text-white transition-all transform hover:scale-110 z-10"
            >
              <HiChevronLeft size={48} />
            </button>

            <img 
              src={galleryItems[currentImageIndex].src} 
              alt="" 
              className="max-w-full max-h-[85vh] object-contain shadow-2xl"
            />

            <button 
              onClick={nextImage}
              className="absolute right-4 md:right-10 text-white/30 hover:text-white transition-all transform hover:scale-110 z-10"
            >
              <HiChevronRight size={48} />
            </button>
          </div>

          {/* Bottom Thumbnails */}
          <div className="absolute bottom-10 flex gap-2 md:gap-4 px-4 overflow-x-auto max-w-full scrollbar-hide py-4">
            {galleryItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-12 h-16 md:w-20 md:h-28 shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === idx ? 'border-primary ring-4 ring-primary/20 scale-110 shadow-lg' : 'border-white/10 opacity-40 hover:opacity-100'
                }`}
              >
                <img src={item.src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}