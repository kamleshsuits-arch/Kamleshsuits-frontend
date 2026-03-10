import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 p-8 sm:p-10 relative">
        {/* Header */}
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            ADD DELIVERY LOCATION
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
          >
            <HiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input
                type="number"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.slice(0, 6));
                  setError('');
                }}
                placeholder="Type Delivery Pincode"
                className="w-full bg-transparent border-b-2 border-stone-200 py-4 text-lg font-bold text-primary placeholder:text-stone-300 focus:outline-none focus:border-[#CFB53B] transition-colors appearance-none"
                autoFocus
              />
              <button 
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#CFB53B] font-black text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
              >
                SUBMIT
              </button>
            </div>
            
            {error && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>
            )}

            <div className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
              <HiLocationMarker className="text-amber-500 mt-1 shrink-0" size={18} />
              <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider leading-relaxed">
                Enter your pincode to check delivery availability and unlock location-specific offers.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
