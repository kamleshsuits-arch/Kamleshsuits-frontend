import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HiLocationMarker, HiChevronRight } from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import LocationModal from './LocationModal';

const LocationBar = ({ className = "" }) => {
  const { deliveryLocation } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`w-full bg-white py-3 px-4 cursor-pointer hover:bg-stone-50 transition-colors ${className}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#CFB53B]/10 flex items-center justify-center text-[#CFB53B]">
              <HiLocationMarker size={18} />
            </div>
            
            {deliveryLocation ? (
              <p className="text-xs text-stone-600 font-bold tracking-tight">
                Delivering to <span className="text-primary font-black">{deliveryLocation.city} - {deliveryLocation.pincode}</span>
              </p>
            ) : (
              <p className="text-xs text-stone-600 font-bold tracking-tight">
                Add delivery location to check extra discount {">>>"}
              </p>
            )}
          </div>
          
          <HiChevronRight className="text-stone-400" size={20} />
        </div>
      </div>

      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default LocationBar;
