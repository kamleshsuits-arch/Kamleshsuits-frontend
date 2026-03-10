import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.jsx';
import ProductCard from '../components/product/ProductCard';
import { HiOutlineHeart } from 'react-icons/hi';
import { fetchProducts } from '../api/products';
import YouMayAlsoLike from '../components/home/YouMayAlsoLike';
import SEO from '../components/common/SEO';

const WishlistPage = () => {
  const { wishlistItems } = useCart();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchProducts();
      setAllProducts(data);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28 page-wishlist">
      <SEO title="Wishlist" url="/wishlist" />
      
      {/* Premium Header - Teal Theme */}
      <div 
        className="relative pt-12 pb-24 px-6 text-center text-white overflow-hidden animate-bg-pulse"
        style={{ backgroundColor: 'var(--theme-teal)' }}
      >
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
             <div className="p-3 bg-white/20 backdrop-blur-md shadow-xl rounded-full border border-white/30">
                <HiOutlineHeart className="text-white animate-pulse" size={32} />
             </div>
          </div>
          <h1 className="text-4xl font-serif text-white tracking-tight uppercase tracking-[0.3em] mb-4">
            My Wishlist
          </h1>
          <div className="inline-block px-4 py-1.5 bg-white/20 border border-white/40 rounded-full shadow-sm">
            <p className="text-white text-[9px] font-black uppercase tracking-[0.4em]">
              Curated Selection • {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-100 rounded-[2rem] shadow-xl">
            <div className="bg-stone-50 p-6 rounded-full mb-6 text-teal-600/30">
              <HiOutlineHeart className="text-4xl" />
            </div>
            <h2 className="text-2xl font-serif text-primary mb-2">Your wishlist is empty</h2>
            <p className="text-secondary text-sm font-light mb-8">
              Save items you love to buy later.
            </p>
            <Link 
              to="/" 
              className="py-3 px-8 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition duration-300 shadow-lg rounded-full"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistItems.map((product) => (
              <ProductCard
                key={product.suitId}
                product={product}
                onView={(p) => navigate(`/product/${p.suitId}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Trending Items --- */}
      <div className="mt-20 border-t border-stone-100 pt-16">
        <YouMayAlsoLike
          currentProduct={null}
          allProducts={allProducts}
          onProductSelect={(p) => navigate(`/product/${p.suitId}`)}
        />
      </div>
    </div>
  );
};

export default WishlistPage;
