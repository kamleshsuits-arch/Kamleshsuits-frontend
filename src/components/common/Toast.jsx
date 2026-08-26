// src/components/Toast.jsx
import React, { useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiX } from 'react-icons/hi';
import { gsap } from 'gsap';

const Toast = ({ message, image, show, onClose, type = 'success' }) => {
  useEffect(() => {
    if (show) {
      // Slide in
      gsap.fromTo("#toast-notification", 
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Auto dismiss
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClose = () => {
    gsap.to("#toast-notification", {
      x: 100,
      opacity: 0,
      duration: 0.3,
      ease: "power3.in",
      onComplete: onClose
    });
  };

  if (!show) return null;

  return (
    <div 
      id="toast-notification"
      className="fixed left-3 right-3 top-20 z-[120] flex min-w-0 items-center gap-3 rounded-xl border border-stone-200 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:left-auto sm:right-4 sm:top-24 sm:min-w-[300px] sm:max-w-md sm:gap-4 sm:p-4"
    >
      {/* Image */}
      {image && (
        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-stone-100">
          <img src={image} alt="Product" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h4 className={`text-sm font-bold ${type === 'error' ? 'text-red-500' : 'text-green-600'} flex items-center gap-1`}>
          {type === 'error' ? <HiXCircle /> : <HiCheckCircle />}
          {type === 'error' ? 'Removed' : 'Success'}
        </h4>
        <p className="mt-0.5 break-words text-sm text-secondary">{message}</p>
      </div>

      {/* Close Button */}
      <button 
        onClick={handleClose}
        className="text-stone-400 hover:text-primary transition p-1"
      >
        <HiX size={20} />
      </button>
    </div>
  );
};

export default Toast;
