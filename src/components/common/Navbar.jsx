
// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from "../../hooks/useCart.jsx";
import { useAuth } from "../../context/AuthContext";
import { HiMenu, HiX, HiOutlineHeart, HiOutlineShoppingBag, HiChevronDown, HiUserCircle, HiLogout, HiShoppingBag, HiHeart, HiCollection, HiShieldCheck, HiGift, HiCheck, HiClipboard } from 'react-icons/hi';
import { gsap } from 'gsap';
import logo from "../../assets/K_suit.png";
import { fetchPublicCoupons } from '../../api/coupons';

const Navbar = () => {
  const { cartItems, wishlistItems } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const wishlistRef = useRef(null);
  const cartRef = useRef(null);
  const logoRef = useRef(null);

  // Animate Wishlist Icon on change
  useEffect(() => {
    if (wishlistItems.length > 0) {
      gsap.fromTo(wishlistRef.current,
        { scale: 1 },
        { scale: 1.5, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
  }, [wishlistItems.length]);

  // Animate Cart Icon on change
  useEffect(() => {
    if (cartItems.length > 0) {
      gsap.fromTo(cartRef.current,
        { scale: 1 },
        { scale: 1.5, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
  }, [cartItems.length]);

  // Animate Logo on Mount
  useEffect(() => {
    if (logoRef.current) {
      gsap.fromTo(logoRef.current, 
        { opacity: 0, y: -20, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
      );
    }
  }, []);

  // Mobile Menu Categories
  const [expandedCategory, setExpandedCategory] = useState(null);
  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-secure contexts (HTTP)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch coupons when menu opens
  useEffect(() => {
    if (menuOpen) {
      const loadCoupons = async () => {
        try {
          setIsFetchingCoupons(true);
          const data = await fetchPublicCoupons();
          setCoupons(data || []);
        } catch (error) {
          console.error("Failed to fetch coupons for navbar", error);
        } finally {
          setIsFetchingCoupons(false);
        }
      };
      loadCoupons();
    }
  }, [menuOpen]);

  return (
    <>
      <nav className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setMenuOpen(true)}
                className="text-primary hover:text-accent transition p-1"
                aria-label="Open menu"
              >
                <HiMenu size={28} />
              </button>
            </div>

            {/* Logo - Center on Mobile, Left on Desktop */}
            <div className="flex-1 flex justify-center md:justify-start">
              <Link to="/" className="flex items-center gap-3 group">
                <div ref={logoRef} className="h-12 md:h-16 w-auto transition-transform hover:scale-105">
                  <img
                    src={logo}
                    alt="Kamlesh Suits"
                    className="h-full w-auto object-contain"
                  />
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6">

              <Link to="/wishlist" className="group relative p-2" title="Wishlist">
                <div ref={wishlistRef} className="relative">
                  <HiOutlineHeart size={26} className="text-accent group-hover:text-primary transition" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-2 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                      {wishlistItems.length}
                    </span>
                  )}
                </div>
              </Link>

              <Link to="/cart" className="group relative p-2" title="Cart">
                <div ref={cartRef} className="relative">
                  <HiOutlineShoppingBag size={26} className="text-accent group-hover:text-primary transition" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                      {cartItems.length}
                    </span>
                  )}
                </div>
              </Link>

              {/* User Account / Login */}
              <div className="relative" ref={dropdownRef}>
                {user ? (
                  <button 
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-2 text-secondary hover:text-primary transition group"
                  >
                    {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img 
                        src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                        alt={user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-stone-200 group-hover:border-primary transition object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-highlight text-white flex items-center justify-center text-sm font-bold border-2 border-stone-200 group-hover:border-accent transition">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium hidden lg:block">{user.name || user.email?.split('@')[0] || 'My Account'}</span>
                  </button>
                ) : (
                  <Link to="/login" className="flex items-center gap-2 p-2 text-accent hover:text-primary transition group">
                    <HiUserCircle size={28} />
                    <span className="text-sm font-medium hidden lg:block">Login</span>
                  </Link>
                )}

                {/* Dropdown Menu */}
                {user && userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-stone-100 shadow-2xl rounded-2xl py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-stone-100 mb-2">
                       {/* User Avatar and Info */}
                       <div className="flex items-center gap-4 mb-4">
                         <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-highlight text-white flex items-center justify-center text-2xl font-black">
                           {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                       </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-black text-primary truncate">
                             {user.name || user.email?.split('@')[0] || 'User'}
                           </p>
                           <p className="text-[10px] text-stone-400 truncate tracking-tight">{user.email}</p>
                           {user.last_sign_in_at && (
                             <div className="mt-1 flex items-center gap-1">
                               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                               <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">
                                 Active • {new Date(user.last_sign_in_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                               </p>
                             </div>
                           )}
                         </div>
                       </div>
                       
                       {/* Account Metadata Quick View */}
                       <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-stone-50">
                          <div className="bg-stone-50 p-2 rounded-lg">
                             <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Sign-in Method</p>
                             <p className="text-[10px] font-bold text-primary capitalize">{user.app_metadata?.provider || 'Email'}</p>
                          </div>
                          <div className="bg-stone-50 p-2 rounded-lg">
                             <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Member Since</p>
                             <p className="text-[10px] font-bold text-primary">{user.created_at ? new Date(user.created_at).getFullYear() : '2025'}</p>
                          </div>
                       </div>
                    </div>
                    
                    <Link to="/account" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-stone-600 hover:text-primary hover:bg-stone-50 transition text-sm font-medium">
                      <HiCollection size={18} className="text-accent/60" /> Dashboard
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-emerald-600 hover:bg-emerald-50 transition text-sm font-bold">
                        <HiShieldCheck size={18} className="text-emerald-400" /> Admin Management
                      </Link>
                    )}
                    <Link to="/cart" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-stone-600 hover:text-primary hover:bg-stone-50 transition text-sm font-medium">
                      <HiShoppingBag size={18} className="text-accent/60" /> Track Orders
                    </Link>
                    <Link to="/wishlist" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-stone-600 hover:text-primary hover:bg-stone-50 transition text-sm font-medium">
                      <HiHeart size={18} className="text-accent/60" /> Saved Pieces
                    </Link>
                    
                    <div className="h-px bg-stone-100 my-2 mx-5" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-5 py-3 text-red-500 hover:bg-red-50 transition text-sm font-bold tracking-tight"
                    >
                      <HiLogout size={18} /> End Session
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Right Icons (Wishlist & Cart) */}
            <div className="flex items-center md:hidden gap-3">
               <Link to="/wishlist" className="relative p-1">
                <HiOutlineHeart size={24} className="text-accent" />
                {wishlistItems.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                     {wishlistItems.length}
                   </span>
                 )}
              </Link>
              <Link to="/cart" className="relative p-1">
                <HiOutlineShoppingBag size={24} className="text-accent" />
                {cartItems.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                     {cartItems.length}
                   </span>
                 )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer (Full Screen / Side) */}
      {/* Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      {/* Drawer Content */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white z-[70] transform transition-transform duration-300 ease-in-out overflow-y-auto md:hidden flex flex-col ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header: Logo & Close */}
        <div className="p-5 flex items-center justify-between border-b border-stone-100">
          <div className="h-8 w-auto">
            <img
              src={logo}
              alt="Kamlesh Suits"
              className="h-full w-auto object-contain"
            />
          </div>
          <button onClick={() => setMenuOpen(false)} className="text-secondary p-1">
            <HiX size={24} />
          </button>
        </div>

        {/* User Section (Mobile) */}
        <div className="px-6 py-8 border-b border-stone-100 bg-stone-50/50">
          {user ? (
            <div className="flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img 
                      src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                      alt={user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-highlight text-white flex items-center justify-center text-2xl font-black">
                      {(user.user_metadata?.full_name?.[0] || user.user_metadata?.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-primary font-black truncate">{user.name || user.email?.split('@')[0] || 'User'}</h4>
                    <p className="text-[10px] text-stone-400 font-medium truncate uppercase tracking-widest">{user.groups?.[0] || 'Member'}</p>
                    {user.created_at && (
                      <p className="text-[9px] text-stone-400 mt-1">
                        Member since {new Date(user.created_at).getFullYear()}
                      </p>
                    )}
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="py-3 bg-white border border-stone-100 text-primary text-center rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">Profile</Link>
                  <button 
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="py-3 bg-red-50 text-red-500 text-center rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    Logout
                  </button>
               </div>
               {isAdmin && (
                 <Link 
                   to="/admin" 
                   onClick={() => setMenuOpen(false)}
                   className="w-full py-3 bg-emerald-50 text-emerald-600 text-center rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-emerald-100"
                 >
                   <HiShieldCheck size={14} /> Admin Dashboard
                 </Link>
               )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link to="/login" className="flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-xl shadow-lg shadow-primary/20" onClick={() => setMenuOpen(false)}>
                <HiUserCircle size={22} />
                <span className="font-bold text-xs uppercase tracking-widest text-center">Login / Sign Up</span>
              </Link>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="py-2 flex-1">
          <Link to="/" className="block px-6 py-4 text-sm font-black text-primary border-b border-stone-100 uppercase tracking-widest hover:bg-stone-50 transition" onClick={() => setMenuOpen(false)}>
            Shop All
          </Link>

          <Link to="/new-arrivals" className="block px-6 py-4 text-sm font-black text-primary border-b border-stone-100 uppercase tracking-widest hover:bg-stone-50 transition" onClick={() => setMenuOpen(false)}>
            New Arrivals
          </Link>

          <Link to="/sale" className="block px-6 py-4 text-sm font-black text-emerald-600 border-b border-stone-100 uppercase tracking-widest hover:bg-stone-50 transition" onClick={() => setMenuOpen(false)}>
            Exclusive Sale
          </Link>

          {/* Expandable: Shop By Categories */}
          <div>
            <button 
              onClick={() => toggleCategory('categories')}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-black text-primary border-b border-stone-100 uppercase tracking-widest hover:bg-stone-50 transition"
            >
              <span>Shop Collections</span>
              <HiChevronDown className={`transition-transform duration-300 ${expandedCategory === 'categories' ? 'rotate-180' : ''}`} />
            </button>
             <div className={`bg-stone-50/50 overflow-hidden transition-all duration-300 ${expandedCategory === 'categories' ? 'max-h-60' : 'max-h-0'}`}>
              <Link to="/?category=Wedding" className="block px-10 py-3 text-xs font-bold text-stone-500 hover:text-primary border-b border-stone-50 transition" onClick={() => setMenuOpen(false)}>Wedding Wear</Link>
              <Link to="/?category=Party Wear" className="block px-10 py-3 text-xs font-bold text-stone-500 hover:text-primary border-b border-stone-50 transition" onClick={() => setMenuOpen(false)}>Party Wear</Link>
              <Link to="/?category=Festive" className="block px-10 py-3 text-xs font-bold text-stone-500 hover:text-primary border-b border-stone-50 transition" onClick={() => setMenuOpen(false)}>Festive Look</Link>
              <Link to="/?category=Daily Wear" className="block px-10 py-3 text-xs font-bold text-stone-500 hover:text-primary border-b border-stone-50 transition" onClick={() => setMenuOpen(false)}>Daily Wear</Link>
            </div>
          </div>

          {/* "Gifts for You" Section */}
          {coupons.length > 0 && (
            <div className="mt-4 px-6 py-4 bg-emerald-50/50 border-y border-stone-100">
              <div className="flex items-center gap-2 mb-3">
                <HiGift className="text-emerald-500" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Gifts For You</span>
              </div>
              <div className="space-y-3">
                {coupons.slice(0, 2).map((coupon) => (
                  <div key={coupon.code} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-50" />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter mb-1">{coupon.description || 'Exclusive Discount'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-primary uppercase tracking-wider">{coupon.code}</span>
                      <button 
                        onClick={() => {
                          copyToClipboard(coupon.code);
                          setCopiedCode(coupon.code);
                          setTimeout(() => setCopiedCode(null), 2000);
                        }}
                        className={`p-2 rounded-md transition-all active:scale-90 ${
                          copiedCode === coupon.code 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title="Copy Code"
                      >
                        {copiedCode === coupon.code ? (
                          <HiCheck size={16} className="animate-in zoom-in duration-300" />
                        ) : (
                          <HiClipboard size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer of Drawer */}
        <div className="p-6 bg-stone-50 mt-auto border-t border-stone-200">
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4 text-xs text-stone-500">
                    <Link to="/terms" className="hover:text-primary transition" onClick={() => setMenuOpen(false)}>Terms & Conditions</Link>
                </div>
                <p className="text-xs text-center text-stone-400">© {new Date().getFullYear()} Kamlesh Suits. All rights reserved.</p>
            </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
