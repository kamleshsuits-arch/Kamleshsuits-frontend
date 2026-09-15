import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../api/products';
import ProductCard from '../components/product/ProductCard';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPublicCoupons } from '../api/coupons';
import { getProductCategoryLabel } from '../utils/productTaxonomy';
import Loader from '../components/common/Loader';
import { HiSparkles } from 'react-icons/hi';
import SEO from '../components/common/SEO';
import LocationBar from '../components/common/LocationBar';
import PremiumHeroMotion from '../components/common/PremiumHeroMotion';

const NewArrivals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [couponError, setCouponError] = useState(false);
  const [checkedVoucherCode, setCheckedVoucherCode] = useState('');
  const [searchParams] = useSearchParams();
  const voucherCode = searchParams.get('voucher') || '';
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

  useEffect(() => {
    let cancelled = false;
    if (voucherCode) fetchPublicCoupons().then(data => {
      if (!cancelled) { setCoupons(data || []); setCouponError(false); setCheckedVoucherCode(voucherCode); }
    }).catch(() => { if (!cancelled) { setCouponError(true); setCheckedVoucherCode(voucherCode); } });
    return () => { cancelled = true; };
  }, [voucherCode]);

  const voucher = coupons.find(item => item.code === voucherCode
    && (!item.expires_at || Date.parse(item.expires_at) > Date.now())
    && (!item.usage_limit || Number(item.used_count) < Number(item.usage_limit)));
  // Use the current voucher's eligibility, not editable URL parameters.
  const categoryIds = voucher ? (voucher.category_ids || []) : searchParams.getAll('category');
  const visibleProducts = products.filter(product => !categoryIds.length
    || categoryIds.includes(product.product_category || 'suits'));
  const scope = categoryIds.length ? categoryIds.map(id => getProductCategoryLabel({ product_category: id })).join(', ') : 'All collections';

  if (loading) return <Loader message="Curating New Arrivals..." />;

  return (
    <div className="min-h-screen bg-white pb-28 overflow-x-hidden page-new">
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
          "url": `${window.location.origin}/new-arrivals`
        }}
      />
      {/* Premium Header - light carrot glass motion on mobile */}
      <div className="premium-page-hero relative pt-20 pb-20 px-3 sm:px-6 text-center text-primary overflow-hidden md:pt-12 md:pb-24">
        {/* Animated Light Layers */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-black/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        <PremiumHeroMotion variant="new" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
             <div className="p-3 bg-white shadow-xl rounded-full">
                <HiSparkles className="text-[#d85f32] animate-pulse" size={32} />
             </div>
          </div>
          <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl font-serif text-[#4a2017] md:text-white tracking-tight uppercase tracking-[0.14em] sm:tracking-[0.3em] mb-4 drop-shadow-sm">
            The New Edit
          </h2>
          <div className="inline-block px-4 py-1.5 bg-white/55 md:bg-white/20 border border-white/70 md:border-white/40 rounded-full shadow-sm backdrop-blur-md">
            <p className="text-[#5d2a20] md:text-white text-[9px] font-black uppercase tracking-[0.16em] sm:tracking-[0.4em]">
              Exquisitely Crafted • Season {new Date().getFullYear()}
            </p>
          </div>
         </div>
      </div>

      {/* Address/LocationBar after banner on Mobile */}
      <div className="md:hidden relative z-50 -mt-1">
        <LocationBar className="!border-none" />
      </div>



      <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-4 md:-mt-8 relative z-20">
        {(categoryIds.length > 0 || voucherCode) && <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-label="Notification collection">
          <h1 className="text-xl font-bold text-primary">{scope}</h1>
          {voucherCode && (voucher ? <div className="mt-2 text-sm text-stone-700">
            <p>Use <strong className="select-all">{voucher.code}</strong> at checkout for {voucher.discount_type === 'percent' ? `${voucher.discount}%` : `₹${Number(voucher.discount).toLocaleString('en-IN')}`} off eligible products.</p>
            {Number(voucher.min_purchase) > 0 && <p className="mt-1">Minimum eligible spend: ₹{Number(voucher.min_purchase).toLocaleString('en-IN')}.</p>}
            {voucher.expires_at && <p className="mt-1">Valid until {new Date(voucher.expires_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.</p>}
            <p className="mt-1">Availability and voucher limits are checked at checkout.</p>
          </div> : <p role="status" className="mt-2 text-sm">{checkedVoucherCode !== voucherCode ? 'Checking this voucher…' : couponError ? 'Unable to check this voucher. Please retry when online.' : 'This voucher is no longer available. Check current offers at checkout.'}</p>)}
          <Link to="/new-arrivals" className="mt-3 inline-block text-sm font-bold underline">View all collections</Link>
        </section>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 min-[380px]:gap-3 sm:gap-6">
          {visibleProducts.map((product) => (
            <ProductCard 
              key={product.suitId} 
              product={product} 
              onView={(p) => navigate(`/product/${p.suitId}`)} 
            />
          ))}
        </div>
        
        {visibleProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-secondary font-light">Fresh collection coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewArrivals;
