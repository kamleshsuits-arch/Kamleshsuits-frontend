import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../api/products';
import ProductCard from '../components/product/ProductCard';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/common/Loader';
import { HiSparkles } from 'react-icons/hi';
import SEO from '../components/common/SEO';

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchProducts();
        // Sort by created_at desc
        const sorted = (data || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setProducts(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  if (loading) return <Loader message="Curating New Arrivals..." />;

  return (
    <div className="min-h-screen bg-white pb-28 overflow-x-hidden">
      <SEO 
        title="New Arrivals"
        description={`Explore the latest ${new Date().getFullYear()} collection of Indian style suits at Kamlesh Suits. Exquisitely crafted ethnic wear, fresh designs, and premium fabrics.`}
        keywords="new arrivals, latest suits, trendy ethnic wear, fresh collection 2026, designer suits gurugram"
        url="/new-arrivals"
        schemaData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `New Arrivals - Season ${new Date().getFullYear()}`,
          "description": "Discover our latest and most exclusive ethnic wear additions.",
          "url": "https://kamleshsuits.com/new-arrivals"
        }}
      />
      {/* Premium Header - Vibrant Sunset Theme */}
      <div 
        className="relative pt-12 pb-24 px-6 text-center text-primary overflow-hidden"
        style={{ background: 'linear-gradient(-225deg, #FFE29F 0%, #FFA99F 48%, #FF719A 100%)' }}
      >
        {/* Animated Light Layers */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#D4A373]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#E29578]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-white/40 rounded-full blur-[100px]" />
        
        {/* Animated Three-Layer Waves with Fluid Flow */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] h-[50px]">
          <div className="absolute inset-0 z-10">
            <svg className="w-[200%] h-full animate-[wave_20s_linear_infinite] opacity-40" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,110 450,10 600,60 C750,110 1050,10 1200,60 L1200,120 L0,120 Z" fill="#F3EFE0" />
            </svg>
          </div>
          <div className="absolute inset-0 z-20">
            <svg className="w-[200%] h-full animate-[wave_15s_linear_infinite] opacity-60" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,110 450,10 600,60 C750,110 1050,10 1200,60 L1200,120 L0,120 Z" fill="#EAE3D2" />
            </svg>
          </div>
          <div className="absolute inset-0 z-30">
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
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
             <div className="p-3 bg-white shadow-xl rounded-full">
                <HiSparkles className="text-[#D4A373] animate-pulse" size={32} />
             </div>
          </div>
          <h2 className="text-4xl font-serif text-primary tracking-tight uppercase tracking-[0.3em] mb-4">
            The New Edit
          </h2>
          <div className="inline-block px-4 py-1.5 bg-white border border-[#D4A373]/20 rounded-full shadow-sm">
            <p className="text-[#90462c] text-[9px] font-black uppercase tracking-[0.4em]">
              Exquisitely Crafted • Season {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Quick Switcher - Moved below header */}
      <div className="sticky top-[80px] z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-stone-100 flex md:hidden">
        <button 
          className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b-2 border-primary"
        >
          New Arrivals
        </button>
        <div className="w-px h-8 bg-stone-100 my-auto" />
        <button 
          onClick={() => navigate('/sale')}
          className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400"
        >
          Flash Sale
        </button>
      </div>


      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 20).map((product) => (
            <ProductCard 
              key={product.suitId} 
              product={product} 
              onView={(p) => navigate(`/product/${p.suitId}`)} 
            />
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-secondary font-light">Fresh collection coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewArrivals;
