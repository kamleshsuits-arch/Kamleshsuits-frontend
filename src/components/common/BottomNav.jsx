import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiHome, HiSparkles, HiHeart, HiUser, HiOutlineViewGrid, HiShoppingBag, HiArrowRight, HiTag } from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, wishlistItems } = useCart();

  const navItems = [
    { name: 'Home',        icon: HiHome,             path: '/' },
    { name: 'New',         icon: HiSparkles,         path: '/new-arrivals' },
    { name: 'Sale',        icon: HiTag,              path: '/sale' },
    { name: 'Saved',       icon: HiHeart,            path: '/wishlist', badge: wishlistItems.length },
    { name: 'Account',     icon: HiUser,             path: '/account' },
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
    window.scrollTo(0, 0); // Ensure the new page starts at the top
  };

  const getSafeImg = (img) => {
    if (!img) return null;
    if (Array.isArray(img)) return img[0];
    if (typeof img === 'string') return img.replace(/[\[\]"]/g, '').split(',')[0];
    return null;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">

      {/* Floating Cart FAB — Blinkit Style (Green with items) */}
      {cartItems.length > 0 && (
        <div className="px-5 pb-2 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
          <Link
            to="/cart"
            className="flex items-center justify-between mx-auto max-w-[80%] px-4 py-2 rounded-2xl text-white bg-[#CFB53B] transition-transform active:scale-95 shadow-xl"
          >
            <div className="flex items-center gap-2">
              {/* Item icons overflow — slightly smaller icons for compact look */}
              <div className="flex -space-x-3 overflow-hidden translate-x-1">
                 {cartItems.slice(0, 3).map((item, idx) => (
                   <div key={idx} className="w-8 h-8 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-white flex-shrink-0">
                      <img 
                        src={getSafeImg(item.images || item.image)} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                   </div>
                 ))}
              </div>
              
              <div className="ml-1">
                <p className="text-xs font-black tracking-tight leading-none uppercase">Bag</p>
                <p className="text-[9px] font-bold text-white/90 mt-0.5">{cartItems.length} {cartItems.length === 1 ? 'PC' : 'PCS'}</p>
              </div>
            </div>

            {/* Right side circle arrow (simplified) */}
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
               <HiArrowRight size={16} className="text-white" />
            </div>
          </Link>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="bg-white/95 backdrop-blur-md border-t border-stone-100 shadow-[0_-4px_24px_rgba(0,0,0,0.15)] pointer-events-auto pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-14 px-1 pt-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center justify-center w-full h-full space-y-0.5 relative"
              >
                <div className={`relative flex items-center justify-center w-10 h-8 rounded-2xl transition-all duration-300 ${
                  isActive ? 'bg-[#CFB53B] shadow-md shadow-[#CFB53B]/30' : ''
                }`}>
                  <Icon size={isActive ? 20 : 22} className={`transition-all duration-300 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  {item.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-black flex items-center justify-center ${
                      isActive ? 'bg-white text-accent' : 'bg-accent text-white'
                    }`}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold tracking-wide transition-all duration-300 ${isActive ? 'text-[#CFB53B]' : 'text-stone-400'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
