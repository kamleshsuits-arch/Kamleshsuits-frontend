import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiOutlineShare, HiOutlineShoppingBag, HiHeart, HiOutlineHeart, HiChevronLeft, HiChevronRight, HiX } from "react-icons/hi";
import gsap from 'gsap';
import YouMayAlsoLike from '../components/home/YouMayAlsoLike';
import { formatPrice } from '../utils/currency';
import { fetchProductById, fetchProducts } from '../api/products';
import { useCart } from '../hooks/useCart';
import { getColorDisplay } from '../utils/colors';
import Loader from '../components/common/Loader';
import SEO from '../components/common/SEO';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart, toggleWishlist, isInWishlist, isInCart, removeFromCart } = useCart();
  const containerRef = useRef();
  const lightboxRef = useRef();

  useEffect(() => {
    // Scroll to top on ID change to prevent blur/sticky header issues
    window.scrollTo(0, 0);

    const load = async () => {
      const data = await fetchProductById(id);
      setProduct(data);
      
      // Fetch all products for recommendations
      const all = await fetchProducts();
      setAllProducts(all);

      if (data?.images?.length > 0) {
        setSelectedImage(data.images[0]);
      } else if (data?.image) {
        setSelectedImage(data.image);
      }

      // Set initial color
      if (data?.colors?.length > 0) {
        setSelectedColor(data.colors[0]);
      } else if (data?.color) {
        setSelectedColor(data.color);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (product) {
      // Removed y: 20 to prevent potential sub-pixel blur during animation
      gsap.from(containerRef.current, { 
        opacity: 0, 
        duration: 0.5, 
        ease: "power2.out",
        onComplete: () => {
          if (containerRef.current) {
            gsap.set(containerRef.current, { clearProps: "all" });
          }
        }
      });
    }
  }, [product]);

  // Ensure we have a dynamic gallery logic even if product is null
  const getGalleryItems = () => {
    if (!product) return [];
    const items = [];
    const images = product.images || [];

    // Add main image if not in images array
    if (product.image && !images.includes(product.image)) {
      items.push({ type: 'image', src: product.image, id: 'main' });
    }

    // Add all gallery images
    images.forEach((img, idx) => {
      items.push({ type: 'image', src: img, id: `gallery-${idx}` });
    });

    return items;
  };

  const galleryItems = getGalleryItems();

  // Price Logic
  const mrp = product ? (product.mrp || Math.round(product.price * 1.25)) : 0; 
  const discount = product ? (product.discount || Math.round(((mrp - product.price) / mrp) * 100)) : 0;

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
    if (galleryItems.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % galleryItems.length);
  }, [galleryItems.length]);

  const prevImage = useCallback(() => {
    if (galleryItems.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  }, [galleryItems.length]);

  const handleRelatedClick = (selectedProduct) => {
    if (selectedProduct && selectedProduct.suitId) {
      navigate(`/product/${selectedProduct.suitId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Loader message="Retrieving Product Specification..." />
    </div>
  );


  return (
    <div className="bg-background min-h-screen font-sans text-secondary pb-20">
      <SEO 
        title={product.title}
        description={`Buy ${product.title} at Kamlesh Suits. ${product.fabric_family || ''} ${product.fabric_category || ''} suit for only ${formatPrice(product.price)}. Discover premium ethnic wear in Gurugram.`}
        image={product.image || product.images?.[0]}
        url={`/product/${id}`}
        type="product"
        schemaData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.title,
          "image": product.image || product.images?.[0],
          "description": product.description,
          "sku": product.suitId,
          "brand": {
            "@type": "Brand",
            "name": "Kamlesh Suits"
          },
          "offers": {
            "@type": "Offer",
            "url": `https://kamleshsuits.com/product/${id}`,
            "priceCurrency": "INR",
            "price": product.price,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
          }
        }}
      />
      {/* --- Top Navigation --- */}
      <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-sm border-b border-stone-100 px-4 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors"
          >
            <HiArrowLeft className="text-lg" /> Back
          </button>
          
          <button className="text-secondary hover:text-primary transition">
             <HiOutlineShare className="text-xl" />
          </button>
        </div>
      </div>

      {/* Main Content - transform-gpu to help with rendering crispness */}
      <div ref={containerRef} className="container mx-auto px-4 py-6 md:py-12 transform-gpu filter-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left Column: Gallery */}
          <div className="flex flex-col gap-6">
            {/* Main View Container */}
            <div 
              className="relative overflow-hidden bg-muted cursor-zoom-in aspect-[3/4] rounded-2xl shadow-sm group max-h-[700px] w-full mx-auto"
              onClick={() => openLightbox(galleryItems.findIndex(i => i.src === selectedImage))}
            >
              <img
                src={selectedImage || product.image || product.images?.[0]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
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

          {/* Right Column: Product Info */}
          <div className="flex flex-col h-full">
            <div className="sticky top-24">
              <p className="text-stone-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                {product.fabric_family || 'Standard'} • {product.fabric_category || 'General'}
              </p>
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-primary mb-2">{product.title}</h1>
              <p className="text-xs md:text-sm text-secondary uppercase tracking-widest mb-6">
                {Array.isArray(product.categories) ? product.categories.join(" • ") : (product.categories || 'Suit Collection')}
              </p>
              
              {/* Price Section */}
              <div className="flex items-baseline gap-4 mb-6 md:mb-8">
                <span className="text-2xl md:text-3xl font-light text-primary">{formatPrice(product.price)}</span>
                {mrp > product.price && (
                  <>
                    <span className="text-base md:text-lg text-stone-600 line-through font-light">{formatPrice(mrp)}</span>
                    <span className="text-xs md:text-sm font-bold text-highlight uppercase tracking-wide bg-highlight/10 px-2 py-1 rounded">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              
              <p className="text-sm md:text-base text-secondary leading-relaxed mb-6 md:mb-8">
                {product.description || 'Experience the epitome of elegance with this finely crafted piece. Designed for the modern individual who values style and comfort.'}
              </p>

              {/* Color Selection - Dynamic from Admin */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-stone-600">Select Variation</h3>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all p-0.5 ${
                          selectedColor === color ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-stone-200'
                        }`}
                        title={color}
                      >
                        <div 
                          className="w-full h-full rounded-full shadow-inner border border-stone-100" 
                          style={{ backgroundColor: getColorDisplay(color) }} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}


              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (isInCart(product.suitId)) {
                      removeFromCart(product.suitId);
                    } else {
                      addToCart(product);
                    }
                  }}
                  className={`w-full py-4 text-white text-lg font-medium tracking-wide hover:shadow-lg transition-all duration-300 rounded-sm flex items-center justify-center gap-2 ${
                    isInCart(product.suitId)
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-primary hover:bg-secondary"
                  }`}
                >
                  <HiOutlineShoppingBag className="text-xl" /> 
                  {isInCart(product.suitId) ? "Remove from Cart" : "Add to Cart"}
                </button>
                
                <button 
                  onClick={() => toggleWishlist(product)}
                  className={`w-full py-4 border text-lg font-medium tracking-wide transition-all duration-300 rounded-sm flex items-center justify-center gap-2 ${
                    isInWishlist(product.suitId) 
                      ? 'border-red-500 text-red-500 bg-red-50' 
                      : 'border-primary text-primary hover:bg-muted'
                  }`}
                >
                  {isInWishlist(product.suitId) ? <HiHeart className="text-xl" /> : <HiOutlineHeart className="text-xl" />}
                  {isInWishlist(product.suitId) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-12 border-t border-gray-200 pt-8 space-y-4 text-sm text-secondary">
                <div className="flex justify-between">
                  <span>Free Shipping</span>
                  <span>On orders over {formatPrice(5000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Returns</span>
                  <span>30 Days Policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Related products --- */}
      <div className="mt-20 border-t border-stone-200 pt-16 max-w-7xl mx-auto px-4 lg:px-8">
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
};

export default ProductDetails;