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
      className="fixed top-24 right-4 z-50 flex items-center gap-4 bg-white/90 backdrop-blur-md border border-stone-200 shadow-xl p-4 rounded-lg min-w-[300px] max-w-md"
    >
      {/* Image */}
      {image && (
        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-stone-100">
          <img src={image} alt="Product" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${type === 'error' ? 'text-red-500' : 'text-green-600'} flex items-center gap-1`}>
          {type === 'error' ? <HiXCircle /> : <HiCheckCircle />}
          {type === 'error' ? 'Removed' : 'Success'}
        </h4>
        <p className="text-sm text-secondary mt-0.5">{message}</p>
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
