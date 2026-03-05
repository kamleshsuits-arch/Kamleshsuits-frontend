import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiSparkles, HiTag, HiHeart, HiUser } from 'react-icons/hi';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', icon: HiHome, path: '/' },
    { name: 'New', icon: HiSparkles, path: '/new-arrivals' },
    { name: 'Sale', icon: HiTag, path: '/sale' },
    { name: 'Wishlist', icon: HiHeart, path: '/wishlist' },
    { name: 'Account', icon: HiUser, path: '/account' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary' : 'text-stone-400 hover:text-secondary'
              }`}
            >
              <Icon size={24} className={isActive ? 'fill-current' : 'stroke-current'} />
              <span className="text-[10px] font-medium tracking-wide uppercase">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
