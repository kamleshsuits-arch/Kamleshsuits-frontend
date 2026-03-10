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
        className={`w-full bg-white py-2.5 px-4 cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-100 ${className}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiLocationMarker className="text-[#3b82f6]" size={16} />
            
            {deliveryLocation ? (
              <p className="text-[13px] text-stone-600 font-medium">
                Delivering to <span className="text-stone-900 font-bold">{deliveryLocation.city} - {deliveryLocation.pincode}</span>
              </p>
            ) : (
              <p className="text-[13px] text-stone-500 font-medium">
                Add delivery location to check extra discount {">>>"}
              </p>
            )}
          </div>
          
          <HiChevronRight className="text-stone-400" size={18} />
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
