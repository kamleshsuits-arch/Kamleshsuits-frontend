import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../api/products';
import ProductCard from '../components/product/ProductCard';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/common/Loader';
import { HiTag } from 'react-icons/hi';
import SEO from '../components/common/SEO';

const Sale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchProducts();
        // Filter products with discount > 0 and sort by discount desc
        const saleProducts = (data || [])
          .filter(p => (p.discount || 0) > 0)
          .sort((a, b) => (b.discount || 0) - (a.discount || 0));
        
        setProducts(saleProducts);
        if (saleProducts.length > 0) {
          setMaxDiscount(Math.round(saleProducts[0].discount));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  if (loading) return <Loader message="Scouring Best Deals..." />;

  return (
    <div className="min-h-screen bg-white pb-28 overflow-x-hidden page-sale">
      <SEO 
        title="Exclusive Sale"
        description={`Get up to ${maxDiscount}% off on premium Indian ladies suits and ethnic wear. Shop the clearance sale at Kamlesh Suits, Gurugram for the best deals on silk and festive wear.`}
        keywords="sale, ethnic wear clearance, discounted suits, silk suits sale, gurugram fashion deals"
        url="/sale"
        schemaData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `Ethnic Wear Sale - Up to ${maxDiscount}% Off`,
          "description": "Exclusive offers on ladies suits and ethnic collections.",
          "url": "https://kamleshsuits.com/sale"
        }}
      />
      {/* Premium Header - Orange Theme with Waves */}
      <div 
        className="relative pt-12 pb-24 px-6 text-center text-white overflow-hidden"
        style={{ backgroundColor: 'var(--theme-orange)' }}
      >
        {/* Layered Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] w-48 h-48 bg-black/10 rounded-full blur-2xl" />
        
        {/* Animated Fluid Waves */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] h-[50px]">
          <div className="absolute inset-0 z-10">
            <svg className="w-[200%] h-full animate-[wave_15s_linear_infinite] opacity-30" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,110 450,10 600,60 C750,110 1050,10 1200,60 L1200,120 L0,120 Z" fill="#780000" />
            </svg>
          </div>
          <div className="absolute inset-0 z-20">
            <svg className="w-[200%] h-full animate-[wave_10s_linear_infinite]" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,110 450,10 600,60 C750,110 1050,10 1200,60 L1200,120 L0,120 Z" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes wave {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-2 mb-6 border border-white/30 shadow-2xl">
             <HiTag className="text-white" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Season Finale Blitz</span>
          </div>
          
          <div className="mb-2 relative">
             <div className="absolute -top-6 -right-10 bg-yellow-400 text-primary text-[10px] font-black px-3 py-1.5 rounded-bl-xl shadow-lg animate-bounce">UP TO</div>
            <span className="text-7xl md:text-9xl font-black tracking-tighter inline-block text-shadow-xl drop-shadow-2xl">
              {maxDiscount}%
            </span>
            <span className="text-3xl md:text-4xl font-serif italic ml-2 opacity-90">OFF</span>
          </div>
          
          <h1 className="text-sm md:text-xl uppercase tracking-[0.5em] font-medium opacity-90 mt-6 pt-2 border-t border-white/10 w-fit mx-auto">
            Luxury Silk Clearance
          </h1>
        </div>
      </div>

      {/* Sticky Quick Switcher - Moved below banner */}
      <div className="sticky top-[80px] z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-stone-100 flex md:hidden">
        <button 
          onClick={() => navigate('/new-arrivals')}
          className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400"
        >
          New Arrivals
        </button>
        <div className="w-px h-8 bg-stone-100 my-auto" />
        <button 
          className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b-2 border-primary"
        >
          Flash Sale
        </button>
      </div>


      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <div key={product.suitId} className="relative group/sale">
              {/* Extra discount badge for sale page */}
              <div className="absolute -top-2 -right-2 z-[30] bg-highlight text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg transform rotate-12 group-hover/sale:rotate-0 transition-transform">
                -{product.discount}%
              </div>
              <ProductCard 
                product={product} 
                onView={(p) => navigate(`/product/${p.suitId}`)} 
              />
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl shadow-sm border border-stone-100 mx-4">
            <p className="text-secondary font-light">No active offers at this moment. Stay tuned!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sale;
