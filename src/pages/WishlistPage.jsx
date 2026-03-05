import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.jsx';
import ProductCard from '../components/product/ProductCard';
import { HiOutlineHeart } from 'react-icons/hi';
import { fetchProducts } from '../api/products';
import YouMayAlsoLike from '../components/home/YouMayAlsoLike';

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
    <div className="min-h-screen bg-background px-4 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-secondary mb-4 sm:mb-8">
          <Link to="/" className="hover:text-primary transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-primary font-medium">Wishlist</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-stone-200">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-serif text-primary">My Wishlist</h1>
            <p className="text-secondary/60 text-sm font-medium tracking-[0.2em] uppercase">
              Curated Selection • {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
            </p>
          </div>
          
          <Link 
            to="/" 
            className="text-xs font-black uppercase tracking-[0.3em] text-accent hover:text-primary transition-all border-b-2 border-accent/20 hover:border-primary pb-1 self-start md:self-auto"
          >
            Continue Shopping
          </Link>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-stone-100 rounded-sm shadow-sm">
            <div className="bg-muted p-6 rounded-full mb-6">
              <HiOutlineHeart className="text-4xl text-stone-400" />
            </div>
            <h2 className="text-2xl font-serif text-primary mb-2">Your wishlist is empty</h2>
            <p className="text-secondary text-lg font-light mb-8">
              Save items you love to buy later.
            </p>
            <Link 
              to="/" 
              className="py-3 px-8 bg-primary text-white text-sm uppercase tracking-widest hover:bg-accent transition duration-300 shadow-lg hover:shadow-xl"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
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
      <div className="border-t border-stone-100 pt-16">
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
