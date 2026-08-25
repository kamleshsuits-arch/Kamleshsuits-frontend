import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { HiCheck, HiClock, HiPhoneIncoming, HiSearch } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const OrderSuccessAnimation = ({ orderId, name, trackingPath = '/track-order', onClose }) => {
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
            Thank you, {name}. We received order <span className="text-primary font-black tracking-tight">{orderId}</span>.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <HiPhoneIncoming size={21} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-800">The store will call you</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-700">Please keep your phone available. Our team will call your saved number to confirm the products, address and payment preference.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
            <HiClock size={16} className="text-amber-500" />
            Status: Waiting for store confirmation
          </div>

          <p className="text-xs font-semibold leading-relaxed text-emerald-700">
            You do not need to call or send a WhatsApp message.
          </p>

          <div className="space-y-3 pt-3">
            <button
              onClick={() => {
                navigate(trackingPath);
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl active:scale-95"
            >
              <HiSearch size={18} /> Track My Order
            </button>
            <button 
              onClick={() => {
                navigate('/');
                onClose();
              }}
              className="w-full border-2 border-primary bg-white text-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-stone-50 transition-all active:scale-95"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessAnimation;
