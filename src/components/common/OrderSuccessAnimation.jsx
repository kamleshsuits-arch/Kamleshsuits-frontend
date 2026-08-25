import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { HiCheck, HiOutlineShoppingBag, HiPhone } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const OrderSuccessAnimation = ({ orderId, name, whatsappUrl, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const tl = gsap.timeline();

    // Backdrop reveal
    tl.fromTo('.success-backdrop',
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );

    // Card slide up
    tl.fromTo('.success-card',
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.2)' },
      '-=0.3'
    );

    // Checkmark scale & pulse
    tl.fromTo('.checkmark-circle',
      { scale: 0, rotation: -45 },
      { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' },
      '-=0.4'
    );

    // Content reveal
    tl.fromTo('.success-content > *',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
      '-=0.2'
    );

  }, []);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="success-backdrop absolute inset-0 bg-stone-900/40 backdrop-blur-md" />
      
      {/* Main Card */}
      <div className="success-card relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden text-center p-10">
        <div className="checkmark-circle w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200">
          <HiCheck size={48} />
        </div>

        <div className="success-content space-y-4">
          <h2 className="text-2xl font-serif text-primary">Order Request Received</h2>
          <p className="text-secondary text-sm leading-relaxed">
            Thank you, {name}. Your order <span className="text-primary font-black tracking-tight">{orderId}</span> is waiting for store confirmation.
          </p>
          
          <div className="py-6 scale-90">
             <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#CFB53B] mb-2">
                <HiOutlineShoppingBag size={16} />
                Next step: confirm on WhatsApp or call
             </div>
             <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-[#CFB53B] rounded-full animate-pulse" />
             </div>
          </div>

          <div className="space-y-3 pt-6">
            <a
              href={whatsappUrl}
              className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2"
            >
              <FaWhatsapp size={18} /> Confirm on WhatsApp
            </a>
            <a
              href="tel:+919992304505"
              className="w-full bg-white border-2 border-primary text-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              <HiPhone size={18} /> Call the Store
            </a>
            <button 
              onClick={() => {
                navigate('/');
                onClose();
              }}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-accent transition-all active:scale-95"
            >
              Continue Shopping
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-stone-50 text-stone-400 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-100 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessAnimation;
