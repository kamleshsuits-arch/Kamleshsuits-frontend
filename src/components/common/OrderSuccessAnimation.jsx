import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { HiCheck, HiOutlineShoppingBag } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const OrderSuccessAnimation = ({ orderId, name, onClose }) => {
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

    // Confetti burst
    triggerBurst();
  }, []);

  const triggerBurst = () => {
    const colors = ['#CFB53B', '#1C5BBA', '#10B981', '#F59E0B'];
    const container = document.getElementById('success-burst-container');
    if (!container) return;

    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      particle.classList.add('absolute', 'w-1.5', 'h-1.5', 'rounded-full');
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = '50%';
      particle.style.top = '40%';
      container.appendChild(particle);

      gsap.to(particle, {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400 - 100,
        opacity: 0,
        scale: 0.5,
        rotation: Math.random() * 360,
        duration: 1.5 + Math.random(),
        ease: 'power2.out',
        onComplete: () => particle.remove(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="success-backdrop absolute inset-0 bg-stone-900/40 backdrop-blur-md" />
      
      <div id="success-burst-container" className="absolute inset-0 pointer-events-none" />

      {/* Main Card */}
      <div className="success-card relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden text-center p-10">
        <div className="checkmark-circle w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200">
          <HiCheck size={48} />
        </div>

        <div className="success-content space-y-4">
          <h2 className="text-2xl font-serif text-primary">Order Placed!</h2>
          <p className="text-secondary text-sm leading-relaxed">
            Beautiful choice, {name}! Your order <span className="text-primary font-black tracking-tight">#{orderId}</span> is being prepared.
          </p>
          
          <div className="py-6 scale-90">
             <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#CFB53B] mb-2">
                <HiOutlineShoppingBag size={16} />
                Est. Delivery: 3-5 Days
             </div>
             <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-[#CFB53B] rounded-full animate-pulse" />
             </div>
          </div>

          <div className="space-y-3 pt-6">
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
