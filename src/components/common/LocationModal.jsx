import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiX, HiLocationMarker } from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import { SUPPORTED_REGIONS } from '../../utils/deliveryUtils';

const LocationModal = ({ isOpen, onClose }) => {
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');
  const { setDeliveryLocation } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    // Find city from prefix
    const prefix = pincode.substring(0, 3);
    const region = SUPPORTED_REGIONS.find(r => r.prefix === prefix);
    const city = region ? region.label : 'Select Area';

    setDeliveryLocation({ city, pincode });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={onClose}
      />
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 relative z-10 transition-all">
        {/* Header */}
        <div className="px-5 py-4 flex justify-between items-center border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-700 uppercase tracking-tight">
            ADD DELIVERY LOCATION
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <HiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-10 sm:py-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group border-b border-stone-300 pb-2 flex items-center gap-4">
              <input
                type="number"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.slice(0, 6));
                  setError('');
                }}
                placeholder="Type Delivery Pincode"
                className="flex-1 bg-transparent py-2 text-base font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none appearance-none"
                autoFocus
              />
              <button 
                type="submit"
                className="text-accent font-bold text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                SUBMIT
              </button>
            </div>
            
            {error && (
              <p className="text-red-500 text-[11px] font-medium">{error}</p>
            )}

            <div className="flex items-start gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
              <HiLocationMarker className="text-stone-400 mt-0.5 shrink-0" size={18} />
              <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                Enter your pincode to check delivery availability and unlock location-specific offers.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LocationModal;
