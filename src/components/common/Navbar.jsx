
// src/components/common/Navbar.jsx — Mobile: logo-only, no hamburger, no text
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from "../../hooks/useCart.jsx";
import { useAuth } from "../../context/AuthContext";
import { HiMenu, HiX, HiOutlineHeart, HiOutlineShoppingBag, HiChevronDown, HiUserCircle, HiLogout, HiShoppingBag, HiHeart, HiCollection, HiShieldCheck, HiGift, HiCheck, HiClipboard, HiOutlineUser } from 'react-icons/hi';
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (wishlistItems.length > 0) {
      gsap.fromTo(wishlistRef.current, { scale: 1 }, { scale: 1.5, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" });
    }
  }, [wishlistItems.length]);

  useEffect(() => {
    if (cartItems.length > 0) {
      gsap.fromTo(cartRef.current, { scale: 1 }, { scale: 1.5, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" });
    }
  }, [cartItems.length]);

  useEffect(() => {
    if (logoRef.current) {
      gsap.fromTo(logoRef.current, { opacity: 0, y: -20, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)" });
    }
  }, []);

  const [expandedCategory, setExpandedCategory] = useState(null);
  const toggleCategory = (category) => setExpandedCategory(expandedCategory === category ? null : category);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (error) { console.error('Logout failed:', error); }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus(); textArea.select();
      try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setUserDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      const loadCoupons = async () => {
        try {
          setIsFetchingCoupons(true);
          const data = await fetchPublicCoupons();
          setCoupons(data || []);
        } catch (error) { console.error("Failed to fetch coupons", error); }
        finally { setIsFetchingCoupons(false); }
      };
      loadCoupons();
    }
  }, [menuOpen]);

  const location = useLocation();
  const isSpecialPage = ['/', '/new-arrivals', '/sale'].includes(location.pathname);

  return (
    <>
      <nav className={`z-[100] transition-all duration-700 ${isScrolled || !isSpecialPage ? 'fixed top-0 left-0 right-0 animate-in slide-in-from-top-2 mobile-nav-gradient md:bg-white shadow-lg' : 'absolute top-0 left-0 right-0 bg-transparent border-none'} md:sticky md:top-0 md:bg-white md:border-b md:border-stone-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-20">

            {/* Desktop only: hamburger */}
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => setMenuOpen(true)} className="text-primary hover:text-accent transition p-1" aria-label="Open menu">
                <HiMenu size={28} />
              </button>
            </div>

            {/* Logo */}
            <div className="flex justify-start">
              <Link to="/" className="flex items-center gap-2 group">
                <div ref={logoRef} className="h-9 md:h-16 w-auto transition-transform hover:scale-105">
                  <img src={logo} alt="Kamlesh Suits" className="h-full w-auto object-contain brightness-0 md:brightness-100 invert md:invert-0" />
                </div>
                {/* NO TEXT on mobile */}
              </Link>
            </div>

            {/* Desktop right icons */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/wishlist" className="group relative p-2" title="Wishlist">
                <div ref={wishlistRef} className="relative">
                  <HiOutlineHeart size={26} className="text-accent group-hover:text-primary transition" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-2 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">{wishlistItems.length}</span>
                  )}
                </div>
              </Link>
              <Link to="/cart" className="group relative p-2" title="Cart">
                <div ref={cartRef} className="relative">
                  <HiOutlineShoppingBag size={26} className="text-accent group-hover:text-primary transition" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">{cartItems.length}</span>
                  )}
                </div>
              </Link>
              <div className="relative" ref={dropdownRef}>
                {user ? (
                  <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center gap-2 p-2 text-secondary hover:text-primary transition group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-highlight text-white flex items-center justify-center text-sm font-bold border-2 border-stone-200 group-hover:border-accent transition">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium hidden lg:block">{user.name || user.email?.split('@')[0] || 'My Account'}</span>
                  </button>
                ) : (
                  <Link to="/login" className="flex items-center gap-2 p-2 text-accent hover:text-primary transition group">
                    <HiUserCircle size={28} />
                    <span className="text-sm font-medium hidden lg:block">Login</span>
                  </Link>
                )}
                {user && userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-stone-100 shadow-2xl rounded-2xl py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-stone-100 mb-2">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-highlight text-white flex items-center justify-center text-2xl font-black">
                          {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-primary truncate">{user.name || user.email?.split('@')[0] || 'User'}</p>
                          <p className="text-[10px] text-stone-400 truncate tracking-tight">{user.email}</p>
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
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-red-500 hover:bg-red-50 transition text-sm font-bold tracking-tight">
                      <HiLogout size={18} /> End Session
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile right icons — wishlist + account ONLY (cart is floating FAB) */}
            <div className="flex items-center md:hidden gap-1">
              <Link to="/wishlist" className="relative p-2">
                <HiOutlineHeart size={22} className="text-white/90" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-white text-accent text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{wishlistItems.length}</span>
                )}
              </Link>
              {user ? (
                <Link to="/account" className="relative p-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 text-white flex items-center justify-center text-xs font-black">
                    {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                </Link>
              ) : (
                <Link to="/login" className="relative p-2">
                  <HiOutlineUser size={22} className="text-white/90" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop-only side drawer */}
      {menuOpen && <div className="fixed inset-0 bg-black/50 z-[60] hidden md:block" onClick={() => setMenuOpen(false)} />}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white z-[70] transform transition-transform duration-300 ease-in-out overflow-y-auto hidden md:flex flex-col ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-stone-100">
          <div className="h-8 w-auto">
            <img src={logo} alt="Kamlesh Suits" className="h-full w-auto object-contain" />
          </div>
          <button onClick={() => setMenuOpen(false)} className="text-secondary p-1"><HiX size={24} /></button>
        </div>
        <div className="py-2 flex-1">
          <Link to="/" className="block px-6 py-4 text-sm font-black text-primary border-b border-stone-100 uppercase tracking-widest hover:bg-stone-50 transition" onClick={() => setMenuOpen(false)}>Shop All</Link>
          <Link to="/new-arrivals" className="block px-6 py-4 text-sm font-black text-primary border-b border-stone-100 uppercase tracking-widest hover:bg-stone-50 transition" onClick={() => setMenuOpen(false)}>New Arrivals</Link>
          <Link to="/sale" className="block px-6 py-4 text-sm font-black text-emerald-600 border-b border-stone-100 uppercase tracking-widest hover:bg-stone-50 transition" onClick={() => setMenuOpen(false)}>Exclusive Sale</Link>
        </div>
        <div className="p-6 bg-stone-50 mt-auto border-t border-stone-200">
          <p className="text-xs text-center text-stone-400">© {new Date().getFullYear()} Kamlesh Suits.</p>
        </div>
      </div>
    </>
  );
};

export default Navbar;
