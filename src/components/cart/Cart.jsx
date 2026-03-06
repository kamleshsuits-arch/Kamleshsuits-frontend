import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlineTrash, HiMinus, HiPlus, HiCreditCard, HiCash, HiArrowLeft, 
  HiShieldCheck, HiTag, HiCheck, HiLocationMarker, HiHome, HiOfficeBuilding,
  HiPlusCircle, HiPencilAlt
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';
import { fetchProducts, placeOrder, validateDelivery, submitDeliveryDemand } from '../../api/products';
import { validateCoupon, fetchPublicCoupons } from '../../api/coupons';
import { isLikelySupportedPin, SUPPORTED_REGIONS } from '../../utils/deliveryUtils';
import gsap from 'gsap';
import YouMayAlsoLike from '../home/YouMayAlsoLike';
import { HiX } from 'react-icons/hi';


const Cart = () => {
  const { 
    cartItems, removeFromCart, updateQuantity, subtotal,
    addresses, addAddress, removeAddress, updateAddress, clearCart
  } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null); // stores order details
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    pincode: '',
    houseNo: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    type: 'home' // home, office, other
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const summaryRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ isAllowed: true, deliveryFee: 0 });
  const [isValidatingDelivery, setIsValidatingDelivery] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [unsupportedPincode, setUnsupportedPincode] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  const gst = Math.round(subtotal * 0.05);

  // Calculate Shipping (Dynamic based on distance, default/fallback if subtotal > 5000)
  const shippingFee = (subtotal >= 5000) ? 0 : (deliveryDetails.deliveryFee || Math.round(subtotal * 0.03));

  // Total Payable
  let total = subtotal + gst + shippingFee;
  if (isCouponApplied && appliedCoupon) {
    if (appliedCoupon.discount_type === 'percent') {
        total -= (subtotal * (appliedCoupon.discount / 100));
    } else {
        total -= appliedCoupon.discount;
    }
  }

  // MRP Total for display (if available)
  const mrpTotal = cartItems.reduce((acc, item) => {
    const itemMrp = item.mrp ? item.mrp * (item.quantity || 1) : item.price * (item.quantity || 1);
    return acc + itemMrp;
  }, 0);

  const discountOnMrp = mrpTotal - subtotal;

  const handleApplyCoupon = async () => {
    if (isCouponApplied) {
      setIsCouponApplied(false);
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
    } else {
      try {
        const coupon = await validateCoupon(couponCode, subtotal);
        setIsCouponApplied(true);
        setAppliedCoupon(coupon);
        setCouponError('');
        if (summaryRef.current) {
          gsap.fromTo(summaryRef.current, 
            { scale: 0.98, backgroundColor: "#f0fdf4" },
            { scale: 1, backgroundColor: "#ffffff", duration: 0.5, ease: "power2.out" }
          );
        }
      } catch (error) {
        setCouponError(error.message);
        setIsCouponApplied(false);
        setAppliedCoupon(null);
      }
    }
  };

  useEffect(() => {
    if (total >= 5000 && !showConfetti) {
      setShowConfetti(true);
      triggerConfetti();
    } else if (total < 5000) {
      setShowConfetti(false);
    }
  }, [total]);

  // Animation for Free Shipping text
  useEffect(() => {
    if (subtotal >= 5000) {
      gsap.fromTo(".free-shipping-text", 
        { scale: 1, color: "#16a34a" },
        { scale: 1.1, color: "#15803d", duration: 0.5, yoyo: true, repeat: -1 }
      );
    }
  }, [subtotal]);

  // Fetch Recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const products = await fetchProducts();
        setRecommendedProducts(products);
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      }
    };
    loadRecommendations();
  }, []);

  // Fetch Available Coupons
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setIsFetchingCoupons(true);
        const data = await fetchPublicCoupons();
        setAvailableCoupons(data || []);
      } catch (error) {
        console.error("Failed to fetch available coupons", error);
      } finally {
        setIsFetchingCoupons(false);
      }
    };
    loadCoupons();
  }, []);

  const handleSelectCoupon = async (coupon) => {
    if (subtotal < coupon.min_purchase) return;
    
    // If already applied, remove it first
    if (isCouponApplied) {
      setIsCouponApplied(false);
      setAppliedCoupon(null);
    }

    try {
      const validated = await validateCoupon(coupon.code, subtotal);
      setIsCouponApplied(true);
      setAppliedCoupon(validated);
      setCouponCode(validated.code);
      setCouponError('');
      if (summaryRef.current) {
        gsap.fromTo(summaryRef.current, 
          { scale: 0.98, backgroundColor: "#f0fdf4" },
          { scale: 1, backgroundColor: "#ffffff", duration: 0.5, ease: "power2.out" }
        );
      }
    } catch (error) {
      setCouponError(error.message);
    }
  };

  const handleViewProduct = (product) => {
    navigate(`/product/${product.suitId}`);
    window.scrollTo(0, 0);
  };

  const triggerConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    const container = document.getElementById('confetti-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('absolute', 'w-2', 'h-2', 'rounded-full');
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = '50%';
      confetti.style.top = '50%';
      container.appendChild(confetti);

      gsap.to(confetti, {
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        opacity: 0,
        duration: 2,
        ease: 'power1.out',
        onComplete: () => confetti.remove(),
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (addresses.length === 0) {
      alert("Please add a delivery address first.");
      setShowAddressForm(true);
      return;
    }

    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    
    try {
      setIsPlacingOrder(true);
      const result = await placeOrder({
        items: cartItems,
        address: selectedAddr,
        subtotal,
        total,
        paymentMethod
      });

      if (result.orderId) {
        setOrderConfirmed({
          orderId: result.orderId,
          name: selectedAddr.name,
          emailSent: result.emailSent
        });
        clearCart();
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      alert("Something went wrong while placing your order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (addresses.length === 0) {
      alert("Please add a delivery address first.");
      setShowAddressForm(true);
      return;
    }

    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    
    // Format Message
    const itemsText = cartItems.map((item, index) => 
      `${index + 1}. *${item.title}* x ${item.quantity || 1} - ${formatPrice(item.price * (item.quantity || 1))}`
    ).join('\n');

    const couponDiscount = isCouponApplied && appliedCoupon 
      ? (appliedCoupon.discount_type === 'percent' ? (subtotal * (appliedCoupon.discount / 100)) : appliedCoupon.discount)
      : 0;

    const discountText = isCouponApplied && appliedCoupon 
      ? `\n- Coupon (${appliedCoupon.code}): -${formatPrice(couponDiscount)}`
      : '';

    const message = `*NEW ORDER - KAMLESH SUITS*\n` +
      `--------------------------\n` +
      `*Customer:* ${selectedAddr.name}\n` +
      `*Phone:* ${selectedAddr.phone}\n` +
      `*Address:* ${selectedAddr.houseNo}, ${selectedAddr.area}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}\n\n` +
      `*Order Items:*\n${itemsText}\n\n` +
      `*Price Summary:*\n` +
      `- Subtotal: ${formatPrice(subtotal)}\n` +
      `- GST (5%): ${formatPrice(gst)}\n` +
      `- Shipping: ${subtotal >= 5000 ? 'FREE' : formatPrice(shippingFee)}` +
      `${discountText}\n` +
      `--------------------------\n` +
      `*GRAND TOTAL: ${formatPrice(total)}*\n\n` +
      `_Please confirm my order._`;

    const whatsappUrl = `https://wa.me/919992892775?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!addressForm.name.trim()) errors.name = "Name is required";
    if (!/^\d{10}$/.test(addressForm.phone)) errors.phone = "Valid 10-digit phone required";
    if (!/^\d{6}$/.test(addressForm.pincode)) errors.pincode = "Valid 6-digit pincode required";
    if (!addressForm.houseNo.trim()) errors.houseNo = "House/Building info required";
    if (!addressForm.area.trim()) errors.area = "Area/Road info required";
    if (!addressForm.city.trim()) errors.city = "City is required";
    if (!addressForm.state.trim()) errors.state = "State is required";

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    if (editingAddressId) {
      updateAddress(editingAddressId, addressForm);
    } else {
      addAddress(addressForm);
    }

    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm({
      name: '', phone: '', pincode: '', houseNo: '',
      area: '', landmark: '', city: '', state: '', type: 'home'
    });
    setAddressErrors({});
  };

  const startEditAddress = (addr) => {
    setAddressForm(addr);
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] shadow-xl border border-stone-100">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-lg shadow-emerald-50">
            <HiCheck size={48} />
          </div>
          <h1 className="font-serif text-4xl text-primary mb-4">Order Confirmed!</h1>
          <p className="text-secondary text-lg mb-2">Thank you for your purchase, {orderConfirmed.name}.</p>
          <p className="text-secondary/60 mb-8">Your order ID is <span className="font-black text-primary">#{orderConfirmed.orderId}</span></p>
          
          <div className="bg-stone-50 p-6 rounded-2xl mb-10 inline-block text-left">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3">What happens next?</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                A confirmation email has been sent to your registered address.
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                The admin team has been notified for processing.
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Your premium suit set will be prepared for shipping shortly.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/')} 
              className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-lg hover:shadow-xl"
            >
              Back to Collection
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-secondary border border-stone-200 hover:bg-stone-100 transition-all"
            >
              Track My Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DELIVERY VALIDATION LOGIC ---
  useEffect(() => {
    const checkDelivery = async () => {
      if (!selectedAddressId) {
        setDeliveryDetails({ isAllowed: true, deliveryFee: 0 });
        return;
      }
      
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (!addr?.pincode) return;

      setIsValidatingDelivery(true);
      try {
        const result = await validateDelivery(addr.pincode);

        if (result.isAllowed === true) {
          // ✅ Backend confirmed delivery is available
          setDeliveryDetails(result);

        } else if (result.isAllowed === null || result.error) {
          // ⚠️ API error / backend unreachable – use client-side prefix check as fallback
          // Never block a valid-prefix pincode just because of a network error
          if (isLikelySupportedPin(addr.pincode)) {
            setDeliveryDetails({ isAllowed: true, deliveryFee: 60, estimatedFee: true });
          } else {
            // Prefix is also unknown – be lenient, don't show the popup on API error
            setDeliveryDetails({ isAllowed: true, deliveryFee: 0 });
          }

        } else {
          // ❌ Backend explicitly says isAllowed: false
          // Double-check with client-side prefix – if prefix is valid, ignore the backend response
          // (can happen when backend isn't restarted yet with new pincode list)
          if (isLikelySupportedPin(addr.pincode)) {
            setDeliveryDetails({ isAllowed: true, deliveryFee: 60, estimatedFee: true });
          } else {
            // Truly unsupported area – show the demand modal
            setDeliveryDetails(result);
            setUnsupportedPincode(addr.pincode);
            setShowDemandModal(true);
          }
        }
      } catch (err) {
        console.error("Delivery validation failed", err);
        // On unexpected error, don't block the user
        setDeliveryDetails({ isAllowed: true, deliveryFee: 0 });
      } finally {
        setIsValidatingDelivery(false);
      }
    };

    checkDelivery();
  }, [selectedAddressId, addresses]);

  const DeliveryDemandModal = () => {
    const [demandForm, setDemandForm] = useState({
      name: user?.name || '',
      phone: '',
      address: '',
      city: '',
      pincode: unsupportedPincode
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await submitDeliveryDemand(demandForm);
        alert("Thank you! We've received your request and will notify you when we expand to your area.");
        setShowDemandModal(false);
      } catch (err) {
        alert("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 sm:p-10 relative">
          <button 
            onClick={() => setShowDemandModal(false)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <HiX className="text-stone-400" size={20} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <HiLocationMarker size={32} />
            </div>
            <h3 className="font-serif text-2xl text-primary mb-2">🚫 Delivery Not Available Yet</h3>
            <p className="text-secondary text-sm leading-relaxed">
              Currently we are not delivering in your area (<b>{unsupportedPincode}</b>), but we are working to expand our service soon.
            </p>
            <p className="text-stone-400 text-xs mt-2 font-medium bg-stone-50 py-2 rounded-lg border border-stone-100 max-w-xs mx-auto">
              Store location: Near Farrukhnagar (122504)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Name</label>
                <input 
                  type="text" required
                  className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:border-primary transition-all text-sm"
                  value={demandForm.name}
                  onChange={e => setDemandForm({...demandForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Phone</label>
                <input 
                  type="text" required
                  className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:border-primary transition-all text-sm"
                  value={demandForm.phone}
                  onChange={e => setDemandForm({...demandForm, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Address Detail</label>
              <textarea 
                required
                className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:border-primary transition-all text-sm h-20 resize-none"
                value={demandForm.address}
                onChange={e => setDemandForm({...demandForm, address: e.target.value})}
                placeholder="Full address where you need delivery"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">City</label>
                <input 
                  type="text" required
                  className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:border-primary transition-all text-sm"
                  value={demandForm.city}
                  onChange={e => setDemandForm({...demandForm, city: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">PIN Code</label>
                <input 
                  type="text" required readOnly
                  className="w-full p-3 rounded-xl border border-stone-100 bg-stone-50 outline-none text-sm"
                  value={demandForm.pincode}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-xl shadow-primary/10 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Notify Me on Expansion'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 pt-1 sm:pt-2 pb-8 relative overflow-x-hidden">
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-50"></div>
      
      {/* Breadcrumb */}
      <nav className="text-sm text-primary/60 mb-2 sm:mb-4">
        <Link to="/" className="hover:text-primary transition">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-primary font-medium">Cart</span>
      </nav>

      <h1 className="font-serif text-2xl sm:text-3xl text-primary mb-4 sm:mb-6">Shopping Cart ({cartItems.length})</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-serif text-primary mb-4">Your cart is empty</h2>
          <p className="text-secondary mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/" className="inline-block bg-primary text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-accent transition">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Offer Banner */}
              {/* Dynamic Offer Banner */}
              {availableCoupons.length > 0 && (
                <div className="bg-gradient-to-r from-accent to-primary text-white p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md text-center sm:text-left rounded-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                   <div className="flex flex-col">
                      <span className="font-serif text-sm sm:text-lg leading-tight">
                        {availableCoupons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].description || `Special discount unlocked!`}
                      </span>
                      <p className="text-[10px] border-t border-white/20 mt-1 pt-1 opacity-80 uppercase tracking-widest font-bold">Latest Exclusive Reveal</p>
                   </div>
                   <div className="flex flex-col items-center sm:items-end gap-1">
                      <span className="font-black bg-white text-primary px-4 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap tracking-widest shadow-lg">
                        CODE: {availableCoupons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].code}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">Apply in summary below</span>
                   </div>
                </div>
              )}

              <div className="space-y-4 sm:space-y-6">
                {cartItems.map((item) => {
                  // Robust image handling
                  const itemImage = item.image 
                    ? item.image 
                    : (Array.isArray(item.images) ? item.images[0] : (item.images || "").split(",")[0]);
                  
                  return (
                  <div key={item.suitId} className="group flex flex-row gap-4 sm:gap-6 py-6 sm:py-8 border-b border-stone-100 last:border-0 hover:bg-stone-50/30 transition-colors p-2 sm:p-4 rounded-xl">
                      {/* Image */}
                      <div 
                        onClick={() => handleViewProduct(item)}
                        className="w-24 h-32 sm:w-40 sm:h-52 shrink-0 bg-stone-100 overflow-hidden relative rounded-xl shadow-sm cursor-pointer"
                      >
                        <img 
                          src={itemImage || "https://via.placeholder.com/150"} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 min-w-0">
                               <h3 
                                 onClick={() => handleViewProduct(item)}
                                 className="font-serif text-base sm:text-2xl text-primary leading-tight line-clamp-2 cursor-pointer hover:text-accent transition-colors"
                               >
                                 {item.title}
                               </h3>
                               <p className="text-[10px] sm:text-xs text-secondary uppercase tracking-[0.2em] font-medium opacity-70">
                                 {item.brand || "Kamlesh Collection"} • {item.material || "Premium Fabric"}
                               </p>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.suitId)}
                              className="text-stone-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all shrink-0"
                              title="Remove Item"
                            >
                              <HiOutlineTrash size={20} />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                             <span className="px-2 py-0.5 bg-stone-100 text-[9px] sm:text-[10px] text-stone-700 font-bold uppercase tracking-widest rounded-sm">
                               {item.type || "Suit Set"}
                             </span>
                             {item.session && (
                               <span className="px-2 py-0.5 bg-highlight/10 text-[9px] sm:text-[10px] text-highlight font-bold uppercase tracking-widest rounded-sm">
                                 {item.session}
                               </span>
                             )}
                          </div>
                        </div>

                        {/* Pricing & Control Row */}
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-[10px] text-stone-600 uppercase tracking-widest">Price per unit</p>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-base sm:text-xl text-primary">{formatPrice(item.price)}</span>
                                {item.mrp && item.mrp > item.price && (
                                  <span className="text-xs sm:text-base text-stone-500 line-through decoration-stone-400 font-light">{formatPrice(item.mrp)}</span>
                                )}
                              </div>
                           </div>

                           <div className="flex items-center border-2 border-stone-100 rounded-full h-10 px-1 hover:border-stone-200 transition-colors">
                              <button 
                                onClick={() => updateQuantity(item.suitId, (item.quantity || 1) - 1)}
                                disabled={(item.quantity || 1) <= 1}
                                className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm disabled:opacity-20 text-secondary transition flex items-center justify-center"
                              >
                                <HiMinus size={12} />
                              </button>
                              <span className="w-8 text-center font-bold text-sm text-primary">{item.quantity || 1}</span>
                              <button 
                                onClick={() => updateQuantity(item.suitId, (item.quantity || 1) + 1)}
                                disabled={(item.quantity || 1) >= 2}
                                className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm disabled:opacity-20 text-secondary transition flex items-center justify-center"
                              >
                                <HiPlus size={12} />
                              </button>
                           </div>
                        </div>
                      </div>
                  </div>
                  );
                })}
              </div>

              {/* Address Section */}
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl text-primary">Delivery Address</h2>
                    <p className="text-secondary text-xs uppercase tracking-widest mt-1">Where should we send your order?</p>
                  </div>
                  {!showAddressForm && addresses.length < 3 && (
                    <button 
                      onClick={() => {
                        setAddressForm({
                          name: '', phone: '', pincode: '', houseNo: '',
                          area: '', landmark: '', city: '', state: '', type: 'home'
                        });
                        setEditingAddressId(null);
                        setAddressErrors({});
                        setShowAddressForm(true);
                      }}
                      className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors bg-accent/5 px-4 py-2 rounded-full"
                    >
                      <HiPlusCircle size={16} /> Add New Address
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <div className="bg-stone-50 p-6 sm:p-8 rounded-3xl border border-stone-200 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-primary uppercase tracking-widest text-sm">
                        {editingAddressId ? 'Edit Address' : 'New Delivery Address'}
                      </h4>
                      <button 
                         onClick={() => {
                           setShowAddressForm(false);
                           setEditingAddressId(null);
                           setAddressErrors({});
                         }}
                         className="text-stone-400 hover:text-primary text-[10px] uppercase tracking-widest font-black"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddressSubmit} className="grid sm:grid-cols-2 gap-4">
                      {/* Name & Phone */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Full Name *</label>
                        <input 
                          type="text" 
                          placeholder="Recipient's Name"
                          className={`w-full p-3 rounded-xl border-2 bg-white outline-none transition-all ${addressErrors.name ? 'border-red-200' : 'border-stone-100 focus:border-primary'}`}
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Phone Number *</label>
                        <input 
                          type="text" 
                          placeholder="10-digit mobile"
                          className={`w-full p-3 rounded-xl border-2 bg-white outline-none transition-all ${addressErrors.phone ? 'border-red-200' : 'border-stone-100 focus:border-primary'}`}
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0,10)})}
                        />
                      </div>

                      {/* Pincode & State */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Pincode *</label>
                        <input
                          type="text"
                          placeholder="Enter 6-digit Pincode"
                          maxLength={6}
                          className={`w-full p-3 rounded-xl border-2 bg-white outline-none transition-all ${addressErrors.pincode ? 'border-red-200' : 'border-stone-100 focus:border-primary'} ${isFetchingPincode ? 'opacity-50 cursor-wait' : ''}`}
                          value={addressForm.pincode}
                          onChange={async (e) => {
                            const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setAddressForm({ ...addressForm, pincode: pin });
                            
                            if (pin.length === 6) {
                              setIsFetchingPincode(true);
                              try {
                                const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                                const data = await res.json();
                                if (data[0].Status === "Success") {
                                  const postOffice = data[0].PostOffice[0];
                                  setAddressForm(prev => ({
                                    ...prev,
                                    city: postOffice.District,
                                    state: postOffice.State
                                  }));
                                }
                              } catch (err) {
                                console.error("Pincode fetch error:", err);
                              } finally {
                                setIsFetchingPincode(false);
                              }
                            }
                          }}
                        />
                        {/* Live delivery hint */}
                        {addressForm.pincode.length === 6 && (
                          isLikelySupportedPin(addressForm.pincode) ? (
                            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                              ✅ Delivery available in your area
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                              ⚠️ Delivery may not be available — we'll verify on selection
                            </p>
                          )
                        )}
                        <p className="text-[9px] text-stone-400 mt-1">
                          Supported: Delhi (110xxx), Gurgaon (122xxx), Rewari (123xxx), Jhajjar (124xxx)
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">State *</label>
                        <input 
                          type="text" 
                          placeholder="State (Auto-filled)"
                          className={`w-full p-3 rounded-xl border-2 bg-white outline-none transition-all ${addressErrors.state ? 'border-red-200' : 'border-stone-100 focus:border-primary'}`}
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                          readOnly={isFetchingPincode}
                        />
                      </div>

                      {/* House No & Area */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Flat, House no., Building, Apartment *</label>
                        <input 
                          type="text" 
                          placeholder="Detailed address"
                          className={`w-full p-3 rounded-xl border-2 bg-white outline-none transition-all ${addressErrors.houseNo ? 'border-red-200' : 'border-stone-100 focus:border-primary'}`}
                          value={addressForm.houseNo}
                          onChange={(e) => setAddressForm({...addressForm, houseNo: e.target.value})}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Area, Street, Sector, Village *</label>
                        <input 
                          type="text" 
                          placeholder="Locality details"
                          className={`w-full p-3 rounded-xl border-2 bg-white outline-none transition-all ${addressErrors.area ? 'border-red-200' : 'border-stone-100 focus:border-primary'}`}
                          value={addressForm.area}
                          onChange={(e) => setAddressForm({...addressForm, area: e.target.value})}
                        />
                      </div>

                      {/* City & Landmark */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Town/City *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Rohtak"
                          className={`w-full p-3 rounded-xl border-2 bg-white outline-none transition-all ${addressErrors.city ? 'border-red-200' : 'border-stone-100 focus:border-primary'}`}
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Landmark (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Near Big Temple"
                          className="w-full p-3 rounded-xl border-2 bg-white border-stone-100 focus:border-primary outline-none transition-all"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({...addressForm, landmark: e.target.value})}
                        />
                      </div>

                      {/* Address Type */}
                      <div className="sm:col-span-2 py-4">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3 ml-1">Address Label</p>
                        <div className="flex gap-4">
                          {['home', 'office', 'other'].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAddressForm({...addressForm, type})}
                              className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                addressForm.type === type ? 'border-primary bg-primary text-white shadow-lg' : 'border-stone-100 text-stone-500 hover:border-stone-200'
                              }`}
                            >
                              {type === 'home' && <HiHome size={14} />}
                              {type === 'office' && <HiOfficeBuilding size={14} />}
                              {type === 'other' && <HiLocationMarker size={14} />}
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={!isLikelySupportedPin(addressForm.pincode) || addressForm.pincode.length !== 6}
                        className={`sm:col-span-2 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${
                          !isLikelySupportedPin(addressForm.pincode) || addressForm.pincode.length !== 6
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                            : 'bg-primary text-white hover:bg-accent hover:shadow-primary/20'
                        }`}
                      >
                        {editingAddressId ? 'Save Changes' : 'Deliver to this Address'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-1 gap-4">
                    {addresses.length > 0 ? (
                      addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`relative group p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                            selectedAddressId === addr.id ? 'border-primary bg-stone-50 shadow-md' : 'border-stone-100 hover:border-stone-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                selectedAddressId === addr.id ? 'bg-primary text-white' : 'bg-stone-100 text-stone-400'
                              }`}>
                                {addr.type === 'home' ? <HiHome size={20} /> : addr.type === 'office' ? <HiOfficeBuilding size={20} /> : <HiLocationMarker size={20} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-bold text-primary">{addr.name}</h4>
                                  <span className="px-2 py-0.5 bg-stone-100 text-[9px] font-black uppercase tracking-widest rounded-full text-stone-500 border border-stone-200">
                                    {addr.type}
                                  </span>
                                </div>
                                <p className="text-secondary text-xs leading-relaxed max-w-lg">
                                  {addr.houseNo}, {addr.area}, {addr.city}, {addr.state} - <span className="font-black">{addr.pincode}</span>
                                </p>
                                <p className="text-stone-400 text-xs font-medium mt-1">Contact: +91 {addr.phone}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); startEditAddress(addr); }}
                                className="p-2 text-stone-400 hover:text-accent transition-colors"
                              >
                                <HiPencilAlt size={18} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeAddress(addr.id); }}
                                className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                              >
                                <HiOutlineTrash size={18} />
                              </button>
                            </div>
                          </div>
                          
                          {selectedAddressId === addr.id && (
                            <div className="absolute top-4 right-4 flex flex-col items-end gap-1 animate-in zoom-in-0 duration-300">
                              <HiCheck size={24} className="text-primary" />
                              {isValidatingDelivery && (
                                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Checking...</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-stone-50 rounded-[2.5rem] border border-stone-100 border-dashed">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <HiLocationMarker className="text-stone-300" size={32} />
                        </div>
                        <h4 className="font-serif text-lg text-primary mb-2">No addresses saved yet</h4>
                        <p className="text-stone-400 text-xs mb-6 max-w-xs mx-auto">Add a delivery address to complete your order.</p>
                        <button 
                          onClick={() => setShowAddressForm(true)}
                          className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all"
                        >
                          Add Address
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Price Details & Coupons (Order Summary) */}
              <div ref={summaryRef} className="bg-white p-6 sm:p-8 border border-stone-100 shadow-sm rounded-2xl">
                <h3 className="font-serif text-xl font-bold text-primary mb-6">Order Summary</h3>
                <div className="space-y-4 text-sm text-secondary">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Total MRP</span>
                    <span className="text-primary font-bold">{formatPrice(mrpTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount on MRP</span>
                    <span>-{formatPrice(discountOnMrp)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-primary">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">GST (5%)</span>
                    <span className="text-primary font-bold">{formatPrice(gst)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-stone-50 pb-4 mb-4">
                    <span className="text-stone-600">
                      Shipping
                      {selectedAddressId && deliveryDetails.estimatedFee && ' (estimated)'}
                    </span>
                    <span className={subtotal >= 5000 ? 'text-emerald-600 font-bold' : 'text-primary font-bold'}>
                      {subtotal >= 5000 ? (
                        <span className="flex items-center gap-2 justify-end">
                          <span className="line-through text-stone-400 text-xs font-normal">{formatPrice(shippingFee || deliveryDetails.deliveryFee || 60)}</span>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">Free</span>
                        </span>
                      ) : selectedAddressId ? (
                        isValidatingDelivery
                          ? <span className="text-stone-400 text-xs italic">Calculating...</span>
                          : formatPrice(shippingFee)
                      ) : (
                        <span className="text-stone-400 text-xs italic">Select address</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Coupon Discount Row */}
                  {isCouponApplied && appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-black animate-pulse bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                      <span className="uppercase text-[10px] tracking-widest">{appliedCoupon.description || 'Voucher Discount'}</span>
                      <span>
                        -{formatPrice(appliedCoupon.discount_type === 'percent' ? (subtotal * (appliedCoupon.discount / 100)) : appliedCoupon.discount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between font-sans font-black text-2xl text-primary">
                    <span className="uppercase text-xs tracking-[0.2em] self-center">Grand Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Secure Checkout Integrated */}
                <div className="mt-8 pt-6 border-t border-stone-100">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-4 rounded-full bg-primary" />
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.15em]">Secure Checkout</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <label className={`flex flex-col items-center justify-center p-3 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'card' ? 'border-primary bg-stone-50 shadow-sm' : 'border-stone-100 bg-white hover:border-stone-200'}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="card" 
                        className="hidden"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <HiCreditCard size={20} className={paymentMethod === 'card' ? 'text-primary' : 'text-stone-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${paymentMethod === 'card' ? 'text-primary' : 'text-stone-500'}`}>Digital</span>
                    </label>
                    
                    <label className={`flex flex-col items-center justify-center p-3 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-primary bg-stone-50 shadow-sm' : 'border-stone-100 bg-white hover:border-stone-200'}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="cod" 
                        className="hidden"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                      />
                      <HiCash size={20} className={paymentMethod === 'cod' ? 'text-primary' : 'text-stone-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${paymentMethod === 'cod' ? 'text-primary' : 'text-stone-500'}`}>COD</span>
                    </label>
                  </div>

                  <button 
                    onClick={handlePlaceOrder}
                    disabled={total <= 0 || isPlacingOrder || !deliveryDetails.isAllowed}
                    className={`w-full bg-primary text-white py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-accent transition-all duration-500 shadow-xl hover:shadow-primary/20 rounded-2xl flex items-center justify-center gap-3 active:scale-95 mb-3 ${((!selectedAddressId && user) || isPlacingOrder || !deliveryDetails.isAllowed) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                  >
                    {isPlacingOrder ? 'Processing...' : !user ? 'Sign In to Continue' : addresses.length === 0 ? 'Add Address First' : !selectedAddressId ? 'Select an Address' : !deliveryDetails.isAllowed ? 'Delivery Not Available' : 'Confirm & Place Order'}
                    <HiCheck size={18} />
                  </button>

                  <button 
                    onClick={handleWhatsAppOrder}
                    disabled={total <= 0 || !deliveryDetails.isAllowed}
                    className={`w-full bg-[#25D366] text-white py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#128C7E] transition-all duration-500 shadow-xl hover:shadow-emerald-200/50 rounded-2xl flex items-center justify-center gap-3 active:scale-95 ${(!deliveryDetails.isAllowed) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                  >
                    Order on WhatsApp
                    <FaWhatsapp size={18} />
                  </button>
                  <p className="text-[9px] text-stone-400 font-bold uppercase text-center mt-4 tracking-widest opacity-60">Verified & Secure Connection</p>
                </div>
                
                {/* Coupon Selection Area */}
                <div className="mt-8 pt-6 border-t border-stone-100">
                   {isCouponApplied ? (
                     <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between group animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                              <HiTag size={20} />
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Applied DNA</p>
                              <h4 className="text-base font-black text-primary uppercase leading-none">{appliedCoupon?.code}</h4>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            setIsCouponApplied(false);
                            setAppliedCoupon(null);
                            setCouponCode('');
                          }}
                          className="px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          Remove
                        </button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        {availableCoupons.length > 0 ? (
                          <div className="space-y-3">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <div className="w-1 h-4 rounded-full bg-gradient-to-b from-highlight to-accent" />
                                 <h4 className="text-xs font-black text-primary uppercase tracking-[0.15em]">Discovery Rewards</h4>
                               </div>
                               <span className="text-[9px] font-black text-white uppercase bg-gradient-to-r from-accent to-highlight px-2.5 py-1 rounded-full shadow-sm">{availableCoupons.length} Active</span>
                            </div>
                            
                            <div className="coupon-scroll-wrap">
                            <div className="flex gap-3 overflow-x-auto pb-3 coupon-scroll snap-x">
                              {availableCoupons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((coupon) => {
                                const isEligible = subtotal >= coupon.min_purchase;
                                return (
                                  <div 
                                    key={coupon.code}
                                    onClick={() => isEligible && handleSelectCoupon(coupon)}
                                    className={`relative flex-none w-[190px] snap-start pt-1 ${isEligible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                  >
                                    <div className={`h-full rounded-2xl flex flex-col justify-between overflow-hidden border transition-all duration-300 ${
                                      isEligible
                                        ? 'bg-gradient-to-br from-stone-50 via-white to-orange-50/30 border-accent/20 shadow-sm hover:border-accent/50 hover:-translate-y-1 hover:shadow-lg'
                                        : 'bg-stone-50 border-stone-100'
                                    }`}>
                                      {/* Card Top Stripe */}
                                      {isEligible && (
                                        <div className="h-1 w-full bg-gradient-to-r from-accent via-highlight to-accent/60" />
                                      )}
                                      <div className="p-3">
                                        {/* Mute top section only for ineligible cards */}
                                        <div className={!isEligible ? 'opacity-50' : ''}>
                                        <div className="flex justify-between items-start mb-2">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                                            isEligible ? 'bg-gradient-to-br from-accent to-highlight text-white shadow-sm' : 'bg-stone-200 text-stone-500'
                                          }`}>
                                            <HiTag size={14} />
                                          </div>
                                          <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full ${
                                            isEligible ? 'bg-highlight/10 text-highlight border border-highlight/20' : 'bg-stone-200 text-stone-500'
                                          }`}>
                                            {coupon.discount_type === 'percent' ? `${coupon.discount}%` : `₹${coupon.discount}`} OFF
                                          </span>
                                        </div>
                                        
                                        <div className="mb-2">
                                          <h5 className={`font-black text-xs uppercase tracking-wider ${
                                            isEligible ? 'text-primary' : 'text-stone-400'
                                          }`}>{coupon.code}</h5>
                                          <p className="text-[8px] text-stone-500 font-medium line-clamp-1 mt-0.5">{coupon.description || 'Exclusive Reward'}</p>
                                        </div>
                                        </div>

                                        {!isEligible ? (
                                          <div className="pt-2 border-t border-stone-100 border-dashed space-y-1.5">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">Add more to unlock</span>
                                              <span className="text-[9px] font-black text-accent">₹{(coupon.min_purchase - subtotal).toLocaleString()}</span>
                                            </div>
                                            <div className="relative h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-gradient-to-r from-accent to-highlight rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((subtotal / coupon.min_purchase) * 100, 100)}%` }}
                                              />
                                            </div>
                                            <p className="text-[9px] text-stone-600 font-bold text-right">
                                              Min. ₹{coupon.min_purchase.toLocaleString()} required
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="pt-2 border-t border-accent/10 border-dashed flex items-center justify-between">
                                            <span className="text-[8px] font-black text-accent uppercase tracking-widest">Tap to Apply</span>
                                            <div className="w-5 h-5 bg-gradient-to-br from-accent to-highlight text-white rounded-full flex items-center justify-center shadow-sm">
                                              <HiCheck size={10} />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* Ticket notch */}
                                    <div className="absolute -left-1.5 top-[58%] -translate-y-1/2 w-3 h-5 bg-white border-r border-stone-100 rounded-full z-10" />
                                    <div className="absolute -right-1.5 top-[58%] -translate-y-1/2 w-3 h-5 bg-white border-l border-stone-100 rounded-full z-10" />
                                  </div>
                                )
                              })}
                            </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-stone-50/50 rounded-[2rem] border border-stone-100 border-dashed">
                             <HiTag className="mx-auto text-stone-400 mb-2" size={24} />
                             <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">No Active Vouchers</p>
                          </div>
                        )}
                     </div>
                   )}
                   {couponError && <p className="text-red-500 font-black text-[9px] uppercase tracking-widest mt-3 animate-pulse bg-red-50 p-2 rounded-lg border border-red-100">Warning: {couponError}</p>}
                </div>
              </div>

            </div>
          </div>
          
          {/* Auth Required Modal */}
          {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 text-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-100">
                    <HiShieldCheck className="text-secondary text-4xl" />
                  </div>
                  <h3 className="font-serif text-2xl text-primary mb-3">Authentication Required</h3>
                  <p className="text-secondary text-sm leading-relaxed mb-8">
                    To ensure the safety of your transactions and provide personalized service, please sign in to your account before placing an order.
                  </p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-lg hover:shadow-xl"
                    >
                      Sign In Now
                    </button>
                    <button 
                      onClick={() => setShowAuthModal(false)}
                      className="w-full py-4 text-stone-400 font-bold uppercase tracking-widest text-[10px] hover:text-primary transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Section - Moved to bottom like Wishlist */}
          <div className="mt-8 sm:mt-16 border-t border-stone-200 pt-8 sm:pt-16">
             <YouMayAlsoLike 
               allProducts={recommendedProducts} 
               onProductSelect={handleViewProduct}
             />
          </div>
          
          {showDemandModal && <DeliveryDemandModal />}
        </>
      )}
    </div>
  );
};

Cart.displayName = 'Cart';

export default Cart;